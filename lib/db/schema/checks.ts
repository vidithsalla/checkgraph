import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { eventBookings } from "./bookings";
import { restaurants } from "./restaurants";
import { serviceChannelEnum } from "./enums";

export const checks = pgTable(
  "checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    scenarioId: text("scenario_id"),
    externalCheckRef: text("external_check_ref").notNull().unique(),
    tableLabel: text("table_label"),
    serviceChannel: serviceChannelEnum("service_channel").notNull(),
    statusLabel: text("status_label"),
    partySize: integer("party_size"),
    subtotalAmountCents: integer("subtotal_amount_cents").notNull(),
    taxAmountCents: integer("tax_amount_cents").notNull(),
    tipAmountCents: integer("tip_amount_cents").notNull().default(0),
    totalAmountCents: integer("total_amount_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    reservationRef: text("reservation_ref"),
    eventBookingId: uuid("event_booking_id").references(() => eventBookings.id),
    isHosted: integer("is_hosted").notNull().default(0),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    restaurantOpenedIdx: index("checks_restaurant_opened_idx").on(
      table.restaurantId,
      table.openedAt,
    ),
    scenarioIdx: index("checks_scenario_idx").on(table.scenarioId),
    bookingIdx: index("checks_booking_idx").on(table.eventBookingId),
    totalNonNegative: check(
      "checks_total_amount_non_negative",
      sql`${table.totalAmountCents} >= 0`,
    ),
    subtotalNonNegative: check(
      "checks_subtotal_amount_non_negative",
      sql`${table.subtotalAmountCents} >= 0`,
    ),
    taxNonNegative: check(
      "checks_tax_amount_non_negative",
      sql`${table.taxAmountCents} >= 0`,
    ),
    tipNonNegative: check(
      "checks_tip_amount_non_negative",
      sql`${table.tipAmountCents} >= 0`,
    ),
  }),
);
