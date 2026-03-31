import test from "node:test";
import assert from "node:assert/strict";
import { canonicalScenarios } from "@/lib/db/seed";
import { projectCheckAllocations } from "@/lib/domain/allocations/project-check-allocations";
import { projectBookingDeposits } from "@/lib/domain/deposits/project-booking-deposits";
import { createSeedEvent } from "@/lib/domain/events/event-group-map";
import { deriveCheckState } from "@/lib/domain/state/derive-check-state";
import { materializeScenarioContext } from "@/lib/domain/scenarios/materialize-scenario";

for (const scenario of canonicalScenarios) {
  test(`scenario expectations: ${scenario.scenarioId}`, () => {
    const context = materializeScenarioContext(scenario);
    const { state, exceptions } = deriveCheckState(context);

    assert.equal(state.paymentState, scenario.expected.paymentState);
    assert.equal(state.receiptState, scenario.expected.receiptState);
    assert.equal(state.rewardsState, scenario.expected.rewardsState);
    assert.equal(state.identityState, scenario.expected.identityState);
    assert.equal(state.exceptionState, scenario.expected.exceptionState);
    assert.equal(state.serviceState, scenario.expected.serviceState);
    if (scenario.expected.bookingState) {
      assert.equal(state.bookingState, scenario.expected.bookingState);
    }
    if (scenario.expected.depositState) {
      assert.equal(state.depositState, scenario.expected.depositState);
    }
    if (scenario.expected.hostedSettlementState) {
      assert.equal(
        state.hostedSettlementState,
        scenario.expected.hostedSettlementState,
      );
    }
    if (scenario.expected.roleResolutionState) {
      assert.equal(
        state.roleResolutionState,
        scenario.expected.roleResolutionState,
      );
    }
    if (typeof scenario.expected.depositAmountCents === "number") {
      assert.equal(state.depositAmountCents, scenario.expected.depositAmountCents);
    }
    if (typeof scenario.expected.depositAppliedAmountCents === "number") {
      assert.equal(
        state.depositAppliedAmountCents,
        scenario.expected.depositAppliedAmountCents,
      );
    }
    if (typeof scenario.expected.hostedAmountCents === "number") {
      assert.equal(state.hostedAmountCents, scenario.expected.hostedAmountCents);
    }
    if (typeof scenario.expected.hostedAppliedAmountCents === "number") {
      assert.equal(
        state.hostedAppliedAmountCents,
        scenario.expected.hostedAppliedAmountCents,
      );
    }
    if (typeof scenario.expected.remainingBalanceCents === "number") {
      assert.equal(
        state.remainingBalanceCents,
        scenario.expected.remainingBalanceCents,
      );
    }
    if (typeof scenario.expected.directPaymentDueCents === "number") {
      assert.equal(
        state.directPaymentDueCents,
        scenario.expected.directPaymentDueCents,
      );
    }

    const actualExceptionTypes = exceptions.map((exception) => exception.type).sort();
    const expectedExceptionTypes = [...scenario.expected.exceptions].sort();
    assert.deepEqual(actualExceptionTypes, expectedExceptionTypes);

    if (scenario.expected.nextActionOwner) {
      assert.equal(state.nextActionOwner, scenario.expected.nextActionOwner);
    }

    if (scenario.expected.nextActionText) {
      assert.equal(state.nextActionText, scenario.expected.nextActionText);
    }
  });
}

test("hosted deposit application reconciles funding without implying full payment completion", () => {
  const scenario = canonicalScenarios.find(
    (candidate) => candidate.scenarioId === "SCN_HOSTED_DEPOSIT_UNAPPLIED",
  );

  assert.ok(scenario, "Hosted deposit scenario should be present");

  const baseContext = materializeScenarioContext(scenario);
  const events = [
    ...baseContext.events,
    {
      id: "evt-post-apply-deposit",
      sequenceNo: baseContext.events.length + 1,
      ...createSeedEvent({
        type: "deposit_applied_to_check",
        occurredAt: "2026-03-30T22:50:00-04:00",
        payload: {
          bookingRef: "BK-ORE-20260330-101",
          depositRef: "dep_ore_101",
          amountCents: 50000,
          reason: "Operator applied captured deposit",
        },
      }),
    },
  ];

  const updatedBaseContext = {
    ...baseContext,
    events,
  };
  const updatedContext = {
    ...updatedBaseContext,
    deposits: projectBookingDeposits(updatedBaseContext),
    allocations: projectCheckAllocations(updatedBaseContext),
  };

  const { state } = deriveCheckState(updatedContext);

  assert.equal(state.hostedSettlementState, "settled");
  assert.equal(state.depositState, "fully_applied");
  assert.equal(state.paymentState, "authorized");
  assert.equal(state.directPaymentDueCents, 113360);
  assert.equal(state.serviceState, "awaiting_backend_completion");
  assert.equal(
    state.nextActionText,
    "No hosted/deposit action required. Await standard payment completion for the remaining guest-paid balance.",
  );
});

