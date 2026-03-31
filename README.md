# Checkgraph

## 1. Overview
Checkgraph is an event-driven restaurant check operations and funding-reconciliation prototype. It is designed for the messy cases where a restaurant check is not just "paid" or "unpaid", but sits at the intersection of payment state, booking context, hosted coverage, deposits, guest roles, operator actions, and support recovery. The system models those situations as an append-only event stream, derives current operational state from that history, detects exceptions, recommends the next action, and records audited operator interventions.

### Current status
- Mounted and live-verified operator flows:
  - `Apply Deposit To Check`
  - `Apply Hosted Coverage To Check`
  - `Mark Deposit For Refund`
- Earlier live-verified supporting slice:
  - `Mark Payment Confirmed` exists in code and was verified earlier, but is not currently mounted in the packaged app surface
- Deferred surfaces:
  - Guest Detail
  - Scenario Replay

## 2. Why this exists
Restaurant check issues are usually not single-table bugs. They are coordination failures across multiple systems and responsibilities:

- payment authorization, capture, and closure
- booking and hosted-event context
- deposit and prepayment lifecycle
- hosted coverage versus guest-paid remainder
- organizer, payer, reservation holder, and attendee roles
- operator overrides and support follow-through

When those layers drift out of sync, staff need an operational source of truth that can answer:

- what money has actually moved
- what part of the check was funded by deposit or hosted coverage
- what still remains guest-paid
- who owns the obligation
- what the operator should do next

## 3. What the system does
Checkgraph runs a tight operational loop:

1. append check and funding events to an ordered event stream
2. recompute derived state for the affected check
3. detect explicit operational exceptions
4. surface one primary next action
5. let an operator take an audited corrective action
6. regenerate a support-friendly summary from the updated state

This is not a decorative dashboard. The product exists to make ambiguous check states legible and recoverable.

## 4. Architecture
The current system is built around a few concrete pieces:

- Event stream
  - `check_events` is the source of truth for check-level payment, booking, deposit, allocation, and operator actions.
- Recompute pipeline
  - after any accepted write, the app rebuilds check context, reruns the reducer, reruns exception detection, and persists updated projections.
- Projections / read models
  - `derived_check_state` stores current operational state
  - `booking_deposits` and `check_allocations` are projection tables derived from event truth
  - `exceptions` stores explicit open/resolved operational issues
- Exception engine
  - rules translate event and state combinations into inspectable exception objects with severity and recommended owner/action
- Support export
  - the app generates Markdown and plain-text support summaries from current check detail state
- Audit log
  - every real operator action writes an audit row alongside the domain event

### Live-verified slices
The following write flows were verified against a local Postgres-backed app with real writes, recompute, projection updates, audit rows, and support-export responses:

- `Apply Deposit To Check`
- `Apply Hosted Coverage To Check`
- `Mark Deposit For Refund`
- `Mark Payment Confirmed` as an earlier verified supporting slice

## 5. Mounted operator flows

### Apply Deposit To Check
Operational problem:
- a booking deposit was captured before service, but it has not been applied to the final hosted check

Action:
- operator applies the captured deposit to the check

What gets updated:
- `deposit_applied_to_check` event is appended
- `check_allocations` projection gains the deposit allocation
- `booking_deposits` projection updates applied state
- derived state and exceptions are recomputed
- support export reflects the new funding composition

### Apply Hosted Coverage To Check
Operational problem:
- the booking has available hosted coverage, but the check still shows too much guest-paid remainder

Action:
- operator applies hosted coverage to the check

What gets updated:
- `hosted_credit_applied_to_check` event is appended
- hosted allocation is projected into `check_allocations`
- funding composition is recomputed
- the hosted-coverage exception resolves
- support export reflects deposit-covered, hosted-covered, and guest-paid portions

### Mark Deposit For Refund
Operational problem:
- a booking was cancelled after a deposit was captured, and the deposit outcome is still unresolved

Action:
- operator marks the deposit for refund processing

What gets updated:
- `deposit_refund_initiated` event is appended
- `booking_deposits` projection moves to `refund_pending`
- cancellation/deposit exception resolves
- next action shifts from manager triage to refund follow-through
- support export explains that refund processing is pending, not complete

## 6. Earlier verified supporting slice
Checkgraph also includes an earlier live-verified recovery slice for fallback and terminal-degradation cases:

### Mark Payment Confirmed
This slice demonstrates that payment truth and operational completion are separate concepts. In a network fallback / terminal-offline scenario, an operator can record a manual payment confirmation event, clear fallback-related exceptions, and move the check forward operationally without pretending the external processor lifecycle changed.

Important caveat:
- this slice exists in code and was previously live-verified
- it is not currently mounted in the packaged app surface

## 7. Canonical scenarios
- Network fallback payment recovery
  - payment is authorized under degraded terminal conditions and needs operator confirmation logic
- Delayed final receipt / rewards dependency
  - receipt arrival gates downstream rewards posting and exception resolution
- Payer vs reservation mismatch
  - the final payer and reservation context do not line up cleanly
- Hosted deposit unapplied
  - a captured deposit exists but has not been applied to the final check
- Hosted partial coverage
  - deposit is applied, hosted coverage is available, and a guest-paid remainder still exists
- Cancelled booking with active deposit
  - a booking is cancelled after deposit capture and the deposit outcome must move into refund follow-through

