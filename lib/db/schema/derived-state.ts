import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { checks } from "./checks";
import {
  bookingStateEnum,
  depositStateEnum,
  exceptionStateEnum,
  hostedSettlementStateEnum,
  identityStateEnum,
  paymentStateEnum,
  receiptStateEnum,
  roleResolutionStateEnum,
  rewardsStateEnum,
  roleTypeEnum,
  serviceStateEnum,
} from "./enums";
import { guestProfiles } from "./guests";

export const derivedCheckState = pgTable(
  "derived_check_state",
  {
    checkId: uuid("check_id")
      .primaryKey()
      .references(() => checks.id),
    paymentState: paymentStateEnum("payment_state").notNull(),
    receiptState: receiptStateEnum("receipt_state").notNull(),
    rewardsState: rewardsStateEnum("rewards_state").notNull(),
    identityState: identityStateEnum("identity_state").notNull(),
    exceptionState: exceptionStateEnum("exception_state").notNull(),
    serviceState: serviceStateEnum("service_state").notNull(),
    bookingState: bookingStateEnum("booking_state").notNull().default("none"),
    depositState: depositStateEnum("deposit_state").notNull().default("none"),
    // Funding reconciliation only; do not treat this as full payment or service completion.
    hostedSettlementState: hostedSettlementStateEnum("hosted_settlement_state")
      .notNull()
      .default("none"),
    roleResolutionState: roleResolutionStateEnum("role_resolution_state"),
    organizerGuestId: uuid("organizer_guest_id").references(() => guestProfiles.id),
    primaryGuestId: uuid("primary_guest_id").references(() => guestProfiles.id),
    payerGuestId: uuid("payer_guest_id").references(() => guestProfiles.id),
    reservationGuestId: uuid("reservation_guest_id").references(() => guestProfiles.id),
    depositAmountCents: integer("deposit_amount_cents").notNull().default(0),
    depositAppliedAmountCents: integer("deposit_applied_amount_cents").notNull().default(0),
    hostedAmountCents: integer("hosted_amount_cents").notNull().default(0),
    hostedAppliedAmountCents: integer("hosted_applied_amount_cents").notNull().default(0),
    remainingBalanceCents: integer("remaining_balance_cents").notNull().default(0),
    directPaymentDueCents: integer("direct_payment_due_cents").notNull().default(0),
    fundingSummaryJson: jsonb("funding_summary_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    nextActionOwner: roleTypeEnum("next_action_owner"),
    nextActionText: text("next_action_text"),
    activeExceptionCount: integer("active_exception_count").notNull().default(0),
    lastEventAt: timestamp("last_event_at", { withTimezone: true }),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    exceptionStateIdx: index("derived_check_state_exception_state_idx").on(
      table.exceptionState,
    ),
    paymentStateIdx: index("derived_check_state_payment_state_idx").on(
      table.paymentState,
    ),
    identityStateIdx: index("derived_check_state_identity_state_idx").on(
      table.identityState,
    ),
    bookingStateIdx: index("derived_check_state_booking_state_idx").on(table.bookingState),
    depositStateIdx: index("derived_check_state_deposit_state_idx").on(table.depositState),
    hostedSettlementIdx: index("derived_check_state_hosted_settlement_state_idx").on(
      table.hostedSettlementState,
    ),
    lastEventIdx: index("derived_check_state_last_event_idx").on(table.lastEventAt),
  }),
);
