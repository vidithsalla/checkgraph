import { describeFundingReconciliationState } from "@/lib/domain/allocations/describe-funding-reconciliation-state";
import { describeServiceState } from "@/lib/domain/state/describe-service-state";
import type { AssembledCheckDetail } from "@/lib/server/checks/types";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export type SupportSummary = {
  checkId: string;
  restaurant: string;
  tableLabel: string;
  total: string;
  bookingSummary: string[];
  depositSummary: string[];
  fundingSummary: string[];
  paymentSummary: string[];
  receiptSummary: string[];
  rewardsSummary: string[];
  identitySummary: string[];
  guestRoleSummary: string[];
  activeExceptions: string[];
  manualActions: string[];
  recommendedNextAction: string;
};

export function generateSupportSummary(detail: AssembledCheckDetail): SupportSummary {
  const derived = detail.derivedState;
  const primaryGuest =
    (derived?.primaryGuestId && detail.guestsById.get(derived.primaryGuestId)?.displayName) ??
    "Unlinked";
  const payerGuest =
    (derived?.payerGuestId && detail.guestsById.get(derived.payerGuestId)?.displayName) ??
    "Unknown";
  const reservationGuest =
    (derived?.reservationGuestId &&
      detail.guestsById.get(derived.reservationGuestId)?.displayName) ??
    "None";
  const organizerGuest =
    (derived?.organizerGuestId &&
      detail.guestsById.get(derived.organizerGuestId)?.displayName) ??
    "None";
  const primaryDeposit = detail.bookingDeposits[0];
  const depositOutcomeOwner =
    (primaryDeposit?.fundingOwnerGuestId &&
      detail.guestsById.get(primaryDeposit.fundingOwnerGuestId)?.displayName) ??
    (derived?.payerGuestId && detail.guestsById.get(derived.payerGuestId)?.displayName) ??
    "Unknown";
  const serviceStateDescription = describeServiceState({
    serviceState: derived?.serviceState ?? null,
    bookingStatus: detail.booking?.status ?? null,
    depositState: derived?.depositState ?? null,
  });

  return {
    checkId: detail.check.externalCheckRef,
    restaurant: detail.restaurant.name,
    tableLabel: detail.check.tableLabel ?? detail.check.serviceChannel,
    total: formatMoney(detail.check.totalAmountCents),
    bookingSummary: detail.booking
      ? [
          `Booking ref: ${detail.booking.bookingRef}`,
          `Booking: ${detail.booking.eventName}`,
          `Booking status: ${detail.booking.status}`,
        ]
      : [],
    depositSummary: primaryDeposit
      ? [
          `Deposit ref: ${primaryDeposit.depositRef}`,
          `Deposit state: ${derived?.depositState ?? primaryDeposit.state}`,
          `Deposit amount: ${formatMoney(primaryDeposit.amountCents)}`,
          `Deposit applied: ${formatMoney(primaryDeposit.appliedAmountCents)}`,
          `Deposit outcome owner: ${depositOutcomeOwner} (payer)`,
        ]
      : [],
    fundingSummary: [
      `Deposit covered: ${formatMoney(derived?.depositAppliedAmountCents ?? 0)}`,
      `Hosted covered: ${formatMoney(derived?.hostedAppliedAmountCents ?? 0)}`,
      `Guest-paid remainder: ${formatMoney(derived?.directPaymentDueCents ?? detail.check.totalAmountCents)}`,
      `Funding reconciliation state: ${describeFundingReconciliationState(derived?.hostedSettlementState)}`,
    ],
    paymentSummary: [
      `Payment state: ${derived?.paymentState ?? "unknown"}`,
      `Service state: ${serviceStateDescription.label}`,
      ...(serviceStateDescription.detail
        ? [`Service meaning: ${serviceStateDescription.detail}`]
        : []),
    ],
    receiptSummary: [`Receipt state: ${derived?.receiptState ?? "unknown"}`],
    rewardsSummary: [`Rewards state: ${derived?.rewardsState ?? "unknown"}`],
    identitySummary: [
      `Primary guest: ${primaryGuest}`,
      `Payer guest: ${payerGuest}`,
      `Reservation guest: ${reservationGuest}`,
      `Identity state: ${derived?.identityState ?? "unknown"}`,
    ],
    guestRoleSummary: [
      `Organizer guest: ${organizerGuest}`,
      `Reservation guest: ${reservationGuest}`,
      `Payer guest: ${payerGuest}`,
      `Primary guest: ${primaryGuest}`,
      `Role resolution state: ${derived?.roleResolutionState ?? "not_set"}`,
    ],
    activeExceptions: detail.activeExceptions.map(
      (exception) => `${exception.exceptionType} (${exception.severity})`,
    ),
    manualActions: detail.auditTrail.map(
      (entry) => `${entry.actionType} by ${entry.actorId}${entry.note ? `: ${entry.note}` : ""}`,
    ),
    recommendedNextAction: derived?.nextActionText ?? "No operator action required.",
  };
}
