# Checkgraph PRD

**Version:** 1.0  
**Owner:** Vidith Salla  
**Type:** Product Requirements Document  
**Status:** Build-ready prototype spec  
**Last updated:** 2026-03-30

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Context and Rationale](#context-and-rationale)
3. [Problem Statement](#problem-statement)
4. [Product Vision](#product-vision)
5. [Product Principles](#product-principles)
6. [Users and Stakeholders](#users-and-stakeholders)
7. [Goals and Non-Goals](#goals-and-non-goals)
8. [Scope](#scope)
9. [Core Product Thesis](#core-product-thesis)
10. [Primary Use Cases](#primary-use-cases)
11. [User Stories](#user-stories)
12. [Information Architecture](#information-architecture)
13. [Core Domain Concepts](#core-domain-concepts)
14. [Event Model](#event-model)
15. [Derived State Model](#derived-state-model)
16. [Exception Taxonomy](#exception-taxonomy)
17. [Exception Detection Logic](#exception-detection-logic)
18. [Identity Matching Model](#identity-matching-model)
19. [Support for Higher-Value Workflows](#support-for-higher-value-workflows)
20. [Functional Requirements](#functional-requirements)
21. [UX and Interface Requirements](#ux-and-interface-requirements)
22. [Data Model](#data-model)
23. [API Design](#api-design)
24. [Business Rules](#business-rules)
25. [Seed Scenarios](#seed-scenarios)
26. [Permissions and Roles](#permissions-and-roles)
27. [Technical Architecture](#technical-architecture)
28. [Implementation Plan](#implementation-plan)
29. [Testing Strategy](#testing-strategy)
30. [Demo Narrative](#demo-narrative)
31. [Success Criteria](#success-criteria)
32. [README Requirements](#readme-requirements)
33. [Known Limitations](#known-limitations)
34. [Future Extensions](#future-extensions)
35. [Appendix A: Sample Support Summary](#appendix-a-sample-support-summary)
36. [Appendix B: Seed Data Outline](#appendix-b-seed-data-outline)
37. [Glossary](#glossary)

---

## Executive Summary

**Checkgraph** is an event-driven payment-state and exception-resolution console for restaurant operations.

It gives restaurant staff, managers, support operators, and product or engineering users a single, explainable source of truth for what happened to a check across:

- diner app state
- check lifecycle state
- payment authorization and capture state
- terminal or operational events
- final receipt state
- rewards posting state
- guest identity linkage
- manual overrides and support actions

The core idea is simple:

> A restaurant payment issue is rarely just a payment issue. It is usually a state-coordination problem across systems, actors, and time.

Checkgraph models those systems as an **append-only event stream**, computes **derived state** from those events, detects **operational exceptions**, and recommends **next actions** for staff or support.

This prototype is intentionally framed as infrastructure that can later support:

- guest identity resolution
- hosted or VIP dining
- private dining and event workflows
- deposits and payer-versus-attendee relationships
- restaurant support and service recovery

This is **not** a generic dashboard, **not** a fake payment processor, and **not** a private dining CRM. It is a product-minded infrastructure prototype that shows strong systems thinking.

---

## Context and Rationale

Public Blackbird signals suggest a few overlapping realities:

1. Blackbird is clearly investing in **tooling and transparency**, keeping **operators at the controls**, and expanding terminal upgrades and integrations.
2. Blackbird has also highlighted **guest identity**, **security**, and **higher-value workflows** such as catering and private dining.
3. Their engineering hiring language points much more concretely to live operational pain: **real-time payment flows**, **fallback handling**, **spotty networks**, **terminal reliability**, and restaurant software that staff rely on during service.
4. Public customer feedback frequently reflects confusion around payment state, holds, itemization, and reward timing.

That suggests the best prototype is one that attacks the hard coordination problem directly while still being extensible into identity and higher-value workflows.

This PRD is designed to make that product concrete enough for an engineering build, not just a concept deck.

---

## Problem Statement

In restaurant payments, the “truth” of a check is fragmented across multiple systems and actors:

- the guest sees one state in an app
- the server sees another state on the floor
- the terminal has its own execution path
- the backend may have auth but not capture
- the final receipt may arrive later than payment authorization
- rewards may depend on final receipt timing
- the guest identity tied to the payment may not match the reservation or party organizer
- support may be forced to reconstruct the incident manually

When those systems drift out of sync, the consequences are operational and reputational:

- staff cannot confidently tell if a table is settled
- guests think they were charged twice
- support lacks a reliable incident history
- rewards appear broken even when they are merely delayed
- wrong guest profiles are linked to checks
- high-value workflows become harder to manage

The deeper problem is not “bad UI.” It is the absence of a single, explainable, operator-friendly model of check lifecycle truth.

---

## Product Vision

Build the infrastructure layer that answers:

> “What is happening with this check right now, what likely went wrong, who should act next, and how do we recover cleanly?”

The system should also be architected so the same underlying model can support future workflows like:

- guest identity resolution
- hosted or VIP dining
- private dining and event management
- deposits and event billing
- support investigations
- restaurant operations analytics

---

## Product Principles

### 1. Event-first, not flag-first
The source of truth is an append-only event stream. Mutable summary rows are outputs, not primary truth.

### 2. Explainability over magic
Every state, match suggestion, and exception should be understandable by an operator.

### 3. Recovery over passive monitoring
The product should help resolve issues, not just display them.

### 4. Operator clarity over engineering cleverness
Operational usefulness matters more than fancy abstractions.

### 5. Identity as a supporting capability
Identity matching matters, but it should support operational workflows rather than become the only product surface.

### 6. Extensible infrastructure
The model should naturally extend into higher-value service workflows without rethinking the foundation.

### 7. Failure-oriented design
The prototype should focus heavily on failure states, not just happy-path payment completion.

---

## Users and Stakeholders

### Primary Users

#### Restaurant Staff
Includes:
- server / waiter
- host
- maître d’
- floor manager
- general manager

Needs:
- know whether a diner has already paid
- know whether payment is pending or complete
- understand when guest identity or party ownership is ambiguous
- avoid awkward or incorrect guest interactions
- recover from payment-state confusion in real time

#### Support Operators
Needs:
- see full event timeline
- understand cross-system state
- investigate duplicate-charge suspicion
- distinguish hold-versus-capture confusion
- understand reward delays
- export concise issue summaries

### Secondary Users

#### Product / Engineering / QA
Needs:
- inspect real-world event sequences
- replay failure scenarios
- validate derived state logic
- reason about gaps in flows and integrations

### Tertiary Users

#### Restaurant Operations Leadership
Needs:
- visibility into exception categories
- visibility into manual overrides
- insight into operational friction patterns

---

## Goals and Non-Goals

## Goals

### Primary Goals
- Create a **single source of truth** for check lifecycle state.
- Detect and categorize **exceptions** clearly.
- Provide **recommended next actions** for operational recovery.
- Support **light identity matching** where it affects payment or service workflows.
- Demonstrate a model that can extend into **guest identity** and **higher-value workflows**.

### Secondary Goals
- Improve diner-facing clarity around payment state.
- Generate useful support summaries.
- Show engineering and product maturity through architecture and system modeling.

## Non-Goals
- Real payment processing
- Processor integrations
- Full POS integration
- Full reservation system
- Full private dining CRM
- Full fraud platform
- Production-grade authentication and access control
- Blockchain logic or token economics
- Mobile-native app development
- Advanced ML identity resolution

---

## Scope

## Included in Prototype Scope
- event timeline modeling
- derived state engine
- exception detection engine
- exception queue
- check detail view
- diner clarity panel
- identity matching panel
- manual override flow
- audit log
- support export flow
- guest detail screen
- scenario replay screen
- seed data with realistic operational cases
- minimal future-facing support for hosted and high-value workflows

## Explicitly Deferred
- live external integrations
- processor reconciliation jobs
- configurable rules engine UI
- multitenant production auth
- notifications and messaging
- full analytics platform
- restaurant-specific integration adapters

---

## Core Product Thesis

A restaurant payment or guest-service issue should be modeled as a **check lifecycle problem**, not a narrow transaction problem.

A check should have:
- a timeline of immutable facts
- a derived current state
- explicit exceptions
- recommended next actions
- guest identity context
- support exportability
- manual intervention history

That infrastructure is useful immediately for payment recovery and later for guest identity and higher-value workflows.

---

## Primary Use Cases

### Use Case 1: Server needs to know whether the guest is actually paid
A guest says they already paid in-app. The server needs a fast answer.

The system should show:
- payment state
- receipt state
- rewards dependency if relevant
- any open exception
- recommended next action

### Use Case 2: Duplicate charge suspicion
A guest sees a hold and a charge, or thinks they were charged twice.

The system should show:
- event timeline
- whether duplicate capture is likely
- whether a preauthorization hold is still visible
- whether the final receipt has closed the check
- support-friendly explanation

### Use Case 3: Rewards have not posted yet
A diner or operator wants to know why rewards are missing.

The system should show:
- whether rewards are blocked on final receipt
- whether rewards posting failed
- expected next step

### Use Case 4: Wrong guest linked to the check
A reservation holder and payer are different people, or the system has ambiguous guest fragments.

The system should:
- surface candidate matches
- show confidence and reasons
- allow operator confirmation or rejection
- log decisions

### Use Case 5: Hosted or higher-value service context
An organizer, payer, and attendees may differ.

The system should support:
- organizer identity
- payer identity
- deposit support in schema
- event linkage

---

## User Stories

### Staff Stories
- As a server, I want to know if the guest has safely paid before I clear the table.
- As a manager, I want to see all active payment-related exceptions in one place.
- As a host, I want to understand whether the check is linked to the correct guest.
- As a manager, I want to apply a manual override with a reason when I need to intervene.

### Support Stories
- As a support operator, I want a concise event history so I do not have to reconstruct incidents manually.
- As a support operator, I want to know whether a charge is duplicated, pending, or simply a hold.
- As a support operator, I want to export a summary for internal or customer-facing workflows.

### Product / Engineering Stories
- As an engineer, I want to replay seeded scenarios to validate state logic.
- As a QA reviewer, I want to see exactly how derived state changes when new events arrive.
- As a product reviewer, I want to see how the core architecture extends into identity and higher-value workflows.

---

## Information Architecture

### Main Navigation
1. Overview
2. Exception Queue
3. Checks
4. Guests
5. Support Cases
6. Scenario Replay
7. Audit Log

### Core Pages

#### Overview
Displays operational summary:
- active checks
- action-required exceptions
- urgent exceptions
- awaiting final receipt
- identity ambiguities
- reward delays
- recent manual overrides

#### Exception Queue
Displays active exception rows with filtering and sorting.

#### Check Detail
Primary screen showing:
- current state
- timeline
- exception details
- recommended next action
- diner clarity panel
- identity panel
- audit log
- support export

#### Guest Detail
Displays:
- canonical profile
- identity fragments
- candidate matches
- linked check history
- decision history

#### Scenario Replay
Allows replay and step-through of seeded event sequences.

#### Audit Log
Central place for manual actions and operator decisions.

---

## Core Domain Concepts

### Check
A dining payment session that moves through a lifecycle.

### Event
An immutable fact about the check, guest, payment, receipt, or intervention.

### Derived State
A computed representation of current truth based on ordered events.

### Exception
A named operational problem inferred from state and event history.

### Identity Fragment
A partial record from one source system representing a possible guest.

### Canonical Guest
A linked or operator-confirmed guest profile.

### Support Case
An investigation or issue tied to a check.

### High-Value Workflow Context
A context such as hosted dining, event dining, or private dining where payer, organizer, and attendee can differ.

---

## Event Model

### Event Groups
- payment
- receipt
- rewards
- identity
- operations
- support
- overrides

### Supported Event Types

#### Payment Events
- `check_created`
- `check_opened`
- `check_viewed_by_diner`
- `items_synced`
- `tip_selected`
- `split_requested`
- `split_confirmed`
- `payment_method_attached`
- `preauth_placed`
- `preauth_released`
- `payment_authorization_requested`
- `payment_authorized`
- `payment_authorization_failed`
- `payment_capture_requested`
- `payment_captured`
- `payment_capture_failed`
- `check_closed`
- `check_reopened`

#### Receipt Events
- `final_receipt_received`
- `final_receipt_missing_timeout`
- `receipt_itemization_unavailable`

#### Rewards Events
- `rewards_eligibility_confirmed`
- `rewards_post_requested`
- `rewards_posted`
- `rewards_post_failed`

#### Identity Events
- `guest_checkin_detected`
- `reservation_attached`
- `payment_identity_detected`
- `identity_match_suggested`
- `identity_match_confirmed`
- `identity_match_rejected`
- `identity_merge_applied`
- `payer_reservation_mismatch_detected`

#### Operational Events
- `network_degraded`
- `terminal_offline`
- `fallback_mode_entered`
- `fallback_mode_exited`
- `duplicate_charge_suspected`

#### Support and Override Events
- `manual_override_applied`
- `manual_override_reverted`
- `support_case_created`
- `support_case_resolved`

### Event Requirements
Every event should store:
- event ID
- check ID
- event type
- event group
- occurred_at timestamp
- source_system
- actor_type
- actor_id if available
- correlation_id
- idempotency_key if relevant
- payload JSON

### Design Note
The system must not rely on manually updated summary flags spread across the application. The reducer should always be able to recompute the check’s state from ordered events.

---

## Derived State Model

For each check, compute:

### Payment State
Enum:
- `not_started`
- `preauthorized`
- `authorization_pending`
- `authorized`
- `capture_pending`
- `captured`
- `capture_failed`
- `closed`
- `unknown`

### Receipt State
Enum:
- `not_available`
- `pending`
- `received`
- `missing_after_timeout`

### Rewards State
Enum:
- `not_eligible`
- `awaiting_final_receipt`
- `ready_to_post`
- `posting`
- `posted`
- `failed`

### Identity State
Enum:
- `unlinked`
- `linked_confident`
- `linked_low_confidence`
- `ambiguous`
- `mismatch_flagged`

### Exception State
Enum:
- `none`
- `warning`
- `action_required`
- `urgent`

### Service State
Enum:
- `active`
- `awaiting_guest_action`
- `awaiting_staff_action`
- `awaiting_backend_completion`
- `blocked`
- `completed`

### Next Action Fields
- `next_action_owner`
- `next_action_text`

### Reducer Requirement
Derived state must be computed via a pure or near-pure reducer layer with minimal hidden side effects.

---

## Exception Taxonomy

Exceptions are explicit, named, and actionable.

### Payment Exceptions
- `duplicate_charge_suspected`
- `auth_succeeded_capture_missing`
- `capture_succeeded_close_missing`
- `stale_preauth_visibility`
- `payment_state_unknown`
- `capture_failed_after_auth`
- `reopened_after_close`

### Receipt Exceptions
- `final_receipt_missing_after_timeout`
- `receipt_itemization_unavailable`
- `receipt_amount_mismatch`

### Rewards Exceptions
- `rewards_waiting_on_final_receipt`
- `rewards_failed_after_receipt`
- `rewards_posted_to_ambiguous_guest`

### Identity Exceptions
- `payer_reservation_mismatch`
- `multiple_plausible_guest_matches`
- `low_confidence_guest_assignment`
- `vip_profile_not_linked`

### Operational Exceptions
- `network_degraded_during_payment`
- `terminal_offline_during_close`
- `fallback_mode_unresolved`
- `manual_override_without_note`

### Exception Data Fields
Each exception should include:
- type
- severity
- explanation_text
- recommended_owner
- recommended_next_action
- status
- detected_at
- resolved_at if resolved

---

## Exception Detection Logic

The detector should evaluate ordered events and derived state to produce active exceptions.

### Example Rules

#### Rule 1: Auth without capture
If `payment_authorized` exists and `payment_captured` does not occur within expected bounds, create:
- `auth_succeeded_capture_missing`
- severity: `action_required`

#### Rule 2: Capture without close
If `payment_captured` exists but `check_closed` is missing after expected processing interval, create:
- `capture_succeeded_close_missing`
- severity: `warning` or `action_required`

#### Rule 3: Stale hold visibility
If `preauth_placed` exists and `payment_captured` exists but `preauth_released` does not arrive within threshold, create:
- `stale_preauth_visibility`
- severity: `warning`

#### Rule 4: Duplicate capture suspicion
If duplicate or near-duplicate capture events occur for the same check and similar amount, create:
- `duplicate_charge_suspected`
- severity: `urgent`

#### Rule 5: Rewards blocked by receipt timing
If rewards are eligible but final receipt is missing beyond expected time, create:
- `rewards_waiting_on_final_receipt`
- severity: `warning`

#### Rule 6: Identity mismatch
If reservation-linked guest and payer-linked guest conflict with insufficient confidence, create:
- `payer_reservation_mismatch`
- severity: depends on context

#### Rule 7: Network degradation during close
If network or terminal degradation occurs during capture or close and the state is unresolved, create:
- `network_degraded_during_payment` or `terminal_offline_during_close`

### Rule System Requirement
Keep the rule system local, explicit, deterministic, and easy to inspect. Do not hide it inside UI components.

---

## Identity Matching Model

Identity matching is intentionally lightweight and explainable.

### Goal
Answer:

> “Which guest should this check be attached to for operational purposes?”

Not:

> “Who is this person globally across all time with machine learning?”

### Identity Sources
- reservation record
- check-in profile
- app account
- payment identity
- phone number
- email
- card or payment alias
- prior linked history
- party metadata
- event or booking relationship

### Matching Signals
- exact normalized phone match
- exact normalized email match
- normalized name plus phone suffix
- reservation and check-in temporal proximity
- same party size or booking window
- same device or app identity
- same payment alias used across previous visits
- organizer-payer relationship in hosted workflow

### Output Per Candidate
- candidate guest ID
- confidence score
- reasons array
- conflicts array
- suggested action

### Confidence Bands
- `0.90–1.00` high
- `0.70–0.89` medium
- `0.45–0.69` low
- `<0.45` do not suggest

### Operator Actions
- confirm link
- reject link
- mark payer-versus-organizer split
- create new guest
- merge fragments into canonical guest

### Important Constraint
Do not use ML. Use a simple, rules-based scoring system that can be explained on-screen.

---

## Support for Higher-Value Workflows

The prototype should be framed as infrastructure that can support higher-value workflows, not merely reactive payment debugging.

### Supported Future Concepts
Schema and architecture should allow for:
- hosted dining
- VIP service
- event bookings
- private dining
- deposits
- organizer / payer / attendee relationships
- house accounts

### Minimal Future-Facing Entities
- `event_bookings`
- `organizer_guest_id`
- `payer_guest_id`
- `deposit_amount`
- `booking_type`
- `service_tier`
- `vip_status_snapshot`

### Why This Matters
This allows the project to be truthfully framed as:

> infrastructure for payment-state resolution that also supports guest identity and higher-value workflows.

---

## Functional Requirements

### FR1. Overview Dashboard
The system shall display:
- total active checks
- total active exceptions
- count by severity
- count by exception type
- count of checks awaiting final receipt
- count of identity ambiguities
- count of reward delays
- count of recent manual overrides

### FR2. Exception Queue
The system shall provide:
- filter by severity
- filter by exception type
- filter by restaurant
- filter by service mode
- sort by age, severity, amount
- quick open to check detail

### FR3. Check Detail Timeline
The system shall:
- show ordered event timeline
- visually group event types
- show raw timestamps
- show event metadata
- show derived current state
- show active exceptions
- show next action recommendation

### FR4. Recommended Next Action Engine
The system shall compute:
- who should act next
- what action is recommended
- whether guest communication is needed
- whether escalation is needed

### FR5. Diner Clarity Panel
The system shall provide a human-readable summary answering:
- what amount is final
- whether a hold may still appear
- whether the final receipt is available
- whether rewards are pending and why
- what to do if something looks wrong

### FR6. Identity Panel
The system shall show:
- linked canonical guest
- identity fragments
- candidate guest matches
- reasons and conflicts
- operator actions and notes

### FR7. Manual Override Flow
Authorized users shall be able to:
- mark payment confirmed
- confirm or reject guest match
- suppress false-positive exception
- reopen a check
- attach notes

All manual actions must:
- require reason text
- generate audit log entry
- emit event

### FR8. Support Summary Generator
The system shall generate support export in:
- Markdown
- JSON
- plain text

Summary should include:
- check metadata
- payment summary
- receipt summary
- rewards summary
- identity summary
- exception summary
- manual actions taken

### FR9. Guest Detail Screen
The system shall display:
- canonical guest profile
- fragments
- linked checks
- candidate match history
- operator decision history

### FR10. Scenario Replay
The system shall allow:
- replay of seeded scenarios
- step-through view
- reset
- optional mutation of one or two values
- real-time recomputation of derived state

### FR11. Audit Log
The system shall provide a searchable audit trail of overrides and decisions.

---

## UX and Interface Requirements

### Design Goals
- should feel like a credible operator tool
- should emphasize clarity and legibility
- should avoid fake analytics fluff
- should make timeline and exception logic central

### Overview Screen
Components:
- KPI cards
- recent exceptions table
- severity distribution
- active manual overrides or recent actions

### Exception Queue
A dense operational table with:
- severity chips
- exception type
- restaurant
- table or channel
- amount
- age
- recommended owner
- link to detail

### Check Detail Screen
This is the most important page.

Suggested layout:

#### Header
- check ID
- restaurant
- table or service channel
- amount
- current state
- severity
- last updated

#### Main Column
- event timeline
- raw event inspector

#### Side Column
- derived state card
- active exceptions
- recommended next action card
- diner clarity panel
- identity panel
- support export controls
- audit log preview

### Guest Detail Screen
- canonical guest profile summary
- identity fragments table
- match rationale
- linked check history
- decision history

### Scenario Replay Screen
- scenario selector
- replay controls
- event stream viewer
- derived state comparison

### Tone of Copy
Should sound:
- calm
- operational
- trust-building
- concise
- non-robotic

---

## Data Model

### `restaurants`
- id
- name
- service_mode
- timezone

### `checks`
- id
- restaurant_id
- external_check_ref
- table_label
- service_channel
- subtotal_amount
- tax_amount
- tip_amount
- total_amount
- currency
- opened_at
- closed_at_nullable

### `check_events`
- id
- check_id
- event_type
- event_group
- occurred_at
- source_system
- actor_type
- actor_id_nullable
- payload_json
- idempotency_key
- correlation_id

### `derived_check_state`
- check_id
- payment_state
- receipt_state
- rewards_state
- identity_state
- exception_state
- service_state
- next_action_owner
- next_action_text
- updated_at

### `exceptions`
- id
- check_id
- exception_type
- severity
- status
- detected_at
- resolved_at_nullable
- assigned_role_nullable
- assigned_user_nullable
- explanation_text
- resolution_text_nullable

### `guest_profiles`
- id
- display_name
- phone_normalized_nullable
- email_normalized_nullable
- vip_tier_nullable
- notes_nullable

### `guest_identity_fragments`
- id
- guest_profile_id_nullable
- source_system
- external_identity_ref
- raw_name_nullable
- raw_phone_nullable
- raw_email_nullable
- payment_alias_nullable
- reservation_ref_nullable
- metadata_json

### `guest_match_suggestions`
- id
- check_id
- fragment_id
- candidate_guest_id
- confidence_score
- reasons_json
- conflicts_json
- status
- reviewed_by_nullable
- reviewed_at_nullable

### `support_cases`
- id
- check_id
- status
- summary
- created_at
- resolved_at_nullable

### `audit_logs`
- id
- entity_type
- entity_id
- action_type
- actor_role
- actor_id
- note
- payload_json
- created_at

### `event_bookings`
Minimal future-facing schema:
- id
- restaurant_id
- organizer_guest_id_nullable
- payer_guest_id_nullable
- booking_type
- deposit_amount_nullable
- status

---

## API Design

### `GET /api/checks`
Returns check list with optional filters:
- severity
- status
- restaurant
- exception type
- page

### `GET /api/checks/:id`
Returns:
- check
- timeline
- derived state
- exceptions
- guest data
- audit log
- support summary preview

### `POST /api/checks/:id/events`
For seeded scenario replay or dev simulation.

### `POST /api/checks/:id/override`
Payload:
- action_type
- reason
- note

### `GET /api/exceptions`
Returns current exception queue.

### `GET /api/guests/:id`
Returns guest profile, fragments, linked checks, and decision history.

### `POST /api/matches/:id/confirm`
Confirms identity suggestion.

### `POST /api/matches/:id/reject`
Rejects identity suggestion.

### `POST /api/support-cases`
Creates support case from check.

### `GET /api/support-cases/:id/export`
Formats:
- markdown
- json
- text

---

## Business Rules

1. A check cannot be considered fully closed unless payment is captured or a manual override explicitly confirms payment.
2. Rewards cannot be posted without final receipt.
3. High-confidence identity matches may be suggested automatically, but low-confidence matches should not auto-link.
4. Duplicate capture suspicion cannot auto-resolve.
5. Manual override requires reason and audit log entry.
6. Payer-versus-reservation mismatch may be normal in hosted or event contexts.
7. A stale preauthorization hold is usually informational or warning-level, not always a critical payment error.
8. Seed or replay data must be clearly labeled synthetic.
9. Derived state must remain reproducible from the event stream.

---

## Seed Scenarios

At least 8 realistic scenarios should be seeded.

### Scenario 1: Happy Path
- diner checks in
- items sync
- payment is authorized and captured
- final receipt arrives
- rewards post
- check closes cleanly

### Scenario 2: Preauth Confusion
- hold is placed
- final charge is captured
- hold release is delayed
- diner sees two amounts
- system explains hold versus final charge

### Scenario 3: Delayed Final Receipt
- payment captures
- final receipt does not arrive in time
- rewards stay pending
- exception flags reward delay cause

### Scenario 4: Duplicate Charge Suspicion
- repeated or duplicated capture occurs
- urgent exception raised
- support summary highlights likely issue

### Scenario 5: Reservation Holder != Payer
- reservation is attached to one guest
- payment identity belongs to another
- system suggests organizer or payer split instead of assuming bad match

### Scenario 6: Network Degradation During Close
- network degrades during close or capture flow
- fallback mode is entered
- manager applies override
- audit log records rationale

### Scenario 7: Existing VIP Profile Not Linked
- known VIP guest exists
- current fragment is low or medium confidence
- operator confirms link
- audit history records decision

### Scenario 8: Higher-Value Hosted Dinner Example
- organizer, payer, and attendee context all differ
- deposit record exists in event booking schema
- final check links into booking context

### Optional Extra Scenarios
- rewards posted to ambiguous guest
- terminal offline during close
- false positive duplicate suspicion manually resolved

---

## Permissions and Roles

### Server Role
- view check detail
- view exception queue
- view identity suggestions

### Manager Role
- resolve warnings
- apply overrides
- confirm guest matches
- reopen checks

### Support Role
- create support case
- export support summaries
- mark issues resolved

### Admin Role
- replay scenarios
- manage seed data
- resolve urgent exceptions
- inspect full audit log

### Prototype Note
Use seeded local roles and a role switcher instead of full auth implementation.

---

## Technical Architecture

### Recommended Stack
- Next.js 15
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui
- Supabase Postgres
- Drizzle ORM
- Zod
- lucide-react
- date-fns

### Architectural Separation
Suggested folders:
- `app/`
- `components/`
- `features/checks/`
- `features/exceptions/`
- `features/guests/`
- `features/support/`
- `features/scenarios/`
- `lib/db/`
- `lib/state/`
- `lib/matching/`
- `lib/formatters/`
- `lib/constants/`

### Logic Placement
Do not place business logic in page components.

Keep separate:
- schema
- seed data
- reducer
- exception detection rules
- identity matching rules
- formatters and export helpers
- server actions or API routes

### State Engine Requirement
Derived state must be recomputed from ordered events and should be testable independently from UI.

---

## Implementation Plan

### Phase 1: Foundation
- initialize repository structure
- define schema
- set up migrations
- write seed plan

### Phase 2: Core Logic
- build reducer for derived state
- build exception detection engine
- build identity scoring engine

### Phase 3: Read Surfaces
- implement overview
- implement exception queue
- implement check detail page

### Phase 4: Identity and Support
- build guest detail page
- build support summary export
- build manual override flow
- build audit log view

### Phase 5: Scenario Replay and Polish
- add scenario replay controls
- improve timeline and copy
- improve styling and information density
- write README and demo script

---

## Testing Strategy

### Unit Tests
Focus on:
- reducer correctness
- exception rule correctness
- identity scoring logic
- support summary formatting

### Integration Tests
Focus on:
- check detail API
- exception queue data flow
- override flow creates event and audit log
- confirm or reject guest match updates correct entities

### Scenario Validation
Each seeded scenario should specify expected:
- derived state
- exception set
- recommended action
- identity outcome

### UI Verification
Manual checks should verify:
- timeline readability
- exception severity visibility
- clarity panel usefulness
- replay flow correctness

---

## Demo Narrative

The prototype should demo in a strong operational sequence.

### Recommended Demo Flow
1. Start at Overview
2. Open an urgent duplicate-charge suspicion
3. Walk through timeline and derived state
4. Show support summary export
5. Open delayed final receipt scenario
6. Show rewards blocked by receipt timing
7. Open payer-versus-reservation mismatch scenario
8. Show identity suggestions and operator confirmation
9. End by explaining how the same model supports hosted or private workflows

### Core Message of Demo
This is not just a dashboard. It is infrastructure for making restaurant check state legible and recoverable.

---

## Success Criteria

A strong prototype should make a reviewer think:
- this feels like a real operator product
- the author modeled failure states, not just happy paths
- the state logic is coherent and explainable
- identity is integrated thoughtfully, not bolted on
- the architecture could extend into guest identity and higher-value workflows

### Concrete Success Criteria
- at least 8 seeded scenarios
- event timeline is central and clear
- derived state is stable and explainable
- exception queue feels operationally useful
- manual override flow is auditable
- support export is demo-ready
- README explains architecture clearly

---

## README Requirements

The README should include:
- product summary
- problem statement
- why event-driven state is the right abstraction
- architecture overview
- event model
- derived state model
- exception taxonomy
- identity matching approach
- future extension into higher-value workflows
- setup instructions
- screenshots or placeholders
- limitations
- demo walkthrough

### Suggested README Section
Add a short “Design rationale” section explaining:
- why event sourcing is useful here
- why identity is a support capability and not the whole product
- why this foundation can support higher-value service workflows later

---

## Known Limitations

- no real payment integrations
- no real POS integrations
- no real reservation system integration
- no production-grade auth
- no notifications
- no real customer messaging
- no advanced fraud scoring
- no settlement or payout flows
- limited support for restaurant-specific configurations
- scenario data is synthetic

These limitations are acceptable because the prototype is focused on architecture, operational clarity, and exception handling.

---

## Future Extensions

Possible next steps after prototype:

### Identity and Guest Graph
- stronger guest profile consolidation
- household or company relationships
- assistant or organizer delegation patterns

### Higher-Value Workflows
- deposits and prepayments
- hosted dining
- private dining lifecycle
- event contracting and billing support

### Operational Intelligence
- exception trend reporting
- mean time to resolution tracking
- override quality analysis
- reliability analytics by restaurant or service mode

### Integrations
- POS adapters
- reservation system adapters
- payment processor adapters
- CRM or guestbook sync

### Customer Surfaces
- guest-facing issue resolution flows
- proactive status messaging
- better in-app payment explanations

---

## Appendix A: Sample Support Summary

```md
# Support Summary

Check ID: CHK-2048
Restaurant: Demo Bistro - West Village
Table: 14
Total: $126.40
Current Status: Action Required

## Payment Summary
- Authorization requested at 7:42 PM
- Authorization succeeded at 7:42 PM
- Capture requested at 7:48 PM
- Two capture events detected within 14 seconds
- Duplicate charge suspicion active

## Receipt Summary
- Final receipt received at 7:49 PM

## Rewards Summary
- Rewards not posted because support hold is active pending payment review

## Identity Summary
- Reservation guest: Alex Carter
- Payment identity: A. Carter, same phone suffix
- Identity confidence: 0.92
- Canonical guest link confirmed

## Active Exceptions
- duplicate_charge_suspected (urgent)

## Recommended Next Action
- Support should verify whether second capture is a duplicate before confirming resolution to guest.

## Manual Actions
- None
```

---

## Appendix B: Seed Data Outline

### Restaurants
- Demo Bistro, full service
- Orchard House, full service upscale
- Cedar Counter, hybrid counter-service

### Guests
- 6 to 10 guest profiles
- include VIP and normal users
- include fragmented identities across reservation, payment, and app

### Checks
- 10 to 15 checks total
- 8 core scenarios
- mix of normal and problematic flows

### Event Distributions
Each scenario should include a realistic number of events, not just 2 or 3.

Recommended range:
- happy path: 8 to 12 events
- complex failure: 10 to 16 events

### Audit Records
At least 3 scenarios should include manual actions.

---

## Glossary

### Append-only event stream
A timeline where new facts are added, not rewritten.

### Derived state
Current operational summary computed from event history.

### Exception
A named operational issue inferred from data and logic.

### Canonical guest
The best current representation of a guest after linking fragments.

### Identity fragment
A partial guest record from one source system.

### Manual override
An explicit operator action used to resolve or bypass uncertain state.

### Higher-value workflow
A service flow where party relationships, deposits, or VIP context make the operational model more complex than a standard table payment.

---

## Final Build Guidance

This PRD should be treated as the canonical product spec for the prototype.

When building:
- keep the timeline central
- keep the state engine deterministic
- keep exception copy specific
- keep identity explainable
- keep the UI grounded in restaurant operations
- do not add flashy scope that weakens the core

The strongest version of Checkgraph is one that feels like a serious internal or operator product for a real restaurant-tech company, while still clearly hinting at a path into guest identity and higher-value workflows.
