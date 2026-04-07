import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import {
  auditLogs,
  bookingDeposits,
  checkEvents,
  checkAllocations,
  checks,
  eventBookings,
  exceptions,
  derivedCheckState,
  guestIdentityFragments,
  guestMatchSuggestions,
  guestProfiles,
  restaurants,
  supportCases,
} from "@/lib/db/schema";
import { canonicalScenarios, guestSeeds, restaurantSeeds } from "@/lib/db/seed";
import { createSeedEvent } from "@/lib/domain/events/event-group-map";
import { recomputeCheck } from "@/lib/server/checks/recompute-check";

function deriveRoleHint(input: {
  guestKey?: string;
  primaryGuestKey?: string;
  payerGuestKey?: string;
  reservationGuestKey?: string;
}) {
  if (!input.guestKey) {
    return undefined;
  }
  if (input.guestKey === input.reservationGuestKey) {
    return "reservation";
  }
  if (input.guestKey === input.payerGuestKey) {
    return "payer";
  }
  if (input.guestKey === input.primaryGuestKey) {
    return "primary";
  }
  return undefined;
}

async function clearDatabase() {
  await db.delete(auditLogs);
  await db.delete(supportCases);
  await db.delete(exceptions);
  await db.delete(derivedCheckState);
  await db.delete(checkAllocations);
  await db.delete(bookingDeposits);
  await db.delete(guestMatchSuggestions);
  await db.delete(guestIdentityFragments);
  await db.delete(checkEvents);
  await db.delete(checks);
  await db.delete(eventBookings);
  await db.delete(guestProfiles);
  await db.delete(restaurants);
}

function readBookingGuestKey(
  bookingInput:
    | NonNullable<(typeof canonicalScenarios)[number]["booking"]>
    | NonNullable<(typeof canonicalScenarios)[number]["eventBooking"]>,
  field:
    | "organizerGuestRef"
    | "payerGuestRef"
    | "reservationGuestRef"
    | "organizerGuestKey"
    | "payerGuestKey"
    | "reservationGuestKey",
) {
  const record = bookingInput as Record<string, unknown>;
  return typeof record[field] === "string" ? record[field] : undefined;
}

