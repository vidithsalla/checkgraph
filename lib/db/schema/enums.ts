import { pgEnum } from "drizzle-orm/pg-core";

export const serviceModeValues = [
  "full_service",
  "quick_service",
  "bar_lounge",
  "private_event",
] as const;

export const serviceChannelValues = [
  "table_service",
  "bar_tab",
  "counter",
  "private_dining",
  "hosted_event",
] as const;

export const paymentStateValues = [
  "not_started",
  "preauthorized",
  "authorization_pending",
  "authorized",
  "capture_pending",
  "captured",
  "capture_failed",
  "closed",
  "unknown",
] as const;

export const receiptStateValues = [
  "not_available",
  "pending",
  "received",
  "missing_after_timeout",
] as const;

export const rewardsStateValues = [
  "not_eligible",
  "awaiting_final_receipt",
  "ready_to_post",
  "posting",
  "posted",
  "failed",
] as const;

export const identityStateValues = [
  "unlinked",
  "linked_confident",
  "linked_low_confidence",
  "ambiguous",
  "mismatch_flagged",
] as const;

export const exceptionStateValues = [
  "none",
  "warning",
  "action_required",
  "urgent",
] as const;

export const serviceStateValues = [
  "active",
  "awaiting_guest_action",
  "awaiting_staff_action",
  "awaiting_backend_completion",
  "blocked",
  "completed",
] as const;

export const eventGroupValues = [
  "payment",
  "receipt",
  "rewards",
  "identity",
  "booking",
  "deposit",
  "allocation",
  "operations",
  "support",
  "overrides",
  "lifecycle",
] as const;

export const eventTypeValues = [
  "check_created",
  "check_opened",
  "check_viewed_by_diner",
  "items_synced",
  "tip_selected",
  "split_requested",
  "split_confirmed",
  "payment_method_attached",
  "preauth_placed",
  "preauth_released",
  "payment_authorization_requested",
  "payment_authorized",
  "payment_authorization_failed",
  "payment_capture_requested",
  "payment_captured",
  "payment_capture_failed",
  "final_receipt_received",
  "final_receipt_missing_timeout",
  "rewards_eligibility_confirmed",
  "rewards_post_requested",
  "rewards_posted",
  "rewards_post_failed",
  "check_closed",
  "check_reopened",
  "manual_override_applied",
  "manual_override_reverted",
  "support_case_created",
  "support_case_resolved",
  "guest_checkin_detected",
  "reservation_attached",
  "booking_attached",
  "organizer_attached",
  "reservation_holder_attached",
  "payer_attached",
  "deposit_requested",
  "deposit_hold_placed",
  "deposit_captured",
  "deposit_applied_to_check",
  "deposit_refund_initiated",
  "hosted_credit_applied_to_check",
  "booking_cancelled",
  "payment_identity_detected",
  "identity_match_suggested",
  "identity_match_confirmed",
  "identity_match_rejected",
  "identity_merge_applied",
  "duplicate_charge_suspected",
  "payer_reservation_mismatch_detected",
  "receipt_itemization_unavailable",
  "network_degraded",
  "terminal_offline",
  "fallback_mode_entered",
  "fallback_mode_exited",
] as const;

export const sourceSystemValues = [
  "mobile_app",
  "terminal",
  "pos",
  "rewards_engine",
  "identity_service",
  "ops_console",
  "support_console",
  "scenario_seed",
] as const;

export const actorTypeValues = [
  "guest",
  "server",
  "host",
  "manager",
  "support",
  "system",
  "admin",
] as const;

export const roleTypeValues = ["server", "manager", "support", "admin"] as const;

export const exceptionTypeValues = [
  "duplicate_charge_suspected",
  "auth_succeeded_capture_missing",
  "duplicate_capture_close_missing",
  "stale_preauth_visibility",
  "payment_state_unknown",
  "capture_failed_after_auth",
  "reopened_after_close",
  "final_receipt_missing_after_timeout",
  "receipt_itemization_unavailable",
  "receipt_amount_mismatch",
  "rewards_waiting_on_final_receipt",
  "rewards_failed_after_receipt",
  "rewards_posted_to_ambiguous_guest",
  "payer_reservation_mismatch",
  "multiple_plausible_guest_matches",
  "low_confidence_guest_assignment",
  "vip_profile_not_linked",
  "network_degraded_during_payment",
  "terminal_offline_during_close",
  "fallback_mode_unresolved",
  "manual_override_without_note",
  "deposit_captured_not_applied",
  "deposit_hold_stale",
  "deposit_refund_missing",
  "deposit_refunded_after_application",
  "deposit_state_unknown",
  "hosted_amount_missing_for_booking",
  "hosted_amount_exceeds_check",
  "hosted_settlement_mismatch",
  "remaining_balance_incorrect",
  "booking_cancelled_with_active_deposit",
  "organizer_payer_mismatch",
  "reservation_organizer_mismatch",
  "hosted_benefit_linked_to_wrong_guest",
  "unresolved_role_assignment",
  "guest_visible_hold_plus_final_charge",
  "deposit_application_not_reflected_in_receipt",
  "hosted_credit_available_not_applied",
] as const;

export const exceptionSeverityValues = [
  "warning",
  "action_required",
  "urgent",
] as const;

export const exceptionStatusValues = [
  "open",
  "acknowledged",
  "resolved",
  "suppressed",
] as const;

export const matchStatusValues = [
  "suggested",
  "confirmed",
  "rejected",
  "superseded",
] as const;

export const matchBandValues = ["high", "medium", "low"] as const;

export const supportCaseStatusValues = [
  "open",
  "investigating",
  "waiting_on_restaurant",
  "waiting_on_backend",
  "resolved",
  "closed",
] as const;

