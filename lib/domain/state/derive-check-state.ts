import type { RoleResolutionState, ServiceState } from "@/lib/db/schema";
import { deriveFundingComposition } from "@/lib/domain/allocations/derive-funding-composition";
import { deriveBookingState } from "@/lib/domain/bookings/derive-booking-state";
import { detectExceptions } from "@/lib/domain/exceptions/detect-exceptions";
import type { DomainCheckContext, DerivedCheckState } from "@/lib/domain/types";
import { deriveDepositState } from "@/lib/domain/deposits/derive-deposit-state";
import { deriveIdentityState } from "./identity-state";
import { deriveExceptionState, pickPrimaryException } from "./next-action";
import { derivePaymentState } from "./payment-state";
import { deriveReceiptState } from "./receipt-state";
import { deriveRewardsState } from "./rewards-state";

function deriveServiceState(
  context: DomainCheckContext,
  derivedState: Pick<
    DerivedCheckState,
    "paymentState" | "receiptState" | "identityState" | "depositState"
  >,
  primaryExceptionType?: string,
): ServiceState {
  const manualPaymentConfirmation = context.events.find(
    (event) =>
      event.type === "manual_override_applied" &&
      event.payload.overrideType === "mark_payment_confirmed" &&
      (event.payload.reason || event.payload.note),
  );

  if (manualPaymentConfirmation && primaryExceptionType !== "duplicate_charge_suspected") {
    return "completed";
  }

  if (derivedState.paymentState === "closed") {
    return "completed";
  }

  if (primaryExceptionType === "duplicate_charge_suspected") {
    return "blocked";
  }

  if (
    primaryExceptionType === "deposit_captured_not_applied" ||
    primaryExceptionType === "hosted_credit_available_not_applied" ||
    primaryExceptionType === "booking_cancelled_with_active_deposit"
  ) {
    return "awaiting_staff_action";
  }

  if (context.booking?.status === "cancelled" && derivedState.depositState === "refund_pending") {
    return "awaiting_backend_completion";
  }

  if (
    derivedState.identityState === "mismatch_flagged" ||
    derivedState.identityState === "linked_low_confidence" ||
    derivedState.identityState === "ambiguous"
  ) {
    return "awaiting_staff_action";
  }

  if (
    context.events.some((event) => event.type === "fallback_mode_entered") &&
    !context.events.some((event) => event.type === "fallback_mode_exited")
  ) {
    return "awaiting_staff_action";
  }

  if (
    derivedState.paymentState === "captured" &&
    derivedState.receiptState !== "received"
  ) {
    return "awaiting_backend_completion";
  }

  if (derivedState.paymentState === "captured") {
    return "awaiting_backend_completion";
  }

  if (
    derivedState.paymentState === "authorization_pending" ||
    derivedState.paymentState === "capture_pending" ||
    derivedState.paymentState === "authorized"
  ) {
    return "awaiting_backend_completion";
  }

  if (
    context.events.some((event) => event.type === "manual_override_applied") &&
    !context.events.some((event) => event.type === "check_closed")
  ) {
    return "awaiting_backend_completion";
  }

  return "active";
}

function deriveRoleResolutionState(
  context: DomainCheckContext,
): RoleResolutionState | undefined {
  const roleIds = [
    context.organizerGuestId,
    context.payerGuestId,
    context.reservationGuestId,
  ].filter((value): value is string => Boolean(value));

  if (roleIds.length === 0) {
    return undefined;
  }

  if (
    context.organizerGuestId &&
    context.payerGuestId &&
    context.reservationGuestId
  ) {
    return new Set(roleIds).size === 1 ? "fully_resolved" : "resolved_with_split";
  }

  return "ambiguous";
}

export function deriveCheckState(context: DomainCheckContext): {
  state: DerivedCheckState;
  exceptions: ReturnType<typeof detectExceptions>;
} {
  const paymentState = derivePaymentState(context);
  const receiptState = deriveReceiptState(context);
  const rewardsState = deriveRewardsState(context, paymentState, receiptState);
  const identityState = deriveIdentityState(context);
  const bookingState = deriveBookingState(context.booking);
  const depositState = deriveDepositState(context.deposits);
  const funding = deriveFundingComposition(context);
  const roleResolutionState = deriveRoleResolutionState(context);

  const provisionalState: DerivedCheckState = {
    paymentState,
    receiptState,
    rewardsState,
    identityState,
    exceptionState: "none",
    serviceState: "active",
    bookingState,
    depositState,
    hostedSettlementState: funding.hostedSettlementState,
    roleResolutionState,
    organizerGuestId: context.organizerGuestId,
    primaryGuestId: context.primaryGuestId,
    payerGuestId: context.payerGuestId,
    reservationGuestId: context.reservationGuestId,
    depositAmountCents: funding.depositAmountCents,
    depositAppliedAmountCents: funding.depositAppliedAmountCents,
    hostedAmountCents: funding.hostedAmountCents,
    hostedAppliedAmountCents: funding.hostedAppliedAmountCents,
    remainingBalanceCents: funding.remainingBalanceCents,
    directPaymentDueCents: funding.directPaymentDueCents,
    fundingSummary: funding.fundingSummary,
    activeExceptionCount: 0,
    lastEventAt: context.events[context.events.length - 1]?.occurredAt,
  };

  const exceptions = detectExceptions(context, provisionalState);
  const exceptionState = deriveExceptionState(exceptions);
  const primaryException = pickPrimaryException(exceptions);
  const serviceState = deriveServiceState(
    context,
    provisionalState,
    primaryException?.type,
  );

  const nextActionText =
    primaryException?.recommendedNextAction ??
    (context.booking?.status === "cancelled" && provisionalState.depositState === "refund_pending"
      ? "No further manager triage is required. Deposit refund processing is pending."
      :
    (serviceState === "awaiting_backend_completion" &&
    provisionalState.directPaymentDueCents > 0 &&
    (provisionalState.depositAmountCents > 0 || provisionalState.hostedAmountCents > 0)
      ? "No hosted/deposit action required. Await standard payment completion for the remaining guest-paid balance."
      : undefined));

  const state: DerivedCheckState = {
    ...provisionalState,
    exceptionState,
    serviceState,
    nextActionOwner: primaryException?.recommendedOwner,
    nextActionText,
    activeExceptionCount: exceptions.length,
  };

  return { state, exceptions };
}
