import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { guestProfiles } from "./guests";
import { bookingStatusEnum, bookingTypeEnum } from "./enums";
import { restaurants } from "./restaurants";

export const eventBookings = pgTable(
  "event_bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    bookingRef: text("booking_ref").notNull().unique(),
    bookingType: bookingTypeEnum("booking_type").notNull(),
    status: bookingStatusEnum("status").notNull(),
    eventName: text("event_name").notNull(),
    organizerGuestId: uuid("organizer_guest_id").references(() => guestProfiles.id),
    payerGuestId: uuid("payer_guest_id").references(() => guestProfiles.id),
    reservationGuestId: uuid("reservation_guest_id").references(() => guestProfiles.id),
    partySize: integer("party_size"),
    depositAmountCents: integer("deposit_amount_cents"),
    hostedAmountCents: integer("hosted_amount_cents").notNull().default(0),
    eventDate: timestamp("event_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    restaurantIdx: index("event_bookings_restaurant_idx").on(table.restaurantId),
    bookingRefIdx: index("event_bookings_booking_ref_idx").on(table.bookingRef),
    depositNonNegative: check(
      "event_bookings_deposit_non_negative",
      sql`${table.depositAmountCents} >= 0`,
    ),
    hostedNonNegative: check(
      "event_bookings_hosted_non_negative",
      sql`${table.hostedAmountCents} >= 0`,
    ),
  }),
);
