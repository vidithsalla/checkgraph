import type { DomainCheckContext, DomainFundingAllocation } from "@/lib/domain/types";

export function projectCheckAllocations(
  context: DomainCheckContext,
): DomainFundingAllocation[] {
  return context.events
    .filter(
      (event) =>
        event.type === "deposit_applied_to_check" ||
        event.type === "hosted_credit_applied_to_check",
    )
    .map((event) => {
      const isHostedCredit = event.type === "hosted_credit_applied_to_check";

      return {
        allocationType: isHostedCredit ? ("hosted_credit" as const) : ("deposit" as const),
        fundingSourceType: isHostedCredit
          ? ("hosted_credit" as const)
          : ("captured_deposit" as const),
        sourceRef: isHostedCredit
          ? typeof event.payload.bookingRef === "string"
            ? event.payload.bookingRef
            : context.booking
              ? `${context.booking.bookingRef}:hosted-credit`
              : "unscoped-hosted-credit"
          : typeof event.payload.depositRef === "string"
            ? event.payload.depositRef
            : context.booking
              ? `${context.booking.bookingRef}:deposit`
              : "unscoped-deposit",
        amountCents:
          typeof event.payload.amountCents === "number" ? event.payload.amountCents : 0,
        note:
          typeof event.payload.reason === "string"
            ? event.payload.reason
            : typeof event.payload.note === "string"
              ? event.payload.note
              : undefined,
        appliedByEventId: event.id,
        appliedAt: event.occurredAt,
      };
    })
    .filter((allocation) => allocation.amountCents > 0);
}
