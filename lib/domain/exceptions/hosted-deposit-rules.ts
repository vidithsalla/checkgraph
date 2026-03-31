import type { DomainCheckContext, DerivedCheckState, DetectedException } from "@/lib/domain/types";

const activeHostedBookingStatuses = new Set(["confirmed", "modified", "completed"]);

export function detectHostedDepositExceptions(
  context: DomainCheckContext,
  derivedState: DerivedCheckState,
): DetectedException[] {
  const exceptions: DetectedException[] = [];

  if (
    context.booking &&
    context.booking.status !== "cancelled" &&
    derivedState.depositAmountCents > 0 &&
    derivedState.depositState === "captured" &&
    derivedState.depositAppliedAmountCents === 0
  ) {
    exceptions.push({
      type: "deposit_captured_not_applied",
      severity: "action_required",
      explanationText:
        "A captured booking deposit exists, but none of it has been applied to the final check.",
      recommendedOwner: "manager",
      recommendedNextAction:
        "Apply captured deposit to final check before confirming the remaining balance.",
      detectedAt: context.events[context.events.length - 1]?.occurredAt ?? context.openedAt,
    });
  }

  if (
    context.booking &&
    context.booking.status === "cancelled" &&
    derivedState.depositAmountCents > 0 &&
    (derivedState.depositState === "captured" || derivedState.depositState === "hold_active")
  ) {
    exceptions.push({
      type: "booking_cancelled_with_active_deposit",
      severity: "action_required",
      explanationText:
        "The booking was cancelled, but the deposit is still active and its outcome has not been resolved.",
      recommendedOwner: "manager",
      recommendedNextAction:
        "Mark the captured deposit for refund because the booking was cancelled before the deposit outcome was resolved.",
      detectedAt: context.events[context.events.length - 1]?.occurredAt ?? context.openedAt,
    });
  }

  if (
    context.booking &&
    activeHostedBookingStatuses.has(context.booking.status) &&
    context.booking.hostedAmountCents > 0 &&
    derivedState.hostedAppliedAmountCents === 0 &&
    derivedState.directPaymentDueCents >
      Math.max(
        0,
        context.totalAmountCents -
          derivedState.depositAppliedAmountCents -
          context.booking.hostedAmountCents,
      )
  ) {
    exceptions.push({
      type: "hosted_credit_available_not_applied",
      severity: "action_required",
      explanationText:
        "Confirmed hosted credit is available on the booking, but none of it has been applied to the check.",
      recommendedOwner: "manager",
      recommendedNextAction:
        "Apply hosted coverage to the check before confirming the remaining guest-paid balance.",
      detectedAt: context.events[context.events.length - 1]?.occurredAt ?? context.openedAt,
    });
  }

  return exceptions;
}
