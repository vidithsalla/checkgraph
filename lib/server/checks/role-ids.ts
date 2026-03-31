import type { ServiceChannel } from "@/lib/db/schema";
import type { DomainFragment, DomainIdentitySuggestion } from "@/lib/domain/types";

type DerivedRoleIds = {
  primaryGuestId?: string;
  payerGuestId?: string;
  reservationGuestId?: string;
};

function bestSuggestionForFragment(
  suggestions: DomainIdentitySuggestion[],
  fragmentId: string,
) {
  return suggestions
    .filter((suggestion) => suggestion.fragmentId === fragmentId)
    .sort((left, right) => right.confidenceScore - left.confidenceScore)[0];
}

function findHintedGuest(
  fragments: DomainFragment[],
  suggestions: DomainIdentitySuggestion[],
  roleHint: "primary" | "payer" | "reservation",
) {
  const hintedFragment = fragments.find(
    (fragment) => fragment.metadata?.roleHint === roleHint,
  );

  if (!hintedFragment) {
    return undefined;
  }

  return (
    hintedFragment.guestProfileId ??
    bestSuggestionForFragment(suggestions, hintedFragment.id)?.candidateGuestId
  );
}

export function deriveRoleIds(input: {
  serviceChannel: ServiceChannel;
  fragments: DomainFragment[];
  suggestions: DomainIdentitySuggestion[];
}): DerivedRoleIds {
  const reservationGuestId =
    findHintedGuest(input.fragments, input.suggestions, "reservation") ??
    input.fragments.find((fragment) => fragment.reservationRef)?.guestProfileId;

  const payerGuestId =
    findHintedGuest(input.fragments, input.suggestions, "payer") ??
    input.fragments.find((fragment) => fragment.paymentAlias)?.guestProfileId ??
    input.suggestions.sort((left, right) => right.confidenceScore - left.confidenceScore)[0]
      ?.candidateGuestId;

  const primaryGuestId =
    findHintedGuest(input.fragments, input.suggestions, "primary") ??
    (input.serviceChannel === "hosted_event"
      ? payerGuestId ?? reservationGuestId
      : payerGuestId ?? reservationGuestId);

  return {
    primaryGuestId,
    payerGuestId,
    reservationGuestId,
  };
}
