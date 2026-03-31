import type { RewardsState } from "@/lib/db/schema";
import type { DomainCheckContext } from "@/lib/domain/types";

export function deriveRewardsState(
  context: DomainCheckContext,
  paymentState:
    | "not_started"
    | "preauthorized"
    | "authorization_pending"
    | "authorized"
    | "capture_pending"
    | "captured"
    | "capture_failed"
    | "closed"
    | "unknown",
  receiptState: "not_available" | "pending" | "received" | "missing_after_timeout",
): RewardsState {
  const eventTypes = new Set(context.events.map((event) => event.type));

  if (eventTypes.has("rewards_post_failed")) {
    return "failed";
  }
  if (eventTypes.has("rewards_posted")) {
    return "posted";
  }
  if (eventTypes.has("rewards_post_requested")) {
    return "posting";
  }
  if (receiptState === "received" && (paymentState === "captured" || paymentState === "closed")) {
    return "ready_to_post";
  }
  if (
    (receiptState === "pending" || receiptState === "missing_after_timeout") &&
    (paymentState === "captured" || paymentState === "closed")
  ) {
    return "awaiting_final_receipt";
  }
  return "not_eligible";
}
