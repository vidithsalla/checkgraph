import type { DomainFragment, DomainGuestProfile, DomainIdentitySuggestion } from "@/lib/domain/types";
import { explainSuggestedAction } from "./explain-match";
import { scoreCandidateMatch } from "./score-candidate-match";

export function generateCandidateMatches(
  fragments: DomainFragment[],
  guests: DomainGuestProfile[],
): DomainIdentitySuggestion[] {
  return fragments.flatMap((fragment) =>
    guests
      .map((guest) => {
        const scored = scoreCandidateMatch(fragment, guest);
        if (!scored.matchBand) {
          return null;
        }

        const reasons = [...scored.reasons];
        if (guest.vipTier) {
          reasons.push(`Candidate has VIP tier: ${guest.vipTier}`);
        }

        return {
          fragmentId: fragment.id,
          candidateGuestId: guest.id,
          confidenceScore: scored.confidenceScore,
          matchBand: scored.matchBand,
          reasons,
          conflicts: scored.conflicts,
          suggestedAction: explainSuggestedAction(scored.matchBand, guest.vipTier),
        } satisfies DomainIdentitySuggestion;
      })
      .filter((suggestion): suggestion is DomainIdentitySuggestion => suggestion !== null)
      .sort((left, right) => right.confidenceScore - left.confidenceScore),
  );
}
