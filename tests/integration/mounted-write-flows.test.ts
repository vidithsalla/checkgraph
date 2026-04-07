import test, { after } from "node:test";
import assert from "node:assert/strict";
import { and, desc, eq } from "drizzle-orm";
import { closeDb, db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { seedDatabase } from "@/lib/db/seed/run-seed";
import {
  applyDepositToCheckMutation,
  type ApplyDepositInput,
} from "@/features/checks/actions/apply-deposit-to-check";
import {
  applyHostedCoverageToCheckMutation,
  type ApplyHostedCoverageInput,
} from "@/features/checks/actions/apply-hosted-coverage-to-check";
import {
  markDepositForRefundMutation,
  type MarkDepositForRefundInput,
} from "@/features/checks/actions/mark-deposit-for-refund";
import { loadCheckDetail } from "@/lib/server/checks/load-check-detail";

process.env.CHECKGRAPH_PROTOTYPE_ROLE = "manager";

type CheckEventType = (typeof schema.checkEvents.$inferSelect)["eventType"];
type ExceptionType = (typeof schema.exceptions.$inferSelect)["exceptionType"];

after(async () => {
  await closeDb();
});

async function loadRequiredDetail(externalCheckRef: string) {
  const detail = await loadCheckDetail(externalCheckRef);
  assert.ok(detail, `Expected seeded check detail for ${externalCheckRef}`);
  return detail;
}

async function latestEventFor(checkId: string, eventType: CheckEventType) {
  const [row] = await db
    .select()
    .from(schema.checkEvents)
    .where(and(eq(schema.checkEvents.checkId, checkId), eq(schema.checkEvents.eventType, eventType)))
    .orderBy(desc(schema.checkEvents.sequenceNo))
    .limit(1);
  return row ?? null;
}

async function latestAuditFor(checkId: string, actionType: string) {
  const [row] = await db
    .select()
    .from(schema.auditLogs)
    .where(and(eq(schema.auditLogs.entityId, checkId), eq(schema.auditLogs.actionType, actionType)))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(1);
  return row ?? null;
}

async function exceptionRow(checkId: string, exceptionType: ExceptionType) {
  const [row] = await db
    .select()
    .from(schema.exceptions)
    .where(and(eq(schema.exceptions.checkId, checkId), eq(schema.exceptions.exceptionType, exceptionType)))
    .orderBy(desc(schema.exceptions.detectedAt))
    .limit(1);
  return row ?? null;
}

test("mounted write flows persist event, audit, derived state, and exception updates", async (t) => {
  await t.test("Apply Deposit To Check", async () => {
    await seedDatabase();
    const detailBefore = await loadRequiredDetail("CHK-ORE-20260330-011");
    const primaryDeposit = detailBefore.bookingDeposits[0];

    assert.ok(primaryDeposit, "Expected a seeded booking deposit");
    assert.equal(detailBefore.derivedState?.depositState, "captured");
    assert.equal(detailBefore.derivedState?.depositAppliedAmountCents, 0);
    assert.deepEqual(
      detailBefore.activeExceptions.map((exception) => exception.exceptionType),
      ["deposit_captured_not_applied"],
    );

    const payload: ApplyDepositInput = {
      checkId: detailBefore.check.id,
      externalCheckRef: detailBefore.check.externalCheckRef,
      bookingRef: detailBefore.booking!.bookingRef,
      depositRef: primaryDeposit.depositRef,
      amountCents: primaryDeposit.amountCents - primaryDeposit.appliedAmountCents,
      reason: "Integration test applied the captured booking deposit to the final hosted check.",
    };

    await applyDepositToCheckMutation(payload);

    const detailAfter = await loadRequiredDetail("CHK-ORE-20260330-011");
    const eventRow = await latestEventFor(detailBefore.check.id, "deposit_applied_to_check");
    const auditRow = await latestAuditFor(detailBefore.check.id, "apply_deposit_to_check");
    const exception = await exceptionRow(detailBefore.check.id, "deposit_captured_not_applied");

    assert.ok(eventRow, "Expected deposit application event row");
    assert.equal(eventRow.payloadJson.depositRef, payload.depositRef);
    assert.equal(eventRow.payloadJson.amountCents, payload.amountCents);

    assert.ok(auditRow, "Expected deposit application audit row");
    assert.equal(auditRow.note, payload.reason);

    assert.equal(detailAfter.derivedState?.depositState, "fully_applied");
    assert.equal(detailAfter.derivedState?.depositAppliedAmountCents, 50000);
    assert.equal(detailAfter.derivedState?.exceptionState, "none");
    assert.deepEqual(detailAfter.activeExceptions, []);

    assert.ok(exception, "Expected persisted exception row");
    assert.equal(exception.status, "resolved");
  });

  await t.test("Apply Hosted Coverage To Check", async () => {
    await seedDatabase();
    const detailBefore = await loadRequiredDetail("CHK-ORE-20260330-022");

    assert.ok(detailBefore.booking, "Expected a seeded booking");
    assert.equal(detailBefore.derivedState?.hostedSettlementState, "hosted_pending");
    assert.equal(detailBefore.derivedState?.hostedAppliedAmountCents, 0);
    assert.deepEqual(
      detailBefore.activeExceptions.map((exception) => exception.exceptionType),
      ["hosted_credit_available_not_applied"],
    );

    const payload: ApplyHostedCoverageInput = {
      checkId: detailBefore.check.id,
      externalCheckRef: detailBefore.check.externalCheckRef,
      bookingRef: detailBefore.booking.bookingRef,
      amountCents: detailBefore.booking.hostedAmountCents,
      reason: "Integration test applied hosted coverage to reduce the guest-paid remainder.",
    };

    await applyHostedCoverageToCheckMutation(payload);

    const detailAfter = await loadRequiredDetail("CHK-ORE-20260330-022");
    const eventRow = await latestEventFor(detailBefore.check.id, "hosted_credit_applied_to_check");
    const auditRow = await latestAuditFor(detailBefore.check.id, "apply_hosted_coverage_to_check");
    const exception = await exceptionRow(detailBefore.check.id, "hosted_credit_available_not_applied");

    assert.ok(eventRow, "Expected hosted coverage event row");
    assert.equal(eventRow.payloadJson.bookingRef, payload.bookingRef);
    assert.equal(eventRow.payloadJson.amountCents, payload.amountCents);

    assert.ok(auditRow, "Expected hosted coverage audit row");
    assert.equal(auditRow.note, payload.reason);

    assert.equal(detailAfter.derivedState?.hostedSettlementState, "partially_reconciled");
    assert.equal(detailAfter.derivedState?.hostedAppliedAmountCents, 60000);
    assert.equal(detailAfter.derivedState?.directPaymentDueCents, 53360);
    assert.equal(detailAfter.derivedState?.exceptionState, "none");
    assert.deepEqual(detailAfter.activeExceptions, []);

    assert.ok(exception, "Expected persisted exception row");
    assert.equal(exception.status, "resolved");
  });

  await t.test("Mark Deposit For Refund", async () => {
    await seedDatabase();
    const detailBefore = await loadRequiredDetail("CHK-ORE-20260331-033");
    const primaryDeposit = detailBefore.bookingDeposits[0];

    assert.ok(primaryDeposit, "Expected a seeded booking deposit");
    assert.ok(detailBefore.booking, "Expected a seeded booking");
    assert.equal(detailBefore.booking.status, "cancelled");
    assert.equal(detailBefore.derivedState?.depositState, "captured");
    assert.deepEqual(
      detailBefore.activeExceptions.map((exception) => exception.exceptionType),
      ["booking_cancelled_with_active_deposit"],
    );

    const payload: MarkDepositForRefundInput = {
      checkId: detailBefore.check.id,
      externalCheckRef: detailBefore.check.externalCheckRef,
      bookingRef: detailBefore.booking.bookingRef,
      depositRef: primaryDeposit.depositRef,
      amountCents: primaryDeposit.refundableAmountCents,
      reason: "Integration test marked the cancelled booking deposit for refund follow-through.",
    };

    await markDepositForRefundMutation(payload);

    const detailAfter = await loadRequiredDetail("CHK-ORE-20260331-033");
    const eventRow = await latestEventFor(detailBefore.check.id, "deposit_refund_initiated");
    const auditRow = await latestAuditFor(detailBefore.check.id, "mark_deposit_for_refund");
    const exception = await exceptionRow(detailBefore.check.id, "booking_cancelled_with_active_deposit");

    assert.ok(eventRow, "Expected deposit refund event row");
    assert.equal(eventRow.payloadJson.depositRef, payload.depositRef);
    assert.equal(eventRow.payloadJson.amountCents, payload.amountCents);

    assert.ok(auditRow, "Expected deposit refund audit row");
    assert.equal(auditRow.note, payload.reason);

    assert.equal(detailAfter.derivedState?.depositState, "refund_pending");
    assert.equal(detailAfter.derivedState?.serviceState, "awaiting_backend_completion");
    assert.equal(detailAfter.derivedState?.exceptionState, "none");
    assert.deepEqual(detailAfter.activeExceptions, []);

    assert.ok(exception, "Expected persisted exception row");
    assert.equal(exception.status, "resolved");
  });
});
