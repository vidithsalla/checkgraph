import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { eventBookings } from "./bookings";
import { depositStateEnum, depositTypeEnum } from "./enums";
import { guestProfiles } from "./guests";

export const bookingDeposits = pgTable(
  "booking_deposits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventBookingId: uuid("event_booking_id")
      .notNull()
      .references(() => eventBookings.id),
    depositRef: text("deposit_ref").notNull().unique(),
    depositType: depositTypeEnum("deposit_type").notNull(),
    state: depositStateEnum("state").notNull(),
    amountCents: integer("amount_cents").notNull(),
    appliedAmountCents: integer("applied_amount_cents").notNull().default(0),
    refundableAmountCents: integer("refundable_amount_cents").notNull().default(0),
    fundingOwnerGuestId: uuid("funding_owner_guest_id").references(() => guestProfiles.id),
    captureRef: text("capture_ref"),
    holdRef: text("hold_ref"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    bookingIdx: index("booking_deposits_booking_idx").on(table.eventBookingId),
    stateIdx: index("booking_deposits_state_idx").on(table.state),
    amountNonNegative: check(
      "booking_deposits_amount_non_negative",
      sql`${table.amountCents} >= 0`,
    ),
    appliedNonNegative: check(
      "booking_deposits_applied_non_negative",
      sql`${table.appliedAmountCents} >= 0`,
    ),
    refundableNonNegative: check(
      "booking_deposits_refundable_non_negative",
      sql`${table.refundableAmountCents} >= 0`,
    ),
  }),
);
