import type { PaymentState } from "@/lib/db/schema";
import type { DomainCheckContext } from "@/lib/domain/types";

export function derivePaymentState(context: DomainCheckContext): PaymentState {
  const eventTypes = new Set(context.events.map((event) => event.type));

  if (eventTypes.has("check_closed")) {
    return "closed";
  }
  if (eventTypes.has("payment_capture_failed")) {
    return "capture_failed";
  }
  if (eventTypes.has("payment_captured")) {
    return "captured";
  }
  if (eventTypes.has("payment_capture_requested")) {
    return "capture_pending";
  }
  if (eventTypes.has("payment_authorized")) {
    return "authorized";
  }
  if (eventTypes.has("payment_authorization_requested")) {
    return "authorization_pending";
  }
  if (eventTypes.has("preauth_placed")) {
    return "preauthorized";
  }
  if (eventTypes.has("check_created") || eventTypes.has("check_opened")) {
    return "not_started";
  }
  return "unknown";
}