test("hosted coverage application partially reconciles funding while keeping remaining guest payment due", () => {
  const scenario = canonicalScenarios.find(
    (candidate) => candidate.scenarioId === "SCN_HOSTED_PARTIAL_COVERAGE",
  );

  assert.ok(scenario, "Hosted partial coverage scenario should be present");

  const baseContext = materializeScenarioContext(scenario);
  const events = [
    ...baseContext.events,
    {
      id: "evt-post-apply-hosted-credit",
      sequenceNo: baseContext.events.length + 1,
      ...createSeedEvent({
        type: "hosted_credit_applied_to_check",
        occurredAt: "2026-03-30T22:52:00-04:00",
        payload: {
          bookingRef: "BK-ORE-20260330-202",
          amountCents: 60000,
          reason: "Operator applied hosted event coverage",
        },
      }),
    },
  ];

  const updatedBaseContext = {
    ...baseContext,
    events,
  };
  const updatedContext = {
    ...updatedBaseContext,
    deposits: projectBookingDeposits(updatedBaseContext),
    allocations: projectCheckAllocations(updatedBaseContext),
  };

  const { state } = deriveCheckState(updatedContext);

  assert.equal(state.hostedSettlementState, "partially_reconciled");
  assert.equal(state.depositState, "fully_applied");
  assert.equal(state.hostedAppliedAmountCents, 60000);
  assert.equal(state.paymentState, "authorized");
  assert.equal(state.directPaymentDueCents, 53360);
  assert.equal(state.serviceState, "awaiting_backend_completion");
  assert.equal(
    state.nextActionText,
    "No hosted/deposit action required. Await standard payment completion for the remaining guest-paid balance.",
  );
});

test("cancelled booking deposit refund clears manager triage without implying refund completion", () => {
  const scenario = canonicalScenarios.find(
    (candidate) => candidate.scenarioId === "SCN_BOOKING_CANCELLED_ACTIVE_DEPOSIT",
  );

  assert.ok(scenario, "Cancelled booking scenario should be present");

  const baseContext = materializeScenarioContext(scenario);
  const events = [
    ...baseContext.events,
    {
      id: "evt-post-mark-deposit-for-refund",
      sequenceNo: baseContext.events.length + 1,
      ...createSeedEvent({
        type: "deposit_refund_initiated",
        occurredAt: "2026-03-27T11:45:00-04:00",
        payload: {
          bookingRef: "BK-ORE-20260331-303",
          depositRef: "dep_ore_303",
          amountCents: 50000,
          reason: "Operator marked captured deposit for refund after cancellation",
        },
      }),
    },
  ];

  const updatedBaseContext = {
    ...baseContext,
    events,
  };
  const updatedContext = {
    ...updatedBaseContext,
    deposits: projectBookingDeposits(updatedBaseContext),
    allocations: projectCheckAllocations(updatedBaseContext),
  };

  const { state, exceptions } = deriveCheckState(updatedContext);

  assert.equal(state.depositState, "refund_pending");
  assert.equal(state.hostedSettlementState, "none");
  assert.equal(state.paymentState, "not_started");
  assert.equal(state.directPaymentDueCents, 0);
  assert.equal(state.serviceState, "awaiting_backend_completion");
  assert.equal(state.nextActionOwner, undefined);
  assert.equal(
    state.nextActionText,
    "No further manager triage is required. Deposit refund processing is pending.",
  );
  assert.deepEqual(exceptions, []);
});
