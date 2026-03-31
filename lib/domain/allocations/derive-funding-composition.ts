import type { HostedSettlementState } from "@/lib/db/schema";
import type { DomainCheckContext } from "@/lib/domain/types";

export function deriveFundingComposition(context: DomainCheckContext) {
  const depositCoveredCents = context.allocations
    .filter((allocation) => allocation.allocationType === "deposit")
    .reduce((sum, allocation) => sum + allocation.amountCents, 0);
  const hostedCoveredCents = context.allocations
    .filter((allocation) => allocation.allocationType === "hosted_credit")
    .reduce((sum, allocation) => sum + allocation.amountCents, 0);
  const guestPaidRemainderCents = Math.max(
    0,
    context.totalAmountCents - depositCoveredCents - hostedCoveredCents,
  );

  const depositAmountCents = context.deposits.reduce(
    (sum, deposit) => sum + deposit.amountCents,
    0,
  );
  const depositAppliedAmountCents = context.deposits.reduce(
    (sum, deposit) => sum + deposit.appliedAmountCents,
    0,
  );
  const hostedAmountCents = context.booking?.hostedAmountCents ?? 0;
  const hostedAppliedAmountCents = hostedCoveredCents;

  // This is the hosted/deposit funding reconciliation layer only.
  // Payment and operational completion are still owned by payment_state and service_state.
  let hostedSettlementState: HostedSettlementState = "none";
  const hasHostedFundingContext =
    Boolean(context.booking) ||
    depositAmountCents > 0 ||
    hostedAmountCents > 0 ||
    depositAppliedAmountCents > 0 ||
    hostedAppliedAmountCents > 0;

  if (hasHostedFundingContext) {
    const cancelledBookingWithoutAppliedFunding =
      context.booking?.status === "cancelled" &&
      depositAppliedAmountCents === 0 &&
      hostedAppliedAmountCents === 0;
    const unappliedCapturedDeposit = context.deposits.some(
      (deposit) =>
        deposit.state === "captured" &&
        deposit.amountCents > deposit.appliedAmountCents,
    );

    if (cancelledBookingWithoutAppliedFunding) {
      hostedSettlementState = "none";
    } else if (unappliedCapturedDeposit) {
      hostedSettlementState = "settlement_mismatch";
    } else if (hostedAmountCents > 0 && hostedAppliedAmountCents === 0) {
      hostedSettlementState = "hosted_pending";
    } else if (
      hostedAmountCents > 0 &&
      hostedAppliedAmountCents > 0 &&
      guestPaidRemainderCents > 0
    ) {
      hostedSettlementState = "partially_reconciled";
    } else if (hostedAmountCents > 0 && hostedAppliedAmountCents >= hostedAmountCents) {
      hostedSettlementState = "fully_hosted";
    } else if (depositAppliedAmountCents > 0 || hostedAppliedAmountCents > 0) {
      hostedSettlementState = "settled";
    }
  }

  return {
    depositAmountCents,
    depositAppliedAmountCents,
    hostedAmountCents,
    hostedAppliedAmountCents,
    remainingBalanceCents: guestPaidRemainderCents,
    directPaymentDueCents: guestPaidRemainderCents,
    hostedSettlementState,
    fundingSummary: {
      depositCoveredCents,
      hostedCoveredCents,
      guestPaidRemainderCents,
    },
  };
}
