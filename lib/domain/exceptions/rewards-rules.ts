import type { DomainCheckContext, DerivedCheckState, DetectedException } from "@/lib/domain/types";

export function detectRewardsExceptions(
  context: DomainCheckContext,
  derivedState: DerivedCheckState,
): DetectedException[] {
  const latestEventAt = context.events[context.events.length - 1]?.occurredAt ?? context.openedAt;
  const exceptions: DetectedException[] = [];

  if (
    context.events.some((event) => event.type === "rewards_eligibility_confirmed") &&
    derivedState.receiptState !== "received"
  ) {
    exceptions.push({
      type: "rewards_waiting_on_final_receipt",
      severity: "warning",
      explanationText: "Rewards are eligible but cannot post until the final receipt is available.",
      recommendedOwner: "support",
      recommendedNextAction: "Verify final receipt ingestion before escalating the rewards issue.",
      detectedAt: latestEventAt,
    });
  }

  if (
    context.events.some((event) => event.type === "rewards_post_failed") &&
    derivedState.receiptState === "received"
  ) {
    exceptions.push({
      type: "rewards_failed_after_receipt",
      severity: "action_required",
      explanationText: "Rewards posting failed after the final receipt was available.",
      recommendedOwner: "support",
      recommendedNextAction: "Review the rewards posting failure and retry if appropriate.",
      detectedAt: latestEventAt,
    });
  }

  if (
    context.events.some((event) => event.type === "rewards_posted") &&
    (derivedState.identityState === "ambiguous" ||
      derivedState.identityState === "mismatch_flagged")
  ) {
    exceptions.push({
      type: "rewards_posted_to_ambiguous_guest",
      severity: "warning",
      explanationText: "Rewards posted while the guest identity assignment was still ambiguous.",
      recommendedOwner: "support",
      recommendedNextAction: "Review the guest link before confirming rewards ownership.",
      detectedAt: latestEventAt,
    });
  }

  return exceptions;
}
