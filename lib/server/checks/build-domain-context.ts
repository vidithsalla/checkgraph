import { eq, isNotNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";
import { projectCheckAllocations } from "@/lib/domain/allocations/project-check-allocations";
import { generateCandidateMatches } from "@/lib/domain/identity/generate-candidate-matches";
import { projectBookingDeposits } from "@/lib/domain/deposits/project-booking-deposits";
import type {
  DomainCheckContext,
  DomainFragment,
  DomainGuestProfile,
} from "@/lib/domain/types";
import { createSeedEvent } from "@/lib/domain/events/event-group-map";
import { deriveRoleIds } from "./role-ids";

type DbLike = PostgresJsDatabase<typeof schema>;

function buildKnownAliasMap(fragments: Array<{ guestProfileId: string | null; paymentAlias: string | null }>) {
  const aliasMap = new Map<string, string[]>();

  for (const fragment of fragments) {
    if (!fragment.guestProfileId || !fragment.paymentAlias) {
      continue;
    }

    const current = aliasMap.get(fragment.guestProfileId) ?? [];
    if (!current.includes(fragment.paymentAlias)) {
      current.push(fragment.paymentAlias);
    }
    aliasMap.set(fragment.guestProfileId, current);
  }

  return aliasMap;
}

export async function buildDomainContextForCheck(db: DbLike, checkId: string) {
  const [check] = await db
    .select()
    .from(schema.checks)
    .where(eq(schema.checks.id, checkId))
    .limit(1);

  if (!check) {
    return null;
  }

  const [booking, events, fragments, allGuests, allKnownAliasFragments] = await Promise.all([
    check.eventBookingId
      ? db
          .select()
          .from(schema.eventBookings)
          .where(eq(schema.eventBookings.id, check.eventBookingId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    db
      .select()
      .from(schema.checkEvents)
      .where(eq(schema.checkEvents.checkId, check.id))
      .orderBy(schema.checkEvents.sequenceNo),
    db
      .select()
      .from(schema.guestIdentityFragments)
      .where(eq(schema.guestIdentityFragments.checkId, check.id)),
    db.select().from(schema.guestProfiles),
    db
      .select({
        guestProfileId: schema.guestIdentityFragments.guestProfileId,
        paymentAlias: schema.guestIdentityFragments.paymentAlias,
      })
      .from(schema.guestIdentityFragments)
      .where(isNotNull(schema.guestIdentityFragments.guestProfileId)),
  ]);

  const aliasMap = buildKnownAliasMap(allKnownAliasFragments);
  const guests: DomainGuestProfile[] = allGuests.map((guest) => ({
    id: guest.id,
    displayName: guest.displayName,
    firstName: guest.firstName ?? undefined,
    lastName: guest.lastName ?? undefined,
    phoneNormalized: guest.phoneNormalized ?? undefined,
    emailNormalized: guest.emailNormalized ?? undefined,
    vipTier: guest.vipTier ?? undefined,
    knownPaymentAliases: aliasMap.get(guest.id) ?? [],
  }));

  const domainFragments: DomainFragment[] = fragments.map((fragment) => ({
    id: fragment.id,
    sourceSystem: fragment.sourceSystem,
    externalIdentityRef: fragment.externalIdentityRef,
    rawName: fragment.rawName ?? undefined,
    rawPhone: fragment.rawPhone ?? undefined,
    rawEmail: fragment.rawEmail ?? undefined,
    paymentAlias: fragment.paymentAlias ?? undefined,
    reservationRef: fragment.reservationRef ?? undefined,
    deviceRef: fragment.deviceRef ?? undefined,
    guestProfileId: fragment.guestProfileId ?? undefined,
    metadata: fragment.metadataJson,
  }));

  const suggestions = generateCandidateMatches(domainFragments, guests);
  const roleIds = deriveRoleIds({
    serviceChannel: check.serviceChannel,
    fragments: domainFragments,
    suggestions,
  });

  const baseContext: DomainCheckContext = {
    checkId: check.id,
    scenarioId: check.scenarioId ?? undefined,
    openedAt: check.openedAt.toISOString(),
    totalAmountCents: check.totalAmountCents,
    serviceChannel: check.serviceChannel,
    reservationRef: check.reservationRef ?? undefined,
    booking: booking
      ? {
          id: booking.id,
          bookingRef: booking.bookingRef,
          bookingType: booking.bookingType,
          status: booking.status,
          bookingName: booking.eventName,
          organizerGuestId: booking.organizerGuestId ?? undefined,
          payerGuestId: booking.payerGuestId ?? undefined,
          reservationGuestId: booking.reservationGuestId ?? undefined,
          partySize: booking.partySize ?? undefined,
          depositAmountCents: booking.depositAmountCents ?? 0,
          hostedAmountCents: booking.hostedAmountCents,
          eventDate: booking.eventDate?.toISOString(),
          notes: booking.notes ?? undefined,
        }
      : undefined,
    organizerGuestId: booking?.organizerGuestId ?? undefined,
    primaryGuestId:
      roleIds.primaryGuestId ??
      booking?.payerGuestId ??
      booking?.reservationGuestId ??
      booking?.organizerGuestId ??
      undefined,
    payerGuestId: booking?.payerGuestId ?? roleIds.payerGuestId,
    reservationGuestId:
      booking?.reservationGuestId ?? roleIds.reservationGuestId,
    deposits: [],
    allocations: [],
    fragments: domainFragments,
    suggestions,
    events: events.map((event) => ({
      id: event.id,
      sequenceNo: event.sequenceNo,
      ...createSeedEvent({
        type: event.eventType,
        occurredAt: event.occurredAt.toISOString(),
        payload: event.payloadJson,
        sourceSystem: event.sourceSystem,
        actorType: event.actorType,
        actorId: event.actorId ?? undefined,
        correlationId: event.correlationId ?? undefined,
        idempotencyKey: event.idempotencyKey ?? undefined,
      }),
    })),
  };

  const context: DomainCheckContext = {
    ...baseContext,
    deposits: projectBookingDeposits(baseContext),
    allocations: projectCheckAllocations(baseContext),
  };

  return { check, context, suggestions };
}
