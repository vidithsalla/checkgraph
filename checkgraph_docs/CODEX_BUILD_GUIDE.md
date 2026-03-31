# Checkgraph Codex Build Guide

**Version:** 1.0  
**Companion to:** `HOSTED_CHECK_DEPOSIT_RESOLUTION_PRD.md` and `HOSTED_CHECK_DEPOSIT_SCHEMA_AND_SEEDS.md`  
**Purpose:** Execution guide for Codex to build the Checkgraph prototype with minimal drift from product intent.  
**Status:** Build-ready

---

## Table of Contents

1. [How to Use This Guide](#how-to-use-this-guide)
2. [What Codex Should Optimize For](#what-codex-should-optimize-for)
3. [Non-Negotiable Product Constraints](#non-negotiable-product-constraints)
4. [Definition of Done](#definition-of-done)
5. [Recommended Stack](#recommended-stack)
6. [Repository Shape](#repository-shape)
7. [Build Order](#build-order)
8. [Phase 0: Read and Plan](#phase-0-read-and-plan)
9. [Phase 1: Bootstrap the App](#phase-1-bootstrap-the-app)
10. [Phase 2: Domain Model and Database Schema](#phase-2-domain-model-and-database-schema)
11. [Phase 3: Seed Data and Scenario Engine](#phase-3-seed-data-and-scenario-engine)
12. [Phase 4: Derived State Engine](#phase-4-derived-state-engine)
13. [Phase 5: Exception Detection Engine](#phase-5-exception-detection-engine)
14. [Phase 6: Identity Matching Engine](#phase-6-identity-matching-engine)
15. [Phase 7: API and Server Actions](#phase-7-api-and-server-actions)
16. [Phase 8: UI Screens](#phase-8-ui-screens)
17. [Phase 9: Manual Overrides and Auditability](#phase-9-manual-overrides-and-auditability)
18. [Phase 10: Support Export](#phase-10-support-export)
19. [Phase 11: Scenario Replay UX](#phase-11-scenario-replay-ux)
20. [Phase 12: Polish and README](#phase-12-polish-and-readme)
21. [Detailed Acceptance Criteria](#detailed-acceptance-criteria)
22. [Recommended File-by-File Plan](#recommended-file-by-file-plan)
23. [Domain Enums and Constants](#domain-enums-and-constants)
24. [Seed Scenario Specs](#seed-scenario-specs)
25. [Testing Plan](#testing-plan)
26. [Prompting Strategy for Codex](#prompting-strategy-for-codex)
27. [Suggested Task Queue](#suggested-task-queue)
28. [Common Failure Modes to Avoid](#common-failure-modes-to-avoid)
29. [Final QA Checklist](#final-qa-checklist)
30. [Appendix: Master Prompt for Codex](#appendix-master-prompt-for-codex)

---

## How to Use This Guide

Use this file as the execution companion to the PRD.

The PRD defines **what** Checkgraph is and **why** it exists. This guide defines **how Codex should build it**.

Codex should:
1. read the PRD first,
2. use this file to structure implementation,
3. avoid expanding scope unless a change clearly strengthens the core product,
4. prefer finishing the core flows over adding extra surfaces.

If the PRD and this guide ever conflict, use this rule:
- **product intent from the PRD wins**
- **execution detail from this guide fills in the blanks**

---

## What Codex Should Optimize For

Codex should optimize for five things:

### 1. Credibility
The result should feel like a real operator-facing product, not a school dashboard.

### 2. Clarity
State, exceptions, and next actions must be legible to humans.

### 3. Architectural quality
Business logic should live in domain modules, not UI components.

### 4. Failure modeling
The product should be strongest on exception states, not just happy path flows.

### 5. Extensibility
The core model should support identity and higher-value workflows later without turning this build into a CRM.

---

## Non-Negotiable Product Constraints

These constraints should be treated as hard requirements.

### Event-first architecture
- Use append-only events as the source of truth.
- Do not model the core as mutable booleans spread across tables.
- Derived state should be computed from ordered events.

### Identity is supporting, not primary
- Identity matching is important, but not the main product.
- Do not turn the app into a guest CRM.
- Identity must support check resolution and service workflows.

### Recovery, not analytics theater
- Do not build decorative dashboards.
- Every major screen should help someone understand or resolve an issue.

### Scenario realism matters
- Seed data must feel plausible.
- Avoid toy names, fake metrics, or obviously synthetic UI copy.

### No fake processor complexity
- Simulate payment behavior honestly.
- Do not invent fake processor jargon or pretend a real integration exists.

### Do not overbuild auth
- Use minimal server-side prototype role enforcement for write actions.
- Do not build a full auth stack for the demo.
- Focus on the core product.

---

## Definition of Done

The prototype is done when all of the following are true:

1. A check’s current state is computed from an append-only event history.
2. At least 8 realistic scenarios are seeded and viewable in the product.
3. The app has these working screens:
   - Overview
   - Exception Queue
   - Check Detail
4. Guest Detail and Scenario Replay are explicitly deferred for the current packaged prototype.
5. The app can detect at least the core payment, receipt, rewards, and identity exceptions from the PRD.
6. Manual overrides create events and audit logs.
7. A support summary can be exported in Markdown and plain text. JSON export is deferred until implemented.
8. The UI looks like a serious ops tool.
9. README explains architecture, state model, exception taxonomy, and extension path.

Nice-to-have polish is not required for “done” if the core flows are solid.

---

## Recommended Stack

Use this unless there is a strong technical reason not to.

- **Next.js 15**
- **TypeScript**
- **App Router**
- **Tailwind CSS**
- **shadcn/ui**
- **Lucide React**
- **Supabase Postgres**
- **Drizzle ORM**
- **Zod**
- **date-fns**
- **server actions or route handlers for write flows**
- **minimal server-side prototype role resolution for write actions**

Optional but acceptable:
- React Query if needed for client fetch ergonomics
- Zustand only if there is a clear need for local scenario replay state

Avoid adding libraries unless they clearly improve speed or quality.

---

## Repository Shape

Recommended folder layout:

```text
app/
  (dashboard)/
    overview/page.tsx
    exceptions/page.tsx
    checks/[checkId]/page.tsx
    guests/[guestId]/page.tsx
    scenarios/page.tsx
  api/
    checks/
    exceptions/
    guests/
    support-cases/
components/
  layout/
  ui/
  cards/
  tables/
  timelines/
  badges/
features/
  checks/
    components/
    queries/
    actions/
    mappers/
  exceptions/
    components/
    rules/
  guests/
    components/
    matching/
  support/
    exporters/
    summaries/
  scenarios/
    components/
    data/
lib/
  db/
    schema/
    client.ts
    seed/
  domain/
    events/
    state/
    exceptions/
    identity/
    support/
  constants/
  formatters/
  permissions/
  utils/
scripts/
  seed.ts
  replay-scenarios.ts
public/
```

Rules:
- do not place reducer logic in pages
- do not place matching logic in React components
- keep domain logic pure where possible

---

## Build Order

Follow this order.

1. Read PRD and produce internal plan
2. Scaffold app and dependencies
3. Implement schema and migrations
4. Implement seed data and scenarios
5. Build event reducer
6. Build exception engine
7. Build identity matching engine
8. Build read APIs / data loaders
9. Build Overview and Exception Queue
10. Build Check Detail thoroughly
11. Defer Guest Detail unless a later branch explicitly revives it
12. Defer Scenario Replay unless a later branch explicitly revives it
13. Add manual override actions and audit log
14. Add support export
15. Polish UI and README

Do not start with pretty UI. The product will drift if the domain model is weak.

---

## Phase 0: Read and Plan

Before coding, Codex should produce a short implementation plan covering:
- schema modules
- domain modules
- seed strategy
- screen order
- testing approach

Codex should explicitly identify:
- the reducer entry point
- the exception rule entry point
- the identity matching entry point
- the main screen component boundaries

The goal is to prevent the build from becoming page-first instead of domain-first.

---

## Phase 1: Bootstrap the App

### Tasks
- initialize Next.js app with TypeScript and Tailwind
- install shadcn/ui base components
- install Drizzle and DB driver
- create environment config
- create app shell and sidebar
- add dark-neutral visual baseline

### Deliverables
- working dev server
- base layout shell
- placeholder nav routes
- linting and formatting configured

### Acceptance criteria
- app runs locally
- routes compile
- basic shell looks clean, not default

---

## Phase 2: Domain Model and Database Schema

### Goal
Define a schema that preserves append-only truth while supporting derived state, exceptions, and identity.

### Tables to implement
- restaurants
- checks
- check_events
- derived_check_state
- exceptions
- guest_profiles
- guest_identity_fragments
- guest_match_suggestions
- support_cases
- audit_logs
- event_bookings

### Key decisions

#### `check_events` is the backbone
Each event should include:
- id
- check_id
- event_type
- event_group
- occurred_at
- source_system
- actor_type
- actor_id
- payload_json
- idempotency_key
- correlation_id

#### `derived_check_state` is a cache / convenience table
It exists for performance and UI simplicity, but it is not the source of truth.

#### `exceptions` are first-class records
Do not compute everything only in-memory for display. Persist active exceptions.

### Deliverables
- schema files
- migrations
- typed enums or string unions

### Acceptance criteria
- schema is normalized enough to feel real
- event table is clearly central
- event_bookings exists in minimal future-facing form

---

## Phase 3: Seed Data and Scenario Engine

### Goal
Seed realistic, interpretable demo data.

### Restaurants
Create 2 to 3 restaurants with distinct service modes.
Examples:
- full-service dining room
- lounge / bar hybrid
- hosted private dining room

### Scenario requirements
Seed at least 8 scenarios.
Each scenario must have:
- one primary check
- ordered events
- guest fragments
- expected derived state
- expected exceptions

### Deliverables
- deterministic seed script
- scenario registry
- helper functions to generate event sequences

### Acceptance criteria
- fresh seed creates a usable demo world
- each scenario is identifiable and believable
- scenarios are reusable in the replay screen

---

## Phase 4: Derived State Engine

### Goal
Build a pure computation layer that derives check truth from events.

### Suggested structure
```text
lib/domain/state/
  derive-check-state.ts
  payment-state.ts
  receipt-state.ts
  rewards-state.ts
  identity-state.ts
  next-action.ts
```

### Input
- base check row
- ordered check events
- related guest match info
- related exception context if needed

### Output
- payment_state
- receipt_state
- rewards_state
- identity_state
- exception_state
- service_state
- next_action_owner
- next_action_text

### Rules
- reducer must be pure
- no DB access inside reducer
- output must be deterministic

### Acceptance criteria
- derived state is stable across reruns
- event order matters correctly
- state can be explained from timeline

---

## Phase 5: Exception Detection Engine

### Goal
Detect meaningful operational issues from state and event sequences.

### Suggested structure
```text
lib/domain/exceptions/
  detect-exceptions.ts
  payment-rules.ts
  receipt-rules.ts
  rewards-rules.ts
  identity-rules.ts
  ops-rules.ts
```

### Minimum supported exception types
Payment:
- duplicate_charge_suspected
- auth_succeeded_capture_missing
- duplicate_capture_close_missing
- stale_preauth_visibility
- payment_state_unknown
- capture_failed_after_auth
- reopened_after_close

Receipt:
- final_receipt_missing_after_timeout
- receipt_itemization_unavailable
- receipt_amount_mismatch

Rewards:
- rewards_waiting_on_final_receipt
- rewards_failed_after_receipt
- rewards_posted_to_ambiguous_guest

Identity:
- payer_reservation_mismatch
- multiple_plausible_guest_matches
- low_confidence_guest_assignment
- vip_profile_not_linked

Operations:
- network_degraded_during_payment
- terminal_offline_during_close
- fallback_mode_unresolved
- manual_override_without_note

### Each exception object must contain
- type
- severity
- explanation_text
- recommended_owner
- recommended_next_action
- status
- detected_at
- resolved_at

### Acceptance criteria
- exception messages feel specific, not generic
- severity is sensible
- next action is actually useful

---

## Phase 6: Identity Matching Engine

### Goal
Build an explainable rules-based identity suggestion engine.

### Suggested structure
```text
lib/domain/identity/
  score-candidate-match.ts
  generate-candidate-matches.ts
  normalize-identities.ts
  match-rules.ts
  explain-match.ts
```

### Sources to consider
- reservation record
- check-in profile
- app account
- payment identity alias
- phone
- email
- temporal proximity
- same booking window
- party / organizer metadata
- prior linked history

### Output shape
- candidate_guest_id
- confidence_score
- reasons[]
- conflicts[]
- suggested_action

### Confidence bands
- 0.90–1.00 high
- 0.70–0.89 medium
- 0.45–0.69 low
- below 0.45 do not suggest

### Important constraint
Do not make the matching engine feel fake-smart. Keep it legible.

### Acceptance criteria
- at least one scenario shows clear confident match
- at least one scenario shows ambiguity
- UI can explain why a suggestion exists

---

## Phase 7: API and Server Actions

### Goal
Expose clean read and write surfaces without leaking domain logic into handlers.

### Recommended endpoints / actions

#### Read
- `GET /api/checks`
- `GET /api/checks/:id`
- `GET /api/exceptions`
- `GET /api/guests/:id`
- `GET /api/support-cases/:id/export?format=markdown|json|text`

#### Write
- `POST /api/checks/:id/events` for scenario replay only
- `POST /api/checks/:id/override`
- `POST /api/matches/:id/confirm`
- `POST /api/matches/:id/reject`
- `POST /api/support-cases`

### Acceptance criteria
- handlers are thin
- domain services own rule execution
- shape returned to UI is already view-friendly

---

## Phase 8: UI Screens

## Overview
### Must include
- KPI cards: active checks, action required, urgent exceptions, awaiting final receipt, identity ambiguities, reward delays
- preview of recent exceptions
- counts by severity and type

### Goal
Give a fast view into operational health, not an analytics report.

## Exception Queue
### Must include
- dense table
- filters for severity, type, restaurant, status
- sorting by age, amount, severity
- row click into check detail

### Goal
This should feel like a real triage screen.

## Check Detail
### This is the most important screen.
It must include:
- header with check id, restaurant, table/channel, total, current state, severity
- event timeline
- derived state card
- exception card list
- recommended next action card
- diner clarity panel
- identity panel
- audit log
- support export actions

### Goal
One screen should explain the whole issue.

## Guest Detail
Deferred in the current packaged prototype.

### If revived later
- canonical guest summary
- identity fragments
- candidate matches
- reasons / conflicts
- linked check history
- operator decision history

### Goal
Support operational identity decisions without becoming a CRM.

## Scenario Replay
Deferred in the current packaged prototype.

### If revived later
- scenario list
- replay button
- reset button
- step-through or staged timeline rendering
- state changes visible after replay

### Goal
Show how the architecture handles failure states.

---

## Phase 9: Manual Overrides and Auditability

### Actions to support
- mark payment confirmed
- confirm identity link
- reject identity link
- suppress false-positive exception
- reopen check
- attach note

### Rules
Each override must:
- require a reason
- create an event
- create an audit log record
- optionally update relevant exception status

### Acceptance criteria
- no silent manual action exists
- audit trail is visible on Check Detail

---

## Phase 10: Support Export

### Goal
Generate support-friendly summaries from check state and history.

### Output formats
- Markdown
- plain text

JSON export is deferred until it is actually implemented.

### Required content
- check metadata
- timeline summary
- payment state summary
- receipt state summary
- rewards state summary
- identity summary
- active/resolved exceptions
- manual actions taken

### Acceptance criteria
- export feels useful immediately
- not just raw JSON dump in Markdown format

---

## Phase 11: Scenario Replay UX

### Goal
Make failure modeling demoable.

### Requirements
- list scenarios with short descriptions
- allow loading a scenario into the replay view
- allow step-by-step event progression if feasible
- show before / after state summary
- highlight which event triggered the exception

### Acceptance criteria
- replay helps explain the architecture
- not just another list page

---

## Phase 12: Polish and README

### Polish priorities
1. check detail page
2. exception queue usefulness
3. timeline legibility
4. next-action specificity
5. diner clarity tone
6. identity rationale clarity
7. overall ops-tool visual quality

### README must cover
- what the product is
- why event-driven state is the right abstraction
- how exceptions are detected
- how identity matching supports operations
- how the model extends into higher-value workflows
- setup steps
- schema summary
- known limitations

---

## Detailed Acceptance Criteria

### Core domain
- event stream is append-only in model and UI framing
- derived state is computed deterministically
- exception engine is separated from UI
- identity matching engine is separated from UI

### UX
- a user can open one check and understand what happened
- exception messages feel product-minded
- next action feels actionable, not vague
- diner clarity panel uses plain language

### Data realism
- scenarios feel plausible for restaurant service
- names, timestamps, totals, and exception patterns feel realistic

### Quality
- no giant page files full of business logic
- typing is solid
- loading states and empty states exist
- app does not visually feel unfinished

---

## Recommended File-by-File Plan

### Schema
- `lib/db/schema/restaurants.ts`
- `lib/db/schema/checks.ts`
- `lib/db/schema/check-events.ts`
- `lib/db/schema/derived-check-state.ts`
- `lib/db/schema/exceptions.ts`
- `lib/db/schema/guests.ts`
- `lib/db/schema/support.ts`
- `lib/db/schema/audit.ts`

### Domain state
- `lib/domain/state/derive-check-state.ts`
- `lib/domain/state/payment-state.ts`
- `lib/domain/state/receipt-state.ts`
- `lib/domain/state/rewards-state.ts`
- `lib/domain/state/identity-state.ts`
- `lib/domain/state/next-action.ts`

### Exceptions
- `lib/domain/exceptions/detect-exceptions.ts`
- `lib/domain/exceptions/payment-rules.ts`
- `lib/domain/exceptions/receipt-rules.ts`
- `lib/domain/exceptions/rewards-rules.ts`
- `lib/domain/exceptions/identity-rules.ts`
- `lib/domain/exceptions/ops-rules.ts`

### Identity
- `lib/domain/identity/normalize-identities.ts`
- `lib/domain/identity/match-rules.ts`
- `lib/domain/identity/generate-candidate-matches.ts`
- `lib/domain/identity/explain-match.ts`

### Support
- `lib/domain/support/generate-support-summary.ts`
- `lib/domain/support/export-markdown.ts`
- `lib/domain/support/export-text.ts`
- `lib/domain/support/export-json.ts`

### Seeds
- `lib/db/seed/restaurants.ts`
- `lib/db/seed/guests.ts`
- `lib/db/seed/scenarios.ts`
- `lib/db/seed/events.ts`
- `scripts/seed.ts`

### Features
- `features/checks/components/check-header.tsx`
- `features/checks/components/check-timeline.tsx`
- `features/checks/components/check-state-card.tsx`
- `features/checks/components/diner-clarity-panel.tsx`
- `features/exceptions/components/exception-queue-table.tsx`
- `features/guests/components/identity-panel.tsx`
- `features/support/components/support-export-menu.tsx`
- `features/scenarios/components/scenario-replay-panel.tsx`

---

## Domain Enums and Constants

Define central enums/constants for:
- event types
- event groups
- payment states
- receipt states
- rewards states
- identity states
- exception severities
- exception statuses
- service states
- actor roles
- source systems

Do not hardcode these throughout the UI.

---

## Seed Scenario Specs

Implement at least these 8 scenarios:

### 1. Happy path
- all normal events occur in order
- no active exceptions

### 2. Preauth confusion
- preauth placed
- payment captured
- preauth release delayed
- diner clarity panel should explain hold vs final charge

### 3. Missing final receipt
- capture succeeds
- final receipt delayed
- rewards blocked until receipt

### 4. Duplicate charge suspicion
- repeated capture attempt or suspicious second capture
- urgent exception
- support summary should be especially good here

### 5. Reservation holder not payer
- host booked reservation
- attendee pays through app
- identity ambiguity should be handled gracefully

### 6. Network degradation during close
- degraded network or terminal issue
- fallback flow entered
- manual override available or used

### 7. VIP profile not linked
- existing high-value guest likely matches payment identity
- medium or high-confidence suggestion visible

### 8. Hosted dinner / event support example
- organizer, payer, attendee roles differ
- event_booking row connected to check
- no full workflow required, only structural support

Optional extra scenarios:
- reopened closed check
- itemization unavailable
- rewards post failure after final receipt

---

## Testing Plan

### Unit tests
Prioritize pure domain modules:
- reducer / derived state
- exception rules
- identity matching score generation
- support summary generation

### Integration tests
- API route / server action returns expected assembled payload
- manual override generates audit log
- scenario replay updates state correctly

### UI tests if time permits
- check detail renders timeline and exceptions
- filters work on exception queue

### Manual QA checklist
- load every scenario
- verify expected exceptions
- verify next action text
- verify diner clarity copy
- verify identity rationale
- verify export output

---

## Prompting Strategy for Codex

Best practice:
- give Codex the PRD and this guide as files
- ask it to summarize implementation plan first
- then ask it to implement phase by phase
- after each phase, ask it to self-audit against acceptance criteria

Good cadence:
1. scaffold + schema
2. seeds + domain logic
3. UI core screens
4. overrides + export
5. polish

Avoid asking Codex to “build the whole thing” in one shot.

---

## Suggested Task Queue

Use this queue if you want to drive Codex interactively.

### Task 1
Read `HOSTED_CHECK_DEPOSIT_RESOLUTION_PRD.md`, `HOSTED_CHECK_DEPOSIT_SCHEMA_AND_SEEDS.md`, and `CODEX_BUILD_GUIDE.md`. Produce a concise implementation plan and proposed folder structure before writing code.

### Task 2
Scaffold the Next.js app, install dependencies, create app shell, and define domain enums/constants.

### Task 3
Implement Drizzle schema and migrations for all core tables.

### Task 4
Implement deterministic seed scripts for restaurants, guest profiles, identity fragments, checks, and scenarios.

### Task 5
Implement pure derived state engine.

### Task 6
Implement exception detection engine.

### Task 7
Implement rules-based identity matching engine.

### Task 8
Implement read APIs / loaders for Overview, Exception Queue, and Check Detail.

### Task 9
Implement Overview and Exception Queue screens.

### Task 10
Implement Check Detail screen thoroughly.

### Task 11
Leave Guest Detail and Scenario Replay deferred unless the active branch explicitly requires them.

### Task 12
Implement manual override actions, audit logging, and support export.

### Task 13
Polish UI and write README.

---

## Common Failure Modes to Avoid

### 1. Building a generic dashboard
Symptom:
- too many charts
- not enough operational decision-making

### 2. Spreading business logic into UI
Symptom:
- giant page files
- reducer logic inside components

### 3. Overweighting identity
Symptom:
- guest profile UI dominates the product
- check resolution becomes secondary

### 4. Weak scenarios
Symptom:
- seed data feels fake
- demos do not show real operational ambiguity

### 5. Vague exception copy
Symptom:
- “payment issue detected” instead of clear explanation

### 6. Decorative “AI” additions
Symptom:
- fake copilots or chat widgets that add no product value

### 7. Missing auditability
Symptom:
- manual actions happen without a clear trail

---

## Final QA Checklist

Before calling the build done, verify:

### Architecture
- [ ] event reducer is pure
- [ ] exception engine is modular
- [ ] identity engine is modular
- [ ] handlers are thin
- [ ] UI is not carrying domain logic

### Product behavior
- [ ] happy path works
- [ ] duplicate charge suspicion works
- [ ] delayed final receipt blocks rewards logically
- [ ] preauth confusion is explained clearly
- [ ] payer mismatch is modeled sensibly
- [ ] manual overrides create audit records

### UX
- [ ] exception queue feels useful
- [ ] check detail explains everything needed
- [ ] diner clarity panel uses plain language
- [ ] support summary export is readable
- [ ] scenario replay is demoable

### Quality
- [ ] README explains architecture and rationale
- [ ] code is typed cleanly
- [ ] seed script is deterministic
- [ ] app looks polished enough to show externally

---

## Appendix: Master Prompt for Codex

Use this as the initial top-level prompt if needed.

```text
Read `HOSTED_CHECK_DEPOSIT_RESOLUTION_PRD.md`, `HOSTED_CHECK_DEPOSIT_SCHEMA_AND_SEEDS.md`, and `CODEX_BUILD_GUIDE.md` before making implementation decisions.

Build Checkgraph as a serious operator-facing restaurant payments exception-resolution prototype.

Optimize for:
- event-driven architecture
- explainable derived state
- explicit exception detection
- light, rules-based identity matching
- support for future high-value workflows
- polished ops-tool UX

Do not build a generic dashboard.
Do not build a CRM.
Do not add fake AI surfaces.
Do not overbuild auth.

Start by producing a concise implementation plan, folder structure, and schema plan.
Then implement in phases according to the build guide.
After each major phase, self-audit against the acceptance criteria in `CODEX_BUILD_GUIDE.md`.
```

---

## Final Note

This guide is intentionally opinionated.

The highest-risk failure mode is not underengineering. It is **building the wrong thing elegantly**.

Stay anchored to the core thesis:

> Checkgraph is a source-of-truth and recovery product for restaurant check lifecycle ambiguity, designed so that identity and higher-value workflows fit naturally on top later.
