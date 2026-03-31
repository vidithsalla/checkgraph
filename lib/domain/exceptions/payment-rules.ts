import type { DomainCheckContext, DerivedCheckState, DetectedException } from "@/lib/domain/types";

export function detectPaymentExceptions(
  context: DomainCheckContext,
  derivedState: DerivedCheckState,
): DetectedException[] {
  const eventTypes = new Set(context.events.map((event) => event.type));
  const latestEventAt = context.events[context.events.length - 1]?.occurredAt ?? context.openedAt;
  const exceptions: DetectedException[] = [];

  const captureCount = context.events.filter((event) => event.type === "payment_captured").length;
  if (eventTypes.has("duplicate_charge_suspected") || captureCount > 1) {
    exceptions.push({
      type: "duplicate_charge_suspected",
      severity: "urgent",
      explanationText: "Multiple capture signals were detected for the same check.",
      recommendedOwner: "support",
      recommendedNextAction:
        "Investigate duplicate capture before communicating final charge status.",
      detectedAt: latestEventAt,
    });
  }

  if (
    eventTypes.has("preauth_placed") &&
    eventTypes.has("payment_captured") &&
    !eventTypes.has("preauth_released")
  ) {
    exceptions.push({
      type: "stale_preauth_visibility",
      severity: "warning",
      explanationText: "The final charge was captured but the temporary hold has not been released.",
      recommendedOwner: "support",
      recommendedNextAction: "Explain hold versus captured charge and monitor release timing.",
      detectedAt: latestEventAt,
    });
  }

  if (derivedState.paymentState === "unknown") {
    exceptions.push({
      type: "payment_state_unknown",
      severity: "action_required",
      explanationText: "The event stream does not cleanly map to a known payment state.",
      recommendedOwner: "manager",
      recommendedNextAction: "Review the payment event timeline and confirm the current state.",
      detectedAt: latestEventAt,
    });
  }

  if (
    eventTypes.has("payment_authorized") &&
    eventTypes.has("payment_capture_failed")
  ) {
    exceptions.push({
      type: "capture_failed_after_auth",
      severity: "action_required",
      explanationText: "Authorization succeeded but capture failed afterward.",
      recommendedOwner: "manager",
      recommendedNextAction: "Verify capture outcome before treating the check as paid.",
      detectedAt: latestEventAt,
    });
  }

  if (eventTypes.has("check_reopened") && eventTypes.has("check_closed")) {
    exceptions.push({
      type: "reopened_after_close",
      severity: "warning",
      explanationText: "The check was reopened after previously being closed.",
      recommendedOwner: "manager",
      recommendedNextAction: "Review why the check was reopened and confirm its active state.",
      detectedAt: latestEventAt,
    });
  }

  if (
    !eventTypes.has("check_closed") &&
    eventTypes.has("duplicate_charge_suspected")
  ) {
    exceptions.push({
      type: "duplicate_capture_close_missing",
      severity: "warning",
      explanationText: "Capture activity is present but the check has not closed cleanly.",
      recommendedOwner: "support",
      recommendedNextAction: "Verify close completion after the duplicate-charge review.",
      detectedAt: latestEventAt,
    });
  }

  return exceptions;
}
