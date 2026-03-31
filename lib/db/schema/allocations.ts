import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { eventBookings } from "./bookings";
import { checks } from "./checks";
import { allocationTypeEnum, fundingSourceTypeEnum } from "./enums";
import { checkEvents } from "./events";

export const checkAllocations = pgTable(
  "check_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    checkId: uuid("check_id")
      .notNull()
      .references(() => checks.id),
    eventBookingId: uuid("event_booking_id").references(() => eventBookings.id),
    allocationType: allocationTypeEnum("allocation_type").notNull(),
    fundingSourceType: fundingSourceTypeEnum("funding_source_type").notNull(),
    sourceRef: text("source_ref").notNull(),
    amountCents: integer("amount_cents").notNull(),
    appliedByEventId: uuid("applied_by_event_id").references(() => checkEvents.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    checkIdx: index("check_allocations_check_idx").on(table.checkId),
    bookingIdx: index("check_allocations_booking_idx").on(table.eventBookingId),
    allocationTypeIdx: index("check_allocations_type_idx").on(table.allocationType),
    amountPositive: check(
      "check_allocations_amount_positive",
      sql`${table.amountCents} > 0`,
    ),
  }),
);
