import type { ExceptionState } from "@/lib/db/schema";
import type { DetectedException } from "@/lib/domain/types";

const severityRank: Record<Exclude<ExceptionState, "none">, number> = {
  warning: 1,
  action_required: 2,
  urgent: 3,
};

const typePriority: Record<string, number> = {
  duplicate_charge_suspected: 3,
  vip_profile_not_linked: 2,
  payer_reservation_mismatch: 2,
  low_confidence_guest_assignment: 1,
};

export function pickPrimaryException(exceptions: DetectedException[]) {
  return [...exceptions].sort((left, right) => {
    const severityDelta = severityRank[right.severity] - severityRank[left.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }

    const priorityDelta =
      (typePriority[right.type] ?? 0) - (typePriority[left.type] ?? 0);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return right.detectedAt.localeCompare(left.detectedAt);
  })[0];
}

export function deriveExceptionState(exceptions: DetectedException[]): ExceptionState {
  const primary = pickPrimaryException(exceptions);
  return primary?.severity ?? "none";
}
