import type { DomainCheckContext, DetectedException } from "@/lib/domain/types";

export function detectReceiptExceptions(context: DomainCheckContext): DetectedException[] {
  const latestEventAt = context.events[context.events.length - 1]?.occurredAt ?? context.openedAt;
  const exceptions: DetectedException[] = [];

  if (context.events.some((event) => event.type === "final_receipt_missing_timeout")) {
    exceptions.push({
      type: "final_receipt_missing_after_timeout",
      severity: "action_required",
      explanationText: "Payment captured but final receipt did not arrive within the expected window.",
      recommendedOwner: "manager",
      recommendedNextAction: "Verify final receipt ingestion before escalating the rewards issue.",
      detectedAt: latestEventAt,
    });
  }

  if (context.events.some((event) => event.type === "receipt_itemization_unavailable")) {
    exceptions.push({
      type: "receipt_itemization_unavailable",
      severity: "warning",
      explanationText: "Final receipt itemization is currently unavailable.",
      recommendedOwner: "support",
      recommendedNextAction: "Confirm whether receipt itemization is delayed or unavailable upstream.",
      detectedAt: latestEventAt,
    });
  }

  return exceptions;
}
