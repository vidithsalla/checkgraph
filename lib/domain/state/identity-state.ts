import type { IdentityState } from "@/lib/db/schema";
import type { DomainCheckContext, DomainIdentitySuggestion } from "@/lib/domain/types";

function getTopSuggestion(
  suggestions: DomainIdentitySuggestion[],
  candidateGuestId?: string,
) {
  if (!candidateGuestId) {
    return undefined;
  }

  return suggestions
    .filter((suggestion) => suggestion.candidateGuestId === candidateGuestId)
    .sort((left, right) => right.confidenceScore - left.confidenceScore)[0];
}

export function deriveIdentityState(context: DomainCheckContext): IdentityState {
  const sorted = [...context.suggestions].sort(
    (left, right) => right.confidenceScore - left.confidenceScore,
  );

  if (
    context.serviceChannel === "hosted_event" &&
    context.primaryGuestId
  ) {
    return "linked_confident";
  }

  if (
    context.serviceChannel !== "hosted_event" &&
    context.payerGuestId &&
    context.reservationGuestId &&
    context.payerGuestId !== context.reservationGuestId
  ) {
    return "mismatch_flagged";
  }

  const topSuggestions = sorted.filter(
    (suggestion, index, arr) =>
      index < 2 &&
      suggestion.matchBand !== "low" &&
      (!arr[0] || arr[0].confidenceScore - suggestion.confidenceScore <= 0.08),
  );

  const distinctCandidates = new Set(topSuggestions.map((suggestion) => suggestion.candidateGuestId));
  if (distinctCandidates.size > 1) {
    return "ambiguous";
  }

  const primarySuggestion = getTopSuggestion(sorted, context.primaryGuestId);
  if (context.primaryGuestId && primarySuggestion) {
    return primarySuggestion.matchBand === "high"
      ? "linked_confident"
      : "linked_low_confidence";
  }

  if (context.primaryGuestId) {
    return "linked_low_confidence";
  }

  return sorted.length > 0 ? "ambiguous" : "unlinked";
}
