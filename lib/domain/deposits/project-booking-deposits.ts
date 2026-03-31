import type { DepositType } from "@/lib/db/schema";
import type { DomainCheckContext, DomainDepositProjection } from "@/lib/domain/types";

type MutableDepositProjection = DomainDepositProjection;

function fallbackDepositRef(context: DomainCheckContext) {
  return context.booking ? `${context.booking.bookingRef}:deposit` : "unscoped-deposit";
}

function ensureDeposit(
  deposits: Map<string, MutableDepositProjection>,
  context: DomainCheckContext,
  payload: Record<string, unknown>,
) {
  const depositRef =
    typeof payload.depositRef === "string" && payload.depositRef.length > 0
      ? payload.depositRef
      : fallbackDepositRef(context);

  const current = deposits.get(depositRef);
  const amountCents =
    typeof payload.amountCents === "number"
      ? payload.amountCents
      : current?.amountCents ?? context.booking?.depositAmountCents ?? 0;
  const depositType =
    (typeof payload.depositType === "string" ? payload.depositType : undefined) ??
    current?.depositType ??
    "event_deposit";

  const projection: MutableDepositProjection = current ?? {
    depositRef,
    depositType: depositType as DepositType,
    state: "none",
    amountCents,
    appliedAmountCents: 0,
    refundableAmountCents: amountCents,
    fundingOwnerGuestId:
      (typeof payload.fundingOwnerGuestId === "string" ? payload.fundingOwnerGuestId : undefined) ??
      context.booking?.payerGuestId,
    captureRef: typeof payload.captureRef === "string" ? payload.captureRef : undefined,
    holdRef: typeof payload.holdRef === "string" ? payload.holdRef : undefined,
  };

  projection.depositType = depositType as DepositType;
  projection.amountCents = amountCents;
  projection.refundableAmountCents = Math.max(
    0,
    projection.amountCents - projection.appliedAmountCents,
  );

  deposits.set(depositRef, projection);
  return projection;
}

export function projectBookingDeposits(
  context: DomainCheckContext,
): DomainDepositProjection[] {
  const deposits = new Map<string, MutableDepositProjection>();

  for (const event of context.events) {
    if (
      event.type !== "deposit_requested" &&
      event.type !== "deposit_hold_placed" &&
      event.type !== "deposit_captured" &&
      event.type !== "deposit_applied_to_check" &&
      event.type !== "deposit_refund_initiated"
    ) {
      continue;
    }

    const payload = event.payload;
    const projection = ensureDeposit(deposits, context, payload);

    if (event.type === "deposit_requested") {
      projection.state = "requested";
      continue;
    }

    if (event.type === "deposit_hold_placed") {
      projection.state = "hold_active";
      projection.holdRef =
        typeof payload.holdRef === "string" ? payload.holdRef : projection.holdRef;
      continue;
    }

    if (event.type === "deposit_captured") {
      projection.state = "captured";
      projection.captureRef =
        typeof payload.captureRef === "string"
          ? payload.captureRef
          : projection.captureRef;
      projection.refundableAmountCents = Math.max(
        0,
        projection.amountCents - projection.appliedAmountCents,
      );
      continue;
    }

    if (event.type === "deposit_refund_initiated") {
      projection.state = "refund_pending";
      projection.refundableAmountCents = Math.max(
        0,
        projection.amountCents - projection.appliedAmountCents,
      );
      continue;
    }

    const appliedAmountCents =
      typeof payload.amountCents === "number" ? payload.amountCents : 0;
    projection.appliedAmountCents += appliedAmountCents;
    projection.refundableAmountCents = Math.max(
      0,
      projection.amountCents - projection.appliedAmountCents,
    );
    projection.state =
      projection.appliedAmountCents >= projection.amountCents
        ? "fully_applied"
        : "partially_applied";
  }

  return [...deposits.values()];
}
