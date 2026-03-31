import type { HostedSettlementState } from "@/lib/db/schema";

export function describeFundingReconciliationState(
  state: HostedSettlementState | null | undefined,
) {
  switch (state) {
    case "hosted_pending":
      return "hosted pending";
    case "partially_reconciled":
      return "partially reconciled";
    case "fully_hosted":
      return "fully hosted";
    case "settlement_mismatch":
      return "mismatch";
    case "settled":
      return "reconciled";
    case "none":
    default:
      return "none";
  }
}
