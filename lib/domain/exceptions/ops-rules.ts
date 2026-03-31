import type { DomainCheckContext, DetectedException } from "@/lib/domain/types";

export function detectOperationalExceptions(context: DomainCheckContext): DetectedException[] {
  const latestEventAt = context.events[context.events.length - 1]?.occurredAt ?? context.openedAt;
  const exceptions: DetectedException[] = [];
  const paymentConfirmedOverride = context.events.find(
    (event) =>
      event.type === "manual_override_applied" &&
      event.payload.overrideType === "mark_payment_confirmed" &&
      (event.payload.reason || event.payload.note),
  );

  if (paymentConfirmedOverride) {
    return exceptions;
  }

  if (context.events.some((event) => event.type === "network_degraded")) {
    exceptions.push({
      type: "network_degraded_during_payment",
      severity: "action_required",
      explanationText: "Network degradation was detected during the payment flow.",
      recommendedOwner: "manager",
      recommendedNextAction: "Confirm payment manually and clear fallback-related warning before final closure.",
      detectedAt: latestEventAt,
    });
  }

  if (context.events.some((event) => event.type === "terminal_offline")) {
    exceptions.push({
      type: "terminal_offline_during_close",
      severity: "action_required",
      explanationText: "The terminal went offline during close handling.",
      recommendedOwner: "manager",
      recommendedNextAction: "Confirm payment manually and clear fallback-related warning before final closure.",
      detectedAt: latestEventAt,
    });
  }

  if (
    context.events.some((event) => event.type === "fallback_mode_entered") &&
    !context.events.some((event) => event.type === "fallback_mode_exited")
  ) {
    exceptions.push({
      type: "fallback_mode_unresolved",
      severity: "action_required",
      explanationText: "Fallback mode was entered but no exit event was recorded.",
      recommendedOwner: "manager",
      recommendedNextAction: "Confirm payment manually and clear fallback-related warning before final closure.",
      detectedAt: latestEventAt,
    });
  }

  const manualOverride = context.events.find(
    (event) => event.type === "manual_override_applied",
  );
  if (
    manualOverride &&
    !(manualOverride.payload.reason || manualOverride.payload.note)
  ) {
    exceptions.push({
      type: "manual_override_without_note",
      severity: "warning",
      explanationText: "A manual override was applied without any supporting note or reason.",
      recommendedOwner: "manager",
      recommendedNextAction: "Add a rationale to the manual override audit trail.",
      detectedAt: latestEventAt,
    });
  }

  return exceptions;
}