## 8. Guest role model
Checkgraph keeps guest roles operational and explicit rather than CRM-like:

- `primary guest`
  - the operationally primary guest for the check
- `payer`
  - the guest most directly associated with payment responsibility
- `reservation guest`
  - the reservation holder or booking-linked guest
- `organizer`
  - the person associated with hosted or event coordination

These roles can overlap, but the system does not assume they are the same person. That distinction matters for funding, support explanation, and operator recovery.

## 9. Runtime verification
This prototype was verified against a local Postgres-backed Next.js app, not only through unit tests or static compilation.

The live verification path included:

- real writes through mounted operator actions
- persisted event inserts in `check_events`
- persisted audit rows in `audit_logs`
- recompute-driven updates to `derived_check_state`
- recompute-driven updates to `booking_deposits`, `check_allocations`, and `exceptions`
- real support-export responses from the running app
- explicit rejection of invalid or repeated actions under server-side guardrails

The repo has also been run through:

- `npm run typecheck`
- `npm run test:domain`
- `npm run build`

## 10. What is intentionally simplified
- prototype role enforcement, not full auth
  - current write permissions are enforced server-side through a prototype role setting, not a full identity/session stack
- booking truth is currently mixed
  - booking status is row-backed in `event_bookings` plus event history, not a fully event-sourced booking subsystem
- export formats are intentionally narrow
  - Markdown and plain text are implemented
  - JSON export is deferred
- packaged UI scope is intentionally limited
  - Overview, Exception Queue, and Check Detail are the shipped surfaces
  - Guest Detail and Scenario Replay are deferred
- funding assumptions are intentionally narrow
  - current funding composition focuses on captured deposit, hosted credit, and guest-paid remainder
  - this is not a full event-accounting or refund platform

### Known limitations
- `Mark Payment Confirmed` is an earlier verified slice but is not currently mounted in the packaged app surface
- booking status is not yet derived entirely from booking events
- the current UI assumes a narrow deposit model and does not aim to support broad multi-deposit accounting
- invalid action rejections currently surface as server errors rather than polished in-form error states

## 11. Demo walkthrough
One strong 60 to 90 second walkthrough:

1. Start on `Overview` and explain that this is an operator recovery console, not a dashboard.
2. Open `CHK-ORE-20260330-011` and show a captured deposit that was not yet applied.
3. Apply the deposit and show the timeline, derived state, exception resolution, and support export update.
4. Open `CHK-ORE-20260330-022` and show partial hosted coverage with remaining guest-paid balance.
5. Apply hosted coverage and show the funding split become explicit.
6. Open `CHK-ORE-20260331-033` and show the cancelled booking / captured deposit mismatch.
7. Mark the deposit for refund and show the shift from manager triage to refund follow-through pending.

## 12. Repo structure
High-signal parts of the repo:

- `app/`
  - Next.js App Router entrypoints for Overview, Exception Queue, Check Detail, and support export
- `features/checks/`
  - mounted operator actions and check-detail UI components
- `features/exceptions/`
  - exception queue UI
- `lib/db/schema/`
  - Drizzle schema for checks, events, projections, exceptions, bookings, deposits, and allocations
- `lib/db/seed/`
  - canonical scenarios and seed inputs
- `lib/domain/`
  - reducer logic, exception rules, funding composition, deposit projection, and support-summary generation
- `lib/server/checks/`
  - DB-backed loaders, recompute orchestration, and write guardrails
- `drizzle/`
  - SQL migrations
- `tests/domain/`
  - scenario-based domain tests

### Docs map
- `README.md`
  - public repo overview and demo framing
- `checkgraph_docs/HOSTED_CHECK_DEPOSIT_RESOLUTION_PRD.md`
  - active product framing for the current hosted/deposit prototype
- `checkgraph_docs/HOSTED_CHECK_DEPOSIT_SCHEMA_AND_SEEDS.md`
  - active schema, seed, and scenario contract
- `checkgraph_docs/PHASE2_BUILD_DELTA.md`
  - active implementation delta against the earlier base
- `checkgraph_docs/CODEX_BUILD_GUIDE.md`
  - build/execution companion for the active Phase 2 branch
- `checkgraph_docs/PRE_BUILD_DECISIONS.md`
  - locked architectural decisions for the current prototype
- `checkgraph_docs/archive/`
  - archived earlier specs and build-status notes, kept for history rather than current guidance

## 13. Setup
Local setup is intentionally lightweight and still a bit manual.

Minimum verified workflow:

1. install dependencies
   - `npm install`
2. provide a Postgres database via `DATABASE_URL`
3. apply the SQL migrations in `drizzle/`
4. seed the database
   - `npm run seed`
5. start the app
   - `npm run dev`

Validation commands:

- `npm run typecheck`
- `npm run test:domain`
- `npm run build`

The repo has been live-verified against a local Postgres-backed environment, but the bootstrap flow is still intentionally simple rather than fully automated.

## 14. Future extensions
- remount and tighten the payment-confirmation recovery slice in the packaged app surface
- make booking truth fully event-driven instead of row-backed plus history
- add richer integration-style tests around live write flows and rejection paths
- extend support export and operator detail only where it improves recovery, not surface area

### What I’d improve next
- remount `Mark Payment Confirmed` so all real write flows are visible in the packaged app
- add first-class in-form handling for rejected actions instead of raw server-error responses
- add one automated DB-backed integration test per mounted write flow
