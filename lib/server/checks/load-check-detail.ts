import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import type { AssembledCheckDetail } from "./types";

export async function loadCheckDetail(
  externalCheckRef: string,
): Promise<AssembledCheckDetail | null> {
  const [base] = await db
    .select({
      check: schema.checks,
      restaurant: schema.restaurants,
      derivedState: schema.derivedCheckState,
    })
    .from(schema.checks)
    .innerJoin(schema.restaurants, eq(schema.checks.restaurantId, schema.restaurants.id))
    .leftJoin(schema.derivedCheckState, eq(schema.derivedCheckState.checkId, schema.checks.id))
    .where(eq(schema.checks.externalCheckRef, externalCheckRef))
    .limit(1);

  if (!base) {
    return null;
  }

  const checkId = base.check.id;

  const [booking, bookingDeposits, checkAllocations, activeExceptions, timeline, auditTrail, fragments, suggestions, guests] =
    await Promise.all([
      base.check.eventBookingId
        ? db
            .select()
            .from(schema.eventBookings)
            .where(eq(schema.eventBookings.id, base.check.eventBookingId))
            .limit(1)
            .then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
      base.check.eventBookingId
        ? db
            .select()
            .from(schema.bookingDeposits)
            .where(eq(schema.bookingDeposits.eventBookingId, base.check.eventBookingId))
            .orderBy(desc(schema.bookingDeposits.updatedAt))
        : Promise.resolve([]),
      db
        .select()
        .from(schema.checkAllocations)
        .where(eq(schema.checkAllocations.checkId, checkId))
        .orderBy(desc(schema.checkAllocations.createdAt)),
      db
        .select()
        .from(schema.exceptions)
        .where(
          and(
            eq(schema.exceptions.checkId, checkId),
            inArray(schema.exceptions.status, ["open", "acknowledged"]),
          ),
        )
        .orderBy(desc(schema.exceptions.detectedAt)),
      db
        .select()
        .from(schema.checkEvents)
        .where(eq(schema.checkEvents.checkId, checkId))
        .orderBy(asc(schema.checkEvents.sequenceNo)),
      db
        .select()
        .from(schema.auditLogs)
        .where(
          and(
            eq(schema.auditLogs.entityId, checkId),
            eq(schema.auditLogs.entityType, "check"),
          ),
        )
        .orderBy(desc(schema.auditLogs.createdAt)),
      db
        .select()
        .from(schema.guestIdentityFragments)
        .where(eq(schema.guestIdentityFragments.checkId, checkId)),
      db
        .select()
        .from(schema.guestMatchSuggestions)
        .where(eq(schema.guestMatchSuggestions.checkId, checkId))
        .orderBy(desc(schema.guestMatchSuggestions.confidenceScore)),
      db.select().from(schema.guestProfiles),
    ]);

  return {
    check: base.check,
    restaurant: base.restaurant,
    booking,
    bookingDeposits,
    checkAllocations,
    derivedState: base.derivedState,
    activeExceptions,
    timeline,
    auditTrail,
    fragments,
    suggestions,
    guestsById: new Map(guests.map((guest) => [guest.id, guest])),
  };
}
