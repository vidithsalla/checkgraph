import type { ActorType, EventGroup, EventType, SourceSystem } from "@/lib/db/schema";

export const eventTypeToGroup: Record<EventType, EventGroup> = {
  check_created: "lifecycle",
  check_opened: "lifecycle",
  check_viewed_by_diner: "lifecycle",
  items_synced: "lifecycle",
  tip_selected: "payment",
  split_requested: "payment",
  split_confirmed: "payment",
  payment_method_attached: "payment",
  preauth_placed: "payment",
  preauth_released: "payment",
  payment_authorization_requested: "payment",
  payment_authorized: "payment",
  payment_authorization_failed: "payment",
  payment_capture_requested: "payment",
  payment_captured: "payment",
  payment_capture_failed: "payment",
  final_receipt_received: "receipt",
  final_receipt_missing_timeout: "receipt",
  rewards_eligibility_confirmed: "rewards",
  rewards_post_requested: "rewards",
  rewards_posted: "rewards",
  rewards_post_failed: "rewards",
  check_closed: "lifecycle",
  check_reopened: "lifecycle",
  manual_override_applied: "overrides",
  manual_override_reverted: "overrides",
  support_case_created: "support",
  support_case_resolved: "support",
  guest_checkin_detected: "identity",
  reservation_attached: "identity",
  booking_attached: "booking",
  organizer_attached: "booking",
  reservation_holder_attached: "booking",
  payer_attached: "booking",
  deposit_requested: "deposit",
  deposit_hold_placed: "deposit",
  deposit_captured: "deposit",
  deposit_applied_to_check: "allocation",
  deposit_refund_initiated: "deposit",
  hosted_credit_applied_to_check: "allocation",
  booking_cancelled: "booking",
  payment_identity_detected: "identity",
  identity_match_suggested: "identity",
  identity_match_confirmed: "identity",
  identity_match_rejected: "identity",
  identity_merge_applied: "identity",
  duplicate_charge_suspected: "operations",
  payer_reservation_mismatch_detected: "identity",
  receipt_itemization_unavailable: "receipt",
  network_degraded: "operations",
  terminal_offline: "operations",
  fallback_mode_entered: "operations",
  fallback_mode_exited: "operations",
};

export type SeedEventInput = {
  type: EventType;
  occurredAt: string;
  payload?: Record<string, unknown>;
  sourceSystem?: SourceSystem;
  actorType?: ActorType;
  actorId?: string;
  correlationId?: string;
  idempotencyKey?: string;
};

export function createSeedEvent(input: SeedEventInput) {
  return {
    type: input.type,
    eventGroup: eventTypeToGroup[input.type],
    occurredAt: input.occurredAt,
    payload: input.payload ?? {},
    sourceSystem: input.sourceSystem ?? "scenario_seed",
    actorType: input.actorType ?? "system",
    actorId: input.actorId ?? null,
    correlationId: input.correlationId ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
  };
}
