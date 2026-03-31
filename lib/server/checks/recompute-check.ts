import { and, desc, eq, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";
import { deriveCheckState } from "@/lib/domain/state/derive-check-state";
import { buildDomainContextForCheck } from "./build-domain-context";

type DbLike = PostgresJsDatabase<typeof schema>;

function toDate(value?: string) {
  return value ? new Date(value) : null;
}

export async function recomputeCheck(db: DbLike, checkId: string) {
  const assembled = await buildDomainContextForCheck(db, checkId);
  if (!assembled) {
    throw new Error(`Check not found: ${checkId}`);
  }

  const { check, context, suggestions } = assembled;
  const { state, exceptions } = deriveCheckState(context);
  const now = new Date();

  await db
    .delete(schema.checkAllocations)
    .where(eq(schema.checkAllocations.checkId, checkId));

  if (check.eventBookingId) {
    await db
      .delete(schema.bookingDeposits)
      .where(eq(schema.bookingDeposits.eventBookingId, check.eventBookingId));
  }

  if (check.eventBookingId && context.deposits.length > 0) {
    await db.insert(schema.bookingDeposits).values(
      context.deposits.map((deposit) => ({
        eventBookingId: check.eventBookingId!,
        depositRef: deposit.depositRef,
        depositType: deposit.depositType,
        state: deposit.state,
        amountCents: deposit.amountCents,
        appliedAmountCents: deposit.appliedAmountCents,
        refundableAmountCents: deposit.refundableAmountCents,
        fundingOwnerGuestId: deposit.fundingOwnerGuestId ?? null,
        captureRef: deposit.captureRef ?? null,
        holdRef: deposit.holdRef ?? null,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  if (context.allocations.length > 0) {
    await db.insert(schema.checkAllocations).values(
      context.allocations.map((allocation) => ({
        checkId,
        eventBookingId: check.eventBookingId,
        allocationType: allocation.allocationType,
        fundingSourceType: allocation.fundingSourceType,
        sourceRef: allocation.sourceRef,
        amountCents: allocation.amountCents,
        appliedByEventId: allocation.appliedByEventId ?? null,
        note: allocation.note ?? null,
        createdAt: new Date(allocation.appliedAt),
      })),
    );
  }

  await db.delete(schema.guestMatchSuggestions).where(eq(schema.guestMatchSuggestions.checkId, checkId));

  if (suggestions.length > 0) {
    const fragmentMap = new Map(
      context.fragments.map((fragment) => [fragment.id, fragment.id]),
    );

    await db.insert(schema.guestMatchSuggestions).values(
      suggestions.map((suggestion) => ({
        checkId,
        fragmentId: fragmentMap.get(suggestion.fragmentId) ?? suggestion.fragmentId,
        candidateGuestId: suggestion.candidateGuestId,
        confidenceScore: suggestion.confidenceScore.toFixed(2),
        matchBand: suggestion.matchBand,
        reasonsJson: suggestion.reasons,
        conflictsJson: suggestion.conflicts,
        suggestedAction: suggestion.suggestedAction,
      })),
    );
  }

  await db
    .insert(schema.derivedCheckState)
    .values({
      checkId,
      paymentState: state.paymentState,
      receiptState: state.receiptState,
      rewardsState: state.rewardsState,
      identityState: state.identityState,
      exceptionState: state.exceptionState,
      serviceState: state.serviceState,
      bookingState: state.bookingState,
      depositState: state.depositState,
      hostedSettlementState: state.hostedSettlementState,
      roleResolutionState: state.roleResolutionState ?? null,
      organizerGuestId: state.organizerGuestId ?? null,
      primaryGuestId: state.primaryGuestId ?? null,
      payerGuestId: state.payerGuestId ?? null,
      reservationGuestId: state.reservationGuestId ?? null,
      depositAmountCents: state.depositAmountCents,
      depositAppliedAmountCents: state.depositAppliedAmountCents,
      hostedAmountCents: state.hostedAmountCents,
      hostedAppliedAmountCents: state.hostedAppliedAmountCents,
      remainingBalanceCents: state.remainingBalanceCents,
      directPaymentDueCents: state.directPaymentDueCents,
      fundingSummaryJson: state.fundingSummary,
      nextActionOwner: state.nextActionOwner ?? null,
      nextActionText: state.nextActionText ?? null,
      activeExceptionCount: state.activeExceptionCount,
      lastEventAt: toDate(state.lastEventAt),
      computedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.derivedCheckState.checkId,
      set: {
        paymentState: state.paymentState,
        receiptState: state.receiptState,
        rewardsState: state.rewardsState,
        identityState: state.identityState,
        exceptionState: state.exceptionState,
        serviceState: state.serviceState,
        bookingState: state.bookingState,
        depositState: state.depositState,
        hostedSettlementState: state.hostedSettlementState,
        roleResolutionState: state.roleResolutionState ?? null,
        organizerGuestId: state.organizerGuestId ?? null,
        primaryGuestId: state.primaryGuestId ?? null,
        payerGuestId: state.payerGuestId ?? null,
        reservationGuestId: state.reservationGuestId ?? null,
        depositAmountCents: state.depositAmountCents,
        depositAppliedAmountCents: state.depositAppliedAmountCents,
        hostedAmountCents: state.hostedAmountCents,
        hostedAppliedAmountCents: state.hostedAppliedAmountCents,
        remainingBalanceCents: state.remainingBalanceCents,
        directPaymentDueCents: state.directPaymentDueCents,
        fundingSummaryJson: state.fundingSummary,
        nextActionOwner: state.nextActionOwner ?? null,
        nextActionText: state.nextActionText ?? null,
        activeExceptionCount: state.activeExceptionCount,
        lastEventAt: toDate(state.lastEventAt),
        computedAt: now,
      },
    });

  const existing = await db
    .select()
    .from(schema.exceptions)
    .where(and(eq(schema.exceptions.checkId, checkId), inArray(schema.exceptions.status, ["open", "acknowledged"])));

  const nextTypes = new Set(exceptions.map((exception) => exception.type));

  for (const current of existing) {
    if (!nextTypes.has(current.exceptionType)) {
      await db
        .update(schema.exceptions)
        .set({
          status: "resolved",
          resolvedAt: now,
          resolutionText: "Resolved by recompute",
          updatedAt: now,
        })
        .where(eq(schema.exceptions.id, current.id));
    }
  }

  for (const exception of exceptions) {
    const existingRow = existing.find((row) => row.exceptionType === exception.type);
    if (existingRow) {
      await db
        .update(schema.exceptions)
        .set({
          severity: exception.severity,
          status: "open",
          detectedAt: new Date(exception.detectedAt),
          resolvedAt: null,
          explanationText: exception.explanationText,
          recommendedNextAction: exception.recommendedNextAction,
          recommendedOwner: exception.recommendedOwner,
          updatedAt: now,
        })
        .where(eq(schema.exceptions.id, existingRow.id));
    } else {
      await db.insert(schema.exceptions).values({
        checkId,
        exceptionType: exception.type,
        severity: exception.severity,
        status: "open",
        detectedAt: new Date(exception.detectedAt),
        explanationText: exception.explanationText,
        recommendedNextAction: exception.recommendedNextAction,
        recommendedOwner: exception.recommendedOwner,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (state.serviceState === "completed" && check.closedAt === null) {
    await db
      .update(schema.checks)
      .set({
        statusLabel: "operationally_completed",
        updatedAt: now,
      })
      .where(eq(schema.checks.id, checkId));
  }
}

export async function getNextSequenceNo(db: DbLike, checkId: string) {
  const [latest] = await db
    .select({
      sequenceNo: schema.checkEvents.sequenceNo,
    })
    .from(schema.checkEvents)
    .where(eq(schema.checkEvents.checkId, checkId))
    .orderBy(desc(schema.checkEvents.sequenceNo))
    .limit(1);

  return (latest?.sequenceNo ?? 0) + 1;
}
