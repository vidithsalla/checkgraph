import type { ReceiptState } from "@/lib/db/schema";
import type { DomainCheckContext } from "@/lib/domain/types";

export function deriveReceiptState(context: DomainCheckContext): ReceiptState {
  const eventTypes = new Set(context.events.map((event) => event.type));

  if (eventTypes.has("final_receipt_received")) {
    return "received";
  }
  if (eventTypes.has("final_receipt_missing_timeout")) {
    return "missing_after_timeout";
  }
  if (
    eventTypes.has("payment_captured") ||
    eventTypes.has("payment_capture_requested") ||
    eventTypes.has("payment_authorized")
  ) {
    return "pending";
  }
  return "not_available";
}
