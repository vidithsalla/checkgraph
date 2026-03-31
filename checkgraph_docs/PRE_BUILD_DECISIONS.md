# Checkgraph Pre-Build Decisions

Purpose: lock the minimum implementation decisions that must be stable before building the prototype.

## 1. Canonical Event Ordering
- Final decision: Reducer and exception logic execute events in canonical per-check order.
- Chosen default: Use `check_events.sequence_no` as the source of truth for reducer order. Use `occurred_at` for display only. Enforce unique `(check_id, sequence_no)`.
- Short rationale: This keeps state derivation deterministic even when timestamps are equal or backfilled.
- Affected modules/files: `lib/db/schema/events.ts`, `lib/domain/state/derive-check-state.ts`, `lib/domain/exceptions/detect-exceptions.ts`, `features/checks/components/check-timeline.tsx`, replay/seed helpers.

## 2. Projection Recompute Model
- Final decision: Derived state and persisted exceptions are recomputed immediately after writes that change check truth.
- Chosen default: Recompute synchronously after seed insertion, appended check events, and manual overrides for the affected check.
- Short rationale: This keeps the prototype simple, predictable, and easy to debug.
- Affected modules/files: recompute orchestration service, `lib/domain/state/*`, `lib/domain/exceptions/*`, write handlers under `app/api/**` or `features/**/actions/*`.

## 3. Reducer State Contract
- Final decision: Payment truth and operational closure are separate concepts.
- Chosen default: `payment_state` reflects external payment truth only. `service_state` reflects operational workflow state. A check is only `payment_state = closed` when `check_closed` exists. A manager override may move the check to operational completion without implying processor truth changed.
- Short rationale: This preserves event integrity while still supporting realistic floor operations.
- Affected modules/files: `lib/domain/state/payment-state.ts`, `lib/domain/state/derive-check-state.ts`, `lib/domain/state/next-action.ts`, `lib/db/schema/derived-state.ts`, Check Detail state cards.

## 4. Exception Timing Thresholds
- Final decision: All timing thresholds are explicit constants, not inferred ad hoc in rules.
- Chosen default: Define one shared constants module for v1 thresholds covering auth-without-capture, capture-without-close, stale preauth, final receipt timeout, rewards delay, and unresolved fallback mode.
- Short rationale: Fixed thresholds make exception behavior explainable and testable.
- Affected modules/files: `lib/constants/*`, `lib/domain/exceptions/payment-rules.ts`, `lib/domain/exceptions/receipt-rules.ts`, `lib/domain/exceptions/rewards-rules.ts`, `lib/domain/exceptions/ops-rules.ts`, scenario tests.

## 5. Exception Lifecycle
- Final decision: Exceptions may auto-resolve only when their rule condition clearly clears; otherwise they require explicit operator action.
- Chosen default: Auto-resolve derived process exceptions such as stale preauth or missing close when a resolving event arrives. Keep suspicion/manual exceptions open until resolved or suppressed.
- Short rationale: This prevents noisy duplicate rows while preserving real operational accountability.
- Affected modules/files: `lib/db/schema/exceptions.ts`, `lib/domain/exceptions/detect-exceptions.ts`, queue queries, Check Detail exception cards, audit/support flows.

## 6. Primary Next-Action Rule
- Final decision: Each check exposes one primary next action.
- Chosen default: Choose the highest-severity open exception as the primary driver. Break ties by the most operationally blocking unresolved issue. If no open exception exists, derive next action from reducer state.
- Short rationale: The product needs one clear answer to “who acts next and what should they do.”
- Affected modules/files: `lib/domain/state/next-action.ts`, `lib/domain/exceptions/*`, `lib/db/schema/derived-state.ts`, support summary generation, Check Detail UI.

## 7. Explicit Guest Roles On A Check
- Final decision: Do not overload guest linkage into one field.
- Chosen default: Model `primary_guest_id`, `payer_guest_id`, and `reservation_guest_id` explicitly in derived check state and assembled check detail payloads where applicable. `primary_guest_id` is the operationally primary guest for the check, while payer and reservation roles stay distinct.
- Short rationale: This avoids collapsing exactly the ambiguity the product is meant to explain.
- Affected modules/files: `lib/db/schema/derived-state.ts`, check detail data mappers/loaders, `lib/domain/identity/*`, support summary generation, Guest Detail views.

## 8. Identity Scoring And Auto-Link Policy
- Final decision: Identity suggestions are rules-based and operator-confirmed.
- Chosen default: Use explicit rule weights in code, emit reasons/conflicts, and do not auto-confirm guest links in v1. Suggestions may be high confidence, but confirmation remains manual.
- Short rationale: This keeps identity explainable and lowers the risk of incorrect linkage in demo scenarios.
- Affected modules/files: `lib/domain/identity/match-rules.ts`, `lib/domain/identity/generate-candidate-matches.ts`, `lib/domain/identity/explain-match.ts`, `lib/db/schema/guests.ts`, identity panel UI.

## 9. Manual Override Semantics
- Final decision: Overrides change operational handling, not historical payment truth.
- Chosen default: Support only `mark_payment_confirmed`, `confirm_identity_link`, `reject_identity_link`, `suppress_exception`, `reopen_check`, and `attach_note` in v1. Every override must emit an event and an audit log row. `mark_payment_confirmed` may allow operational completion but must not invent a processor capture or closure event.
- Short rationale: This keeps overrides useful without corrupting the event model.
- Affected modules/files: override action handlers, `lib/domain/state/*`, `lib/domain/exceptions/*`, `lib/db/schema/audit.ts`, `lib/db/schema/events.ts`, Check Detail audit/override UI.

## 10. Scenario Replay Isolation
- Final decision: Replay tooling must not mutate the canonical seeded demo world.
- Chosen default: Run replay against isolated synthetic state or replay-scoped records only. Resetting replay restores the original seeded scenario view.
- Short rationale: Replay is a demo and debugging surface, not a source of production-like truth.
- Affected modules/files: `features/scenarios/*`, replay handlers, scenario builders, seed registry, replay state/persistence helpers. Replay itself is deferred from the current packaged prototype.

## 11. Permission Enforcement Boundary
- Final decision: Write permissions are enforced server-side, not only hidden in the UI.
- Chosen default: Enforce a minimal server-side prototype role check on current write actions using a server-resolved role (`CHECKGRAPH_PROTOTYPE_ROLE`) and reject disallowed writes before appending events. Keep read permissions lightweight for the prototype and do not expand into full auth.
- Short rationale: This makes auditability credible without expanding auth scope.
- Affected modules/files: `lib/server/checks/write-guards.ts`, write handlers, audit log creation, override/deposit/hosted actions.

## 12. Seed Scenario Contract
- Final decision: Canonical scenarios are executable fixtures with expected outputs.
- Chosen default: Every core seeded scenario includes input data, ordered events, expected derived state, expected active exceptions, and expected primary next action where relevant.
- Short rationale: This gives the build an immediate regression harness and keeps the prototype grounded.
- Affected modules/files: `lib/db/seed/scenarios/*`, `scripts/seed.ts`, replay registry, reducer/exception tests, scenario validation helpers.
