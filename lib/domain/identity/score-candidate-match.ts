import type { MatchBand } from "@/lib/db/schema";
import type { DomainFragment, DomainGuestProfile } from "@/lib/domain/types";
import {
  getInitialLastName,
  normalizeEmail,
  normalizeName,
  normalizePhone,
} from "./normalize-identities";
import { MATCH_RULE_WEIGHTS } from "./match-rules";

export type ScoredCandidateMatch = {
  confidenceScore: number;
  matchBand?: MatchBand;
  reasons: string[];
  conflicts: string[];
};

function toBand(score: number): MatchBand | undefined {
  if (score >= 0.9) {
    return "high";
  }
  if (score >= 0.7) {
    return "medium";
  }
  if (score >= 0.45) {
    return "low";
  }
  return undefined;
}

export function scoreCandidateMatch(
  fragment: DomainFragment,
  guest: DomainGuestProfile,
): ScoredCandidateMatch {
  let score = 0;
  const reasons: string[] = [];
  const conflicts: string[] = [];

  if (fragment.guestProfileId && fragment.guestProfileId === guest.id) {
    score = Math.max(score, MATCH_RULE_WEIGHTS.explicitLinkedGuest);
    reasons.push("Fragment already references this guest profile");
  }

  if (
    normalizePhone(fragment.rawPhone) &&
    normalizePhone(fragment.rawPhone) === guest.phoneNormalized
  ) {
    score += MATCH_RULE_WEIGHTS.exactPhone;
    reasons.push("Normalized phone matches");
  }

  if (
    normalizeEmail(fragment.rawEmail) &&
    normalizeEmail(fragment.rawEmail) === guest.emailNormalized
  ) {
    score += MATCH_RULE_WEIGHTS.exactEmail;
    reasons.push("Normalized email matches");
  }

  if (
    normalizeName(fragment.rawName) &&
    normalizeName(fragment.rawName) === normalizeName(guest.displayName)
  ) {
    score += MATCH_RULE_WEIGHTS.exactName;
    reasons.push("Display name matches");
  } else if (
    getInitialLastName(fragment.rawName) &&
    getInitialLastName(fragment.rawName) ===
      getInitialLastName(`${guest.firstName ?? ""} ${guest.lastName ?? ""}`)
  ) {
    score += MATCH_RULE_WEIGHTS.initialLastName;
    reasons.push("Initial and last name pattern matches");
  }

  if (
    fragment.paymentAlias &&
    guest.knownPaymentAliases?.includes(fragment.paymentAlias)
  ) {
    score += MATCH_RULE_WEIGHTS.paymentAliasHistory;
    reasons.push("Known payment alias appears in prior linked history");
  }

  if (!reasons.length && fragment.rawName && guest.displayName) {
    conflicts.push("No strong identity signal matched this candidate");
  }

  const confidenceScore = Math.min(1, Number(score.toFixed(2)));
  return {
    confidenceScore,
    matchBand: toBand(confidenceScore),
    reasons,
    conflicts,
  };
}