export async function seedDatabase() {
  await clearDatabase();

  const insertedRestaurants = await db.insert(restaurants).values(restaurantSeeds).returning();
  const restaurantIdBySlug = new Map(
    insertedRestaurants.map((restaurant) => [restaurant.slug, restaurant.id]),
  );

  const insertedGuests = await db
    .insert(guestProfiles)
    .values(
      guestSeeds.map((guest) => ({
        displayName: guest.displayName,
        firstName: guest.firstName,
        lastName: guest.lastName,
        phoneNormalized: guest.phoneNormalized ?? null,
        emailNormalized: guest.emailNormalized ?? null,
        vipTier: guest.vipTier ?? null,
        guestValueScore: guest.guestValueScore ?? null,
        notes: guest.notes ?? null,
      })),
    )
    .returning();
  const guestIdByKey = new Map(
    guestSeeds.map((guest, index) => [guest.key, insertedGuests[index]?.id]),
  );

  for (const scenario of canonicalScenarios) {
    const restaurantId = restaurantIdBySlug.get(scenario.restaurantSlug);
    if (!restaurantId) {
      throw new Error(`Missing restaurant seed for ${scenario.restaurantSlug}`);
    }

    let eventBookingId: string | null = null;
    const bookingInput = scenario.booking ?? scenario.eventBooking;

    if (bookingInput) {
      const [booking] = await db
        .insert(eventBookings)
        .values({
          restaurantId,
          bookingRef:
            "bookingRef" in bookingInput && bookingInput.bookingRef
              ? bookingInput.bookingRef
              : `${scenario.check.externalCheckRef}:booking`,
          bookingType: bookingInput.bookingType,
          status: bookingInput.status,
          eventName:
            "bookingName" in bookingInput ? bookingInput.bookingName : bookingInput.eventName,
          organizerGuestId:
            guestIdByKey.get(
              readBookingGuestKey(bookingInput, "organizerGuestRef") ??
                readBookingGuestKey(bookingInput, "organizerGuestKey") ??
                "",
            ) ?? null,
          payerGuestId:
            guestIdByKey.get(
              readBookingGuestKey(bookingInput, "payerGuestRef") ??
                readBookingGuestKey(bookingInput, "payerGuestKey") ??
                "",
            ) ?? null,
          reservationGuestId:
            guestIdByKey.get(
              readBookingGuestKey(bookingInput, "reservationGuestRef") ??
                readBookingGuestKey(bookingInput, "reservationGuestKey") ??
                "",
            ) ?? null,
          partySize: bookingInput.partySize ?? null,
          depositAmountCents: bookingInput.depositAmountCents ?? null,
          hostedAmountCents: bookingInput.hostedAmountCents ?? 0,
          eventDate: bookingInput.eventDate ? new Date(bookingInput.eventDate) : null,
          notes: bookingInput.notes ?? null,
        })
        .returning();
      eventBookingId = booking.id;
    }

    const [insertedCheck] = await db
      .insert(checks)
      .values({
        restaurantId,
        scenarioId: scenario.scenarioId,
        externalCheckRef: scenario.check.externalCheckRef,
        tableLabel: scenario.check.tableLabel ?? null,
        serviceChannel: scenario.check.serviceChannel,
        partySize: scenario.check.partySize ?? null,
        subtotalAmountCents: scenario.check.subtotalAmountCents,
        taxAmountCents: scenario.check.taxAmountCents,
        tipAmountCents: scenario.check.tipAmountCents,
        totalAmountCents: scenario.check.totalAmountCents,
        reservationRef: scenario.check.reservationRef ?? null,
        eventBookingId,
        isHosted: scenario.check.serviceChannel === "hosted_event" ? 1 : 0,
        openedAt: new Date(scenario.check.openedAt),
      })
      .returning();

    const fragmentIdByExternalRef = new Map<string, string>();
    if (scenario.fragments && scenario.fragments.length > 0) {
      const insertedFragments = await db
        .insert(guestIdentityFragments)
        .values(
          scenario.fragments.map((fragment) => ({
            checkId: insertedCheck.id,
            guestProfileId: guestIdByKey.get(fragment.guestKey ?? "") ?? null,
            sourceSystem: fragment.sourceSystem,
            externalIdentityRef: fragment.externalIdentityRef,
            rawName: fragment.rawName ?? null,
            rawPhone: fragment.rawPhone ?? null,
            rawEmail: fragment.rawEmail ?? null,
            paymentAlias: fragment.paymentAlias ?? null,
            reservationRef: fragment.reservationRef ?? null,
            deviceRef: fragment.deviceRef ?? null,
            metadataJson: {
              ...(fragment.metadata ?? {}),
              roleHint:
                deriveRoleHint({
                  guestKey: fragment.guestKey,
                  primaryGuestKey: scenario.primaryGuestKey,
                  payerGuestKey: scenario.payerGuestKey,
                  reservationGuestKey: scenario.reservationGuestKey,
                }) ?? null,
            },
          })),
        )
        .returning();

      for (let index = 0; index < insertedFragments.length; index += 1) {
        fragmentIdByExternalRef.set(
          scenario.fragments[index]!.externalIdentityRef,
          insertedFragments[index]!.id,
        );
      }
    }

    await db.insert(checkEvents).values(
      scenario.events.map((eventInput, index) => {
        const event = createSeedEvent(eventInput);
        return {
          checkId: insertedCheck.id,
          sequenceNo: index + 1,
          eventType: event.type,
          eventGroup: event.eventGroup,
          occurredAt: new Date(event.occurredAt),
          sourceSystem: event.sourceSystem,
          actorType: event.actorType,
          actorId: event.actorId ?? null,
          correlationId: event.correlationId ?? null,
          idempotencyKey: event.idempotencyKey ?? null,
          payloadJson: event.payload,
        };
      }),
    );

    await recomputeCheck(db, insertedCheck.id);

    if (scenario.supportCase) {
      await db.insert(supportCases).values({
        checkId: insertedCheck.id,
        status: scenario.supportCase.status,
        summary: scenario.supportCase.summary,
        guestVisibleSummary: scenario.supportCase.guestVisibleSummary ?? null,
      });
    }

    if (scenario.auditEntries && scenario.auditEntries.length > 0) {
      await db.insert(auditLogs).values(
        scenario.auditEntries.map((entry) => ({
          entityType: "check",
          entityId: insertedCheck.id,
          actionType: entry.actionType,
          actorRole: entry.actorRole,
          actorId: entry.actorId,
          note: entry.note ?? null,
          payloadJson: entry.payload ?? {},
        })),
      );
    }
  }

  return {
    restaurants: insertedRestaurants.length,
    guests: insertedGuests.length,
    scenarios: canonicalScenarios.length,
  };
}