export const bookingTypeValues = [
  "private_dinner",
  "hosted_event",
  "corporate_dining",
] as const;

export const bookingStatusValues = [
  "lead",
  "deposit_pending",
  "deposit_paid",
  "deposit_held",
  "deposit_captured",
  "confirmed",
  "modified",
  "completed",
  "cancelled",
] as const;

export const bookingStateValues = [
  "none",
  "attached",
  "modified",
  "cancelled",
  "settled",
] as const;

export const depositTypeValues = [
  "reservation_hold",
  "event_deposit",
  "minimum_spend_deposit",
  "vip_guarantee_hold",
] as const;

export const depositStateValues = [
  "none",
  "requested",
  "hold_active",
  "captured",
  "partially_applied",
  "fully_applied",
  "refund_pending",
  "refunded",
  "unknown",
] as const;

export const hostedSettlementStateValues = [
  "none",
  "hosted_pending",
  "partially_reconciled",
  "fully_hosted",
  "settlement_mismatch",
  "settled",
] as const;

export const allocationTypeValues = [
  "deposit",
  "hosted_credit",
  "manual_credit",
] as const;

export const fundingSourceTypeValues = [
  "guest_direct_payment",
  "captured_deposit",
  "hosted_credit",
  "house_account",
  "manual_adjustment",
] as const;

export const roleResolutionStateValues = [
  "fully_resolved",
  "resolved_with_split",
  "ambiguous",
  "mismatch_flagged",
] as const;

export type ServiceMode = (typeof serviceModeValues)[number];
export type ServiceChannel = (typeof serviceChannelValues)[number];
export type PaymentState = (typeof paymentStateValues)[number];
export type ReceiptState = (typeof receiptStateValues)[number];
export type RewardsState = (typeof rewardsStateValues)[number];
export type IdentityState = (typeof identityStateValues)[number];
export type ExceptionState = (typeof exceptionStateValues)[number];
export type ServiceState = (typeof serviceStateValues)[number];
export type EventGroup = (typeof eventGroupValues)[number];
export type EventType = (typeof eventTypeValues)[number];
export type SourceSystem = (typeof sourceSystemValues)[number];
export type ActorType = (typeof actorTypeValues)[number];
export type RoleType = (typeof roleTypeValues)[number];
export type ExceptionType = (typeof exceptionTypeValues)[number];
export type ExceptionSeverity = (typeof exceptionSeverityValues)[number];
export type ExceptionStatus = (typeof exceptionStatusValues)[number];
export type MatchStatus = (typeof matchStatusValues)[number];
export type MatchBand = (typeof matchBandValues)[number];
export type SupportCaseStatus = (typeof supportCaseStatusValues)[number];
export type BookingType = (typeof bookingTypeValues)[number];
export type BookingStatus = (typeof bookingStatusValues)[number];
export type BookingState = (typeof bookingStateValues)[number];
export type DepositType = (typeof depositTypeValues)[number];
export type DepositState = (typeof depositStateValues)[number];
export type HostedSettlementState = (typeof hostedSettlementStateValues)[number];
export type AllocationType = (typeof allocationTypeValues)[number];
export type FundingSourceType = (typeof fundingSourceTypeValues)[number];
export type RoleResolutionState = (typeof roleResolutionStateValues)[number];

export const serviceModeEnum = pgEnum("service_mode", serviceModeValues);
export const serviceChannelEnum = pgEnum("service_channel", serviceChannelValues);
export const paymentStateEnum = pgEnum("payment_state", paymentStateValues);
export const receiptStateEnum = pgEnum("receipt_state", receiptStateValues);
export const rewardsStateEnum = pgEnum("rewards_state", rewardsStateValues);
export const identityStateEnum = pgEnum("identity_state", identityStateValues);
export const exceptionStateEnum = pgEnum("exception_state", exceptionStateValues);
export const serviceStateEnum = pgEnum("service_state", serviceStateValues);
export const eventGroupEnum = pgEnum("event_group", eventGroupValues);
export const eventTypeEnum = pgEnum("event_type", eventTypeValues);
export const sourceSystemEnum = pgEnum("source_system", sourceSystemValues);
export const actorTypeEnum = pgEnum("actor_type", actorTypeValues);
export const roleTypeEnum = pgEnum("role_type", roleTypeValues);
export const exceptionTypeEnum = pgEnum("exception_type", exceptionTypeValues);
export const exceptionSeverityEnum = pgEnum(
  "exception_severity",
  exceptionSeverityValues,
);
export const exceptionStatusEnum = pgEnum(
  "exception_status",
  exceptionStatusValues,
);
export const matchStatusEnum = pgEnum("match_status", matchStatusValues);
export const matchBandEnum = pgEnum("match_band", matchBandValues);
export const supportCaseStatusEnum = pgEnum(
  "support_case_status",
  supportCaseStatusValues,
);
export const bookingTypeEnum = pgEnum("booking_type", bookingTypeValues);
export const bookingStatusEnum = pgEnum("booking_status", bookingStatusValues);
export const bookingStateEnum = pgEnum("booking_state", bookingStateValues);
export const depositTypeEnum = pgEnum("deposit_type", depositTypeValues);
export const depositStateEnum = pgEnum("deposit_state", depositStateValues);
export const hostedSettlementStateEnum = pgEnum(
  "hosted_settlement_state",
  hostedSettlementStateValues,
);
export const allocationTypeEnum = pgEnum("allocation_type", allocationTypeValues);
export const fundingSourceTypeEnum = pgEnum(
  "funding_source_type",
  fundingSourceTypeValues,
);
export const roleResolutionStateEnum = pgEnum(
  "role_resolution_state",
  roleResolutionStateValues,
);
