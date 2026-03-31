import type { MatchBand } from "@/lib/db/schema";

export function explainSuggestedAction(matchBand: MatchBand, vipTier?: string) {
  if (vipTier) {
    return "Review and confirm VIP guest link";
  }

  if (matchBand === "high") {
    return "Review and confirm likely guest link";
  }

  if (matchBand === "medium") {
    return "Review guest match before resolving identity state";
  }

  return "Do not auto-link; operator review required";
}
