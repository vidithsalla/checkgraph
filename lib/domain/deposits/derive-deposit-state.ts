import type { DepositState } from "@/lib/db/schema";
import type { DomainDepositProjection } from "@/lib/domain/types";

export function deriveDepositState(
  deposits: DomainDepositProjection[],
): DepositState {
  if (deposits.length === 0) {
    return "none";
  }

  if (deposits.some((deposit) => deposit.state === "unknown")) {
    return "unknown";
  }

  if (deposits.some((deposit) => deposit.state === "captured")) {
    return "captured";
  }

  if (deposits.some((deposit) => deposit.state === "partially_applied")) {
    return "partially_applied";
  }

  if (deposits.every((deposit) => deposit.state === "fully_applied")) {
    return "fully_applied";
  }

  if (deposits.some((deposit) => deposit.state === "hold_active")) {
    return "hold_active";
  }

  if (deposits.some((deposit) => deposit.state === "requested")) {
    return "requested";
  }

  if (deposits.some((deposit) => deposit.state === "refund_pending")) {
    return "refund_pending";
  }

  if (deposits.some((deposit) => deposit.state === "refunded")) {
    return "refunded";
  }

  return "unknown";
}
