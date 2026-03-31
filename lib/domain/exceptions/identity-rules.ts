import type { DomainCheckContext, DetectedException } from "@/lib/domain/types";

export function detectIdentityExceptions(context: DomainCheckContext): DetectedException[] {
  const latestEventAt = context.events[context.events.length - 1]?.occurredAt ?? context.openedAt;
  const exceptions: DetectedException[] = [];

  if (
    context.serviceChannel !== "hosted_event" &&
    context.payerGuestId &&
    context.reservationGuestId &&
    context.payerGuestId !== context.reservationGuestId
  ) {
    exceptions.push({
      type: "payer_reservation_mismatch",
      severity: "warning",
      explanationText: "The identified payer and reservation guest do not match.",
      recommendedOwner: "manager",
      recommendedNextAction:
        "Confirm payer-versus-reservation relationship before linking rewards or closing the identity issue.",
      detectedAt: latestEventAt,
    });
  }

  const suggestionsByFragment = new Map<string, typeof context.suggestions>();
  for (const suggestion of context.suggestions) {
    const current = suggestionsByFragment.get(suggestion.fragmentId) ?? [];
    current.push(suggestion);
    suggestionsByFragment.set(suggestion.fragmentId, current);
  }

  for (const suggestions of suggestionsByFragment.values()) {
    const sorted = [...suggestions]
      .filter((suggestion) => suggestion.matchBand !== "low")
      .sort((left, right) => right.confidenceScore - left.confidenceScore);

    if (
      sorted.length >= 2 &&
      sorted[0].candidateGuestId !== sorted[1].candidateGuestId &&
      sorted[0].confidenceScore - sorted[1].confidenceScore <= 0.08
    ) {
      exceptions.push({
        type: "multiple_plausible_guest_matches",
        severity: "warning",
        explanationText: "Multiple guest candidates appear similarly plausible for this check.",
        recommendedOwner: "manager",
        recommendedNextAction: "Review the identity candidates before confirming the guest link.",
        detectedAt: latestEventAt,
      });
      break;
    }
  }

  const sortedSuggestions = [...context.suggestions].sort(
    (left, right) => right.confidenceScore - left.confidenceScore,
  );

  if (
    context.primaryGuestId &&
    sortedSuggestions[0] &&
    sortedSuggestions[0].candidateGuestId === context.primaryGuestId &&
    sortedSuggestions[0].matchBand !== "high"
  ) {
    exceptions.push({
      type: "low_confidence_guest_assignment",
      severity: "warning",
      explanationText: "The current guest assignment is supported only by a low or medium-confidence match.",
      recommendedOwner: "manager",
      recommendedNextAction: "Review the guest match before resolving the identity state.",
      detectedAt: latestEventAt,
    });
  }

  const vipSuggestion = sortedSuggestions.find(
    (suggestion) =>
      suggestion.candidateGuestId === context.primaryGuestId &&
      suggestion.matchBand !== "high",
  );
  if (vipSuggestion?.reasons.some((reason) => reason.toLowerCase().includes("vip"))) {
    exceptions.push({
      type: "vip_profile_not_linked",
      severity: "warning",
      explanationText: "A likely VIP guest match exists but has not been confidently linked.",
      recommendedOwner: "manager",
      recommendedNextAction: "Review the suggested VIP guest link before resolving identity state.",
      detectedAt: latestEventAt,
    });
  }

  return exceptions;
}
