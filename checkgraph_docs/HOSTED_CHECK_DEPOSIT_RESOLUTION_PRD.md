# Checkgraph Phase 2 PRD: Hosted Check / Deposit Resolution

**Version:** 2.0  
**Owner:** Vidith Salla  
**Type:** Product Requirements Document  
**Status:** Build-ready phase extension spec  
**Last updated:** 2026-03-30

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What Changed From Phase 1](#what-changed-from-phase-1)
3. [Context and Rationale](#context-and-rationale)
4. [Problem Statement](#problem-statement)
5. [Product Vision](#product-vision)
6. [Product Principles](#product-principles)
7. [Users and Stakeholders](#users-and-stakeholders)
8. [Goals and Non-Goals](#goals-and-non-goals)
9. [Scope](#scope)
10. [Core Product Thesis](#core-product-thesis)
11. [Why This Phase Exists](#why-this-phase-exists)
12. [Primary Use Cases](#primary-use-cases)
13. [User Stories](#user-stories)
14. [Information Architecture](#information-architecture)
15. [Core Domain Concepts](#core-domain-concepts)
16. [Lifecycle Model](#lifecycle-model)
17. [Event Model](#event-model)
18. [Derived State Model](#derived-state-model)
19. [Exception Taxonomy](#exception-taxonomy)
20. [Exception Detection Logic](#exception-detection-logic)
21. [Identity and Relationship Model](#identity-and-relationship-model)
22. [Deposit Model](#deposit-model)
23. [Hosted Check Allocation Model](#hosted-check-allocation-model)
24. [Functional Requirements](#functional-requirements)
25. [UX and Interface Requirements](#ux-and-interface-requirements)
26. [Data Model](#data-model)
27. [API and Server Actions](#api-and-server-actions)
28. [Business Rules](#business-rules)
29. [Seed Scenarios](#seed-scenarios)
30. [Permissions and Roles](#permissions-and-roles)
31. [Technical Architecture](#technical-architecture)
32. [Implementation Plan](#implementation-plan)
33. [Testing Strategy](#testing-strategy)
34. [Demo Narrative](#demo-narrative)
35. [Success Criteria](#success-criteria)
36. [README Requirements](#readme-requirements)
37. [Known Limitations](#known-limitations)
38. [Future Extensions](#future-extensions)
39. [Appendix A: Sample Support Summary](#appendix-a-sample-support-summary)
40. [Appendix B: Sample Operator Walkthrough](#appendix-b-sample-operator-walkthrough)
41. [Glossary](#glossary)

---

## Executive Summary

This phase extends Checkgraph from a payment-state and exception-resolution console into a higher-value hospitality workflow engine centered on **Hosted Check / Deposit Resolution**.

The core idea is:

> Some of the hardest restaurant payment problems are not simple table payments. They are higher-value service flows where a reservation, organizer, payer, attendee, deposit, access benefit, and final check do not line up cleanly.

This phase keeps the existing event-driven architecture intact and adds support for:

- reservation-linked checks
- organizer, payer, reservation-holder, and attendee role separation
- deposits, holds, prepayments, and hosted credits
- application of deposit value to final settlement
- reconciliation between guest identity and money movement
- operator workflows for resolving ambiguous hosted-payment situations
- support summaries that explain how deposit/prepayment state maps to final check state

This is **not** a private-dining CRM.  
This is **not** a banquet sales tool.  
This is **not** a generic guestbook.

It is an event-driven operational console for explaining and recovering from hosted or higher-value dining payment ambiguity.

---

## What Changed From Phase 1

Phase 1 centered on a standard check lifecycle:
- authorization
- capture
- final receipt
- rewards
- guest identity ambiguity
- operator overrides
- support export

Phase 2 keeps all of that and adds a new layer:
- reservation-linked service context
- deposit lifecycle
- hosted payment allocation
- organizer vs payer vs reservation-holder distinction
- event-booking and hosted-dining support
- deposit and credit application to final check
- new exception classes around deposits, hosted billing, and identity-linked settlement

### What stays the same
- append-only event stream remains the source of truth
- derived state remains reducer-driven
- exception engine remains explicit and inspectable
- manual actions still require auditability
- support export remains a first-class output
- the current console remains the core UI shell

### What changes
- the check can now be part of a booking or hosted context
- a payment issue may now involve deposit state, not just check state
- identity matters more because different people may own different responsibilities
- operational truth must answer not only “was the check paid?” but also “how was it funded?” and “whose obligation was this?”

---

## Context and Rationale

The existing Checkgraph foundation already proved a valuable thesis:
- payment truth and operational closure can diverge
- event-driven state is the right abstraction for restaurant payment ambiguity
- support and operator tools need explicit exception logic

The next logical extension is not a generic CRM or analytics layer. It is the money-and-identity edge case that sits directly on top of the existing architecture:

- deposit requested before service
- deposit authorized or captured under one person
- event booked by another person
- final check presented to a different attendee or payer
- hosted credit or minimum spend applied partially or incorrectly
- final receipt arrives after some hosted settlement logic has already executed
- support needs to explain why the diner sees a hold, a hosted credit, and a remaining balance

This phase exists because it is the highest-leverage way to make the current system feel closer to a real hospitality-tech platform while staying inside the same architectural lane.

---

## Problem Statement

Higher-value restaurant workflows often involve more than one person and more than one money movement:

- a reservation holder may not be the payer
- a corporate organizer may book and fund part of the event
- an attendee may settle the remainder at table
- a deposit may be authorized in advance and later captured or applied to the check
- a hosted amount may cover only part of the final check
- a benefit or VIP entitlement may belong to one identity while the payment method belongs to another

When these states drift out of sync, operators face questions like:

- Is the deposit still just a hold, or was it captured?
- Was the deposit applied to the final check?
- Is the final payer the same person as the organizer?
- Why is the remaining balance still open if there was a deposit?
- Should rewards or identity-linked benefits attach to the attendee, the reservation holder, or the payer?
- If support gets contacted, what is the clean narrative of what happened?

The problem is not only “guest identity” or only “payments.” It is the intersection of:
- payment state
- hosted credit state
- reservation / booking state
- guest role identity
- operator override history
- support recoverability

---

## Product Vision

Build the infrastructure layer that answers:

> “In a hosted or reservation-linked dining workflow, what money has moved, what obligations remain, who is associated with each obligation, and what should the operator do next?”

This should work for:
- simple deposit-before-service cases
- hosted dinners where organizer and payer differ
- event bookings with partial hosted coverage
- VIP or access-linked service flows where identity matters operationally
- support recovery when the guest sees confusing holds or balances

---

## Product Principles

### 1. Preserve the event-first model
Hosted workflows should extend the event model, not bypass it.

### 2. Keep money movement legible
Every hosted or deposit-related state should be explainable in plain language.

### 3. Separate roles, do not collapse them
Reservation holder, organizer, payer, attendee, and primary guest may overlap, but the system should not assume they are the same.

### 4. Hosted logic is still ops logic
Do not let this turn into a sales pipeline or event CRM. The product remains an operator-facing check and settlement system.

### 5. Explain funding composition
Operators and support should be able to answer: what part of the final settlement came from deposit, hosted credit, or direct payer settlement?

### 6. Recovery matters more than richness
A smaller, clearer hosted-payment workflow is better than a giant feature set.

### 7. Phase extension, not product reset
This phase should feel like a natural extension of the current Checkgraph core.

---

## Users and Stakeholders

### Primary Users

#### Restaurant Manager / Event Manager
Needs:
- understand whether a deposit exists and what state it is in
- know whether the deposit was applied to the final check
- distinguish organizer, payer, reservation-holder, and attendee
- resolve hosted payment exceptions quickly
- communicate clearly to guests and staff

#### Server / Floor Manager
Needs:
- know what amount is still due at the table
- know if a hosted amount or deposit already covers part of the final bill
- know whether final payment confirmation is required

#### Support Operator
Needs:
- reconstruct hosted payment or deposit history quickly
- explain why a guest sees a hold plus a remaining balance
- distinguish captured deposit from unapplied deposit
- generate concise case summary

### Secondary Users

#### Product / Engineering
Needs:
- validate hosted settlement state transitions
- inspect how deposits and final checks interact
- test mixed-role identity scenarios

#### Ops Leadership
Needs:
- understand failure patterns around deposits, hosted settlement, and reservation-linked identity ambiguity

---

## Goals and Non-Goals

## Goals

### Primary Goals
- Extend Checkgraph to model deposit and hosted settlement lifecycle.
- Represent distinct guest roles explicitly.
- Detect operational exceptions where deposits, hosted credit, and final check do not reconcile.
- Keep support export useful in hosted and reservation-linked scenarios.
- Demonstrate that the existing event-driven architecture scales to higher-value workflows.

### Secondary Goals
- Make operator-facing settlement composition easy to understand.
- Support one or two live-verifiable hosted-resolution write flows.
- Show clear path into VIP and private-dining workflows without building a CRM.

## Non-Goals
- private-dining lead generation
- proposal / contracting workflow
- banquet sales process
- room-block or external event management
- real processor settlement reconciliation
- enterprise permissions stack
- pricing engine for event packages
- invoice / AR system
- full OpenTable clone or reservation management system

---

## Scope

## Included in Phase 2 Scope
- booking-linked checks
- deposit / prepayment modeling
- hosted amount / hosted credit modeling
- explicit organizer/payer/reservation-holder/primary-guest relationships
- deposit and hosted-payment event types
- deposit-related derived state and exception rules
- operator UI sections for funding composition and booking context
- support export updated for hosted workflow explanation
- at least 4 new or upgraded hosted/deposit scenarios
- at least 1 live-verifiable hosted write flow

## Deferred
- contract negotiation workflow
- external reservation integration
- guest messaging flows
- corporate billing invoicing system
- multi-check event settlement across multiple nights
- dynamic pricing or minimum-spend rules editor
- full replay for hosted scenarios if it slows delivery

---

## Core Product Thesis

Hosted dining ambiguity is still a check lifecycle problem.

The final check may now be funded by multiple sources:
- direct payer settlement
- captured deposit
- hosted credit
- house-account-like sponsor amount

The product should treat those as explicit lifecycle facts, not hidden business logic.

The right product behavior is:
- preserve all money movements as events
- derive funding composition from events
- surface exceptions when the composition is inconsistent or incomplete
- make guest role relationships explicit
- recommend the next action for operators or support

---

## Why This Phase Exists

The phrase from Phase 1,

> “This prototype is intentionally framed as infrastructure that can later support guest identity resolution, hosted or VIP dining, private dining and event workflows, deposits and payer-versus-attendee relationships, restaurant support and service recovery”

should now become real product behavior.

This phase is the smallest meaningful way to prove that promise.

Why this phase and not a full guest graph:
- it uses identity where it matters operationally
- it creates new money movement complexity, not just more profile data
- it keeps the story anchored in check lifecycle truth
- it expands the product toward higher-value workflows without diluting it

---

## Primary Use Cases

### Use Case 1: Deposit exists but was not applied to final check
An event manager expects a captured deposit to reduce the final balance. The console should show:
- deposit state
- whether deposit has been applied, partially applied, or unapplied
- remaining guest-facing balance
- recommended action

### Use Case 2: Reservation holder, organizer, and payer differ
The final table guest says part of the dinner is hosted by a company organizer. The system should show:
- reservation-holder
- organizer
- payer
- primary guest at table
- funding composition
- whether current linkage is confirmed or ambiguous

### Use Case 3: Deposit was captured but booking was canceled or modified
Support needs to understand whether the deposit should be refunded, retained, or converted to credit.

### Use Case 4: Hosted amount covers only part of the final check
The system should show:
- total hosted amount
- hosted amount already applied
- guest balance still due
- any mismatch between booking expectation and final check

### Use Case 5: VIP or member benefit linked to wrong guest in hosted flow
The operator needs to know whether a benefit should be tied to organizer, payer, or attendee.

### Use Case 6: Guest sees both a deposit-related hold and a final charge
Support needs a clean explanation of why both appear and whether one is expected to clear.

---

## User Stories

### Manager Stories
- As a manager, I want to see whether a captured deposit has already been applied to the final check.
- As a manager, I want to know who the organizer is and whether they are also the payer.
- As a manager, I want to attach hosted context without corrupting payment truth.
- As a manager, I want a clear funding composition summary before I explain the bill to a guest.

### Server Stories
- As a server, I want to know how much is still due after hosted coverage or deposit application.
- As a server, I want to know whether this table should be treated as partly hosted, fully hosted, or not hosted.

### Support Stories
- As support, I want a concise timeline showing deposit, hosted, and final check events together.
- As support, I want to explain why a deposit hold and a final payment may both appear.
- As support, I want to know whether the wrong guest identity got linked to the hosted settlement.

### Product / Engineering Stories
- As an engineer, I want hosted workflows to reuse the same event/reducer/exception model.
- As a reviewer, I want to see that the architecture supports higher-value workflows without becoming a CRM.

---

## Information Architecture

### Current Packaged Prototype Navigation
1. Overview
2. Exception Queue
3. Check Detail

Deferred from the current packaged prototype:
- Guest Detail
- Support Cases
- Scenario Replay
- Audit Log screen

### New or Updated Screens / Panels

#### Check Detail (updated)
New hosted-specific sections:
- Booking Context
- Funding Composition
- Deposit State
- Hosted Allocation Summary
- Guest Roles

#### Booking Context Card
Displays:
- booking type
- booking name / event name
- organizer
- reservation holder
- payer
- service tier / hosted context
- deposit summary

#### Funding Composition Card
Displays:
- total check amount
- deposit applied amount
- hosted amount applied
- direct payer remainder
- current remaining balance

#### Deposit Timeline Segment
Highlights:
- deposit requested
- deposit authorized / hold placed
- deposit captured
- deposit released or refunded
- deposit applied to final check

#### Optional Booking Detail Screen
Only if time allows. Not required if the booking context can be shown from Check Detail.

---

## Core Domain Concepts

### Booking Context
A higher-value service wrapper around a check, such as hosted event or private dining.

### Deposit
An advance money movement associated with a booking or reservation context.

### Hosted Amount
An amount that should reduce the final table-visible balance because it is covered by organizer, sponsor, or hosted program.

### Allocation
The act of applying some captured or reserved value to the final check.

### Guest Roles
Separate identities associated with one workflow:
- `reservation_guest_id`
- `organizer_guest_id`
- `payer_guest_id`
- `primary_guest_id`
- optional `attendee_guest_id` fragments

### Funding Composition
The breakdown of who or what is funding the final settlement:
- deposit_applied
- hosted_credit_applied
- direct_payment_due

### Hosted Settlement Exception
An exception that arises because booking/payment/identity state do not reconcile.

---

## Lifecycle Model

Hosted Check / Deposit Resolution introduces a second lifecycle layered on top of the standard check lifecycle.

### Lifecycle 1: Check Lifecycle
- check created
- check opened
- items synced
- authorization / capture
- final receipt
- close

### Lifecycle 2: Hosted Funding Lifecycle
- booking created or attached
- deposit requested
- deposit hold placed or authorized
- deposit captured
- hosted amount committed or configured
- deposit / hosted amount applied to final check
- remainder due settled
- booking settled or refunded

### Lifecycle 3: Role Resolution Lifecycle
- reservation holder attached
- organizer attached
- payer detected
- identity suggestion generated
- role relationship confirmed or corrected

The product should present these three lifecycles coherently on one screen.

---

## Event Model

Phase 2 adds new event types and event groups, while preserving Phase 1 events.

### New Event Group
- `booking`
- `deposit`
- `allocation`

You may choose to keep these within existing `payment` or `lifecycle` groups if implementation simplicity wins, but separate groups are recommended for clarity.

### New Hosted / Deposit Event Types

#### Booking events
- `booking_attached`
- `organizer_attached`
- `reservation_holder_attached`
- `hosted_context_attached`
- `booking_cancelled`
- `booking_modified`

#### Deposit events
- `deposit_requested`
- `deposit_hold_placed`
- `deposit_hold_released`
- `deposit_captured`
- `deposit_refund_requested`
- `deposit_refunded`

#### Hosted allocation events
- `hosted_amount_committed`
- `hosted_amount_adjusted`
- `deposit_applied_to_check`
- `hosted_credit_applied_to_check`
- `allocation_reversed`
- `remaining_balance_recomputed`

#### Identity / relationship events
- `payer_attached`
- `organizer_payer_split_confirmed`
- `reservation_payer_split_confirmed`
- `hosted_benefit_linked`
- `hosted_benefit_unlinked`

### Event Requirements
Every new event should still include:
- check_id or booking_id association
- sequence_no for canonical ordering
- source_system
- actor_type
- actor_id
- payload_json
- correlation_id if relevant

### Event Payload Requirements
Hosted and deposit payloads should include:
- amount_cents
- booking_ref or booking_id
- deposit_ref if relevant
- funding_source_type
- applied_to_check_ref if relevant
- guest role references if relevant

---

## Derived State Model

Phase 2 adds new derived fields on top of the current state engine.

### Existing fields remain
- `payment_state`
- `receipt_state`
- `rewards_state`
- `identity_state`
- `exception_state`
- `service_state`
- `next_action_owner`
- `next_action_text`

### New derived fields

#### Booking state
Enum:
- `none`
- `attached`
- `modified`
- `cancelled`
- `settled`

#### Deposit state
Enum:
- `none`
- `requested`
- `hold_active`
- `captured`
- `partially_applied`
- `fully_applied`
- `refund_pending`
- `refunded`
- `unknown`

#### Hosted settlement state
Enum:
- `none`
- `hosted_pending`
- `partially_reconciled`
- `fully_hosted`
- `settlement_mismatch`
- `settled`

Definition:
`hosted_settlement_state` is an internal stored field representing hosted/deposit funding reconciliation status for the check. It is not a synonym for full check settlement or full payment completion. Use `payment_state` for payment completion truth and `service_state` for operational completion truth.

#### Funding composition values
- `deposit_amount_cents`
- `deposit_applied_amount_cents`
- `hosted_amount_cents`
- `hosted_applied_amount_cents`
- `remaining_balance_cents`
- `direct_payment_due_cents`

#### Role resolution summary
- `organizer_guest_id`
- `payer_guest_id`
- `reservation_guest_id`
- `primary_guest_id`
- `role_resolution_state`

### Reducer requirement
These fields must be computed from events plus booking/identity context, not hand-maintained in UI.

---

## Exception Taxonomy

Phase 2 adds new hosted/deposit-related exception classes.

### Deposit exceptions
- `deposit_captured_not_applied`
- `deposit_hold_stale`
- `deposit_refund_missing`
- `deposit_refunded_after_application`
- `deposit_state_unknown`

### Hosted settlement exceptions
- `hosted_amount_missing_for_booking`
- `hosted_amount_exceeds_check`
- `hosted_settlement_mismatch`
- `remaining_balance_incorrect`
- `booking_cancelled_with_active_deposit`

### Role / identity exceptions
- `organizer_payer_mismatch`
- `reservation_organizer_mismatch`
- `hosted_benefit_linked_to_wrong_guest`
- `unresolved_role_assignment`

### Support / clarity exceptions
- `guest_visible_hold_plus_final_charge`
- `deposit_application_not_reflected_in_receipt`

### Existing exceptions still apply
- `duplicate_charge_suspected`
- `final_receipt_missing_after_timeout`
- `payer_reservation_mismatch`
- etc.

### Severity guidance
- warning: informational but important mismatch
- action_required: operator must resolve before clean closure
- urgent: money movement likely wrong or guest-facing harm likely

---

## Exception Detection Logic

### Rule 1: Deposit captured but not applied
If `deposit_captured` exists and no `deposit_applied_to_check` arrives by the time the final check is nearing closure, raise:
- `deposit_captured_not_applied`
- severity: `action_required`

### Rule 2: Booking cancelled while deposit is still active
If `booking_cancelled` exists and deposit state is `hold_active` or `captured` without refund/release path, raise:
- `booking_cancelled_with_active_deposit`
- severity: `urgent`

### Rule 3: Hosted amount exceeds check total
If hosted committed or applied amount exceeds final check total, raise:
- `hosted_amount_exceeds_check`
- severity: `action_required`

### Rule 4: Remaining balance inconsistent with funding composition
If final check total minus applied deposit minus hosted amount does not equal expected remaining due, raise:
- `remaining_balance_incorrect`
- severity: `action_required`

### Rule 5: Organizer-payer relationship unresolved
If booking exists, organizer and payer differ, and there is no operator confirmation or adequate confidence, raise:
- `organizer_payer_mismatch`
- severity: `warning` or `action_required`

### Rule 6: Guest sees hold plus final charge
If deposit hold remains visible while final direct payment is captured and no explanatory release/application event exists, raise:
- `guest_visible_hold_plus_final_charge`
- severity: `warning`

### Rule 7: Hosted benefit linked to wrong guest
If hosted credit or VIP benefit was applied to the wrong linked identity, raise:
- `hosted_benefit_linked_to_wrong_guest`
- severity: `action_required`

### Rule 8: Deposit application missing from receipt path
If `deposit_applied_to_check` exists but receipt state or line-item reflection is absent after timeout, raise:
- `deposit_application_not_reflected_in_receipt`
- severity: `warning`

---

## Identity and Relationship Model

This phase expands the identity model from “who is this guest?” to “what role does this person play in the workflow?”

### Required explicit roles
- `reservation_guest_id`
- `organizer_guest_id`
- `payer_guest_id`
- `primary_guest_id`

### Optional role fragments
- attendee fragment(s)
- company / sponsor fragment
- benefit owner fragment

### Role resolution principles
1. Do not collapse distinct roles into one canonical owner silently.
2. Use identity matching only to suggest plausible role assignments.
3. Require operator confirmation for ambiguous high-value relationships.
4. Support cases should mention role uncertainty explicitly.

### Role relationship states
- `fully_resolved`
- `resolved_with_split`
- `ambiguous`
- `mismatch_flagged`

---

## Deposit Model

### Deposit concepts
A deposit may be:
- requested but not yet placed
- held / authorized but not yet captured
- captured but unapplied
- partially applied
- fully applied
- refunded
- stale / unclear

### Deposit source types
- event booking deposit
- reservation hold
- hosted minimum spend deposit
- VIP or member guarantee hold

### Required deposit fields
- deposit_ref
- booking_id
- amount_cents
- capture_state
- applied_amount_cents
- refundable_amount_cents
- funding_owner_guest_id if relevant

### Deposit UX requirement
The UI must show clearly:
- deposit total
- deposit currently active or captured
- amount already applied to final check
- amount still unapplied or refundable

---

## Hosted Check Allocation Model

### Allocation principles
- deposit and hosted value should be represented explicitly
- final check total should not be mutated silently
- the system should compute who still owes what
- every application of hosted or deposit value should be an event

### Funding composition formula
For a hosted check:

`remaining_balance = check_total - deposit_applied - hosted_credit_applied - other_applied_credits`

### Supported funding states
- fully direct paid
- deposit covers part, remainder direct paid
- hosted credit covers part, remainder direct paid
- deposit and hosted credit both cover portions
- fully hosted

### Allocation visibility
The Check Detail page should make this breakdown visible at a glance.

---

## Functional Requirements

### FR1. Booking Context on Check Detail
The system shall show booking context where present:
- booking type
- booking name
- booking status
- organizer
- reservation holder
- payer
- event date or service window

### FR2. Deposit State Card
The system shall display:
- deposit amount
- deposit state
- deposit applied amount
- refundable / unapplied amount
- last deposit event

### FR3. Funding Composition Card
The system shall display:
- total check amount
- hosted amount applied
- deposit amount applied
- direct payment remainder
- whether current settlement is complete or mismatched

### FR4. Role Summary Card
The system shall display:
- primary guest
- organizer
- reservation holder
- payer
- role resolution state
- confidence or operator-confirmed markers

### FR5. Hosted / Deposit Exception Queue Support
The Exception Queue shall support filtering by:
- booking type
- deposit exception type
- hosted settlement exception type
- role mismatch exception type

### FR6. Support Export Update
Support export shall include:
- booking summary
- deposit summary
- funding composition
- guest roles
- hosted or deposit-related active exceptions
- manual actions relevant to hosted settlement

### FR7. Operator Actions
At minimum, Phase 2 should support some subset of these write flows:
- confirm organizer-payer split
- attach reservation holder separately
- mark deposit as manually confirmed applied
- suppress hosted mismatch exception with reason

At least one of these must be live-verifiable.

### FR8. Overview Update
The Overview page shall include at least one or two hosted-workflow summary cards, such as:
- active hosted checks
- open deposit exceptions
- unresolved role assignments

### FR9. Auditability
Every manual hosted/deposit intervention must emit:
- an event
- an audit log row

### FR10. Scenario Support
At least 4 hosted/deposit-specific seeded scenarios shall exist beyond the original set, or the existing hosted scenario set shall be significantly upgraded with explicit expected outcomes.

---

## UX and Interface Requirements

### Design goals
- keep the ops-tool feel
- avoid overwhelming operators with finance jargon
- make funding composition intuitive
- keep hosted workflow visible but subordinate to the check resolution core

### Check Detail additions
Add the following cards or panels:

#### Booking Context Card
- booking name
- booking type
- booking status
- event date
- organizer
- reservation holder
- payer

#### Funding Composition Card
- total check amount
- deposit applied
- hosted amount applied
- remaining due

#### Deposit State Card
- deposit total
- deposit state
- last deposit event time
- refund / unapplied note if relevant

#### Guest Roles Card
- primary guest
- organizer
- payer
- reservation holder
- role mismatch badge if needed

### Timeline additions
Timeline should visually distinguish:
- booking events
- deposit events
- hosted allocation events

### Diner clarity / support-safe copy
Where appropriate, surface plain-language explanation such as:
- “A prior deposit is still reflected as an active hold.”
- “Part of this check was covered by hosted credit.”
- “The final remaining balance was paid directly at table.”

---

## Data Model

### Existing tables remain
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

### New tables or expanded tables

#### `event_bookings` (expanded)
Add or confirm fields:
- booking_name
- booking_type
- booking_status
- organizer_guest_id
- payer_guest_id
- reservation_guest_id optional
- service_tier optional
- deposit_amount_cents
- hosted_amount_cents optional
- expected_party_size
- event_date

#### `booking_deposits` (recommended new table)
- id
- event_booking_id
- deposit_ref
- deposit_type
- amount_cents
- state
- applied_amount_cents
- refundable_amount_cents
- funding_owner_guest_id optional
- created_at
- updated_at

#### `check_allocations` (recommended new table)
Tracks how non-direct value is applied to a check.
- id
- check_id
- allocation_type (`deposit`, `hosted_credit`, `other_credit`)
- source_ref
- amount_cents
- applied_by_event_id
- created_at

#### `derived_check_state` additions
- booking_state
- deposit_state
- hosted_settlement_state
- organizer_guest_id nullable
- reservation_guest_id nullable
- payer_guest_id nullable
- deposit_amount_cents
- deposit_applied_amount_cents
- hosted_amount_cents
- hosted_applied_amount_cents
- remaining_balance_cents
- direct_payment_due_cents
- role_resolution_state

Clarification:
`hosted_settlement_state` should stay narrowly scoped to funding reconciliation. A check can have `hosted_settlement_state = settled` while `payment_state` is still `authorized` and `direct_payment_due_cents` remains greater than zero.

### Important note
If implementation speed matters, `booking_deposits` and `check_allocations` can be modeled partly from events first, but explicit tables are recommended for UI clarity and read performance.

---

## API and Server Actions

### Existing APIs remain
- check detail
- exception queue
- support export
- override actions

### New or updated APIs / actions

#### `GET /api/checks/:id`
Should now include:
- booking context
- deposit summary
- funding composition
- guest roles

#### `POST /api/bookings/:id/attach-to-check`
Attaches booking context to a check.

#### `POST /api/checks/:id/confirm-organizer-payer-split`
Emits role-confirmation event and audit log.

#### `POST /api/checks/:id/mark-deposit-applied`
Emits deposit allocation event and recomputes state.

#### `POST /api/checks/:id/suppress-hosted-exception`
Suppresses hosted mismatch exception with reason.

#### `GET /api/checks/:id/support-export`
Must include hosted/deposit sections when applicable.

### Handler requirements
- keep handlers thin
- use the same recompute orchestration pattern
- every write must re-run reducer and exception detection

---

## Business Rules

1. Deposit capture does not automatically mean deposit applied to final check.
2. Hosted amount cannot exceed the eligible final balance.
3. Organizer, payer, reservation-holder, and primary guest should remain distinct unless explicitly confirmed identical.
4. Role-confirmation actions must be auditable.
5. A booking cancellation with active deposit must raise an exception until release/refund path exists.
6. Remaining balance must never go below zero.
7. If hosted credit fully covers the check, service may be completed without direct payer settlement, but payment truth must still reflect actual event history.
8. Rewards / benefits should not silently attach to the wrong role.
9. Synthetic scenarios must clearly encode expected funding composition.
10. Support export must explain deposit, hosted value, and direct balance in a human-readable way.

---

## Seed Scenarios

Phase 2 should add or upgrade hosted/deposit scenarios.

### Scenario H1: Deposit Captured, Not Applied
- booking exists
- deposit captured before service
- final check opened
- no deposit allocation event yet
- final balance still shows full check amount
- exception: `deposit_captured_not_applied`

### Scenario H2: Organizer != Payer != Reservation Holder
- corporate dinner
- reservation booked by assistant or organizer
- final payment method belongs to another person
- operator must confirm role split
- exceptions: `organizer_payer_mismatch`, maybe `unresolved_role_assignment`

### Scenario H3: Hosted Amount Covers Part of Final Check
- hosted amount committed in booking
- part of final bill covered
- remaining guest balance still due
- funding composition displayed clearly
- no exception if modeled correctly

### Scenario H4: Booking Cancelled With Active Deposit
- deposit hold or capture exists
- booking cancelled
- no release/refund event yet
- urgent exception raised

### Scenario H5: Deposit Applied But Receipt Not Reflecting It
- deposit applied to check
- receipt/itemization missing or delayed
- support must explain discrepancy
- exception: `deposit_application_not_reflected_in_receipt`

### Scenario H6: Hosted Benefit Linked To Wrong Guest
- hosted/VIP benefit associated to organizer but primary guest at table differs
- operator must resolve or confirm relationship

### Scenario strategy
At least one scenario should be fully happy-path hosted settlement, and at least two should be messy and support-worthy.

---

## Permissions and Roles

### Existing roles remain
- server
- manager
- support
- admin

### Phase 2 write permissions
- manager: confirm role split, mark deposit applied, suppress hosted mismatch exception
- support: export hosted support summary, create support case, add support note
- admin: replay or seed verification if enabled

### Prototype constraint
Keep the same lightweight role enforcement approach from Phase 1. Do not build enterprise auth.

---

## Technical Architecture

### The other two docs
The existing **Codex Build Guide** and **Pre-Build Decisions** remain mostly valid.

### What must be updated conceptually
- schema and seeds become Phase-2 aware
- build guide should be interpreted with new hosted/deposit modules added into the same build order
- pre-build decisions remain valid, especially explicit guest roles and separation of payment truth vs operational closure

### Recommended new domain modules
- `lib/domain/deposits/*`
- `lib/domain/bookings/*`
- `lib/domain/allocations/*`
- new hosted/deposit rule files under `lib/domain/exceptions/*`

### Core architectural rule
Do not fork the product into a separate “hosted subsystem.” Reuse the current recompute engine and extend the existing state and exception model.

---

## Implementation Plan

### Phase 2A: Schema Extension
- expand `event_bookings`
- add `booking_deposits`
- add `check_allocations`
- extend `derived_check_state`
- add new enums

### Phase 2B: Domain Extension
- add deposit reducer logic
- add booking-state derivation
- add hosted funding composition derivation
- add new exception rules
- extend support summary generator

### Phase 2C: Seed and Scenario Upgrade
- implement hosted/deposit scenarios
- add expected funding composition and hosted state to scenario assertions

### Phase 2D: UI Extension
- add Booking Context card
- add Funding Composition card
- add Deposit State card
- add Guest Roles card
- update Exception Queue filters and labels

### Phase 2E: Write Flow
Implement one or two live-verifiable write flows, ideally:
- confirm organizer-payer split
- mark deposit applied

### Phase 2F: Demo Hardening
- verify support export on hosted scenario
- ensure one strong end-to-end walkthrough is clean

---

## Testing Strategy

### Unit tests
- deposit state derivation
- funding composition logic
- hosted settlement mismatch rules
- role resolution rules

### Integration tests
- hosted scenario check detail load
- deposit application write flow
- support export includes hosted sections
- role-confirmation write flow updates state and clears exceptions where appropriate

### Scenario expectation tests
Each hosted/deposit scenario should assert:
- payment_state
- deposit_state
- hosted_settlement_state
- role_resolution_state
- active exception set
- remaining balance values

### Runtime verification target
At least one hosted flow should be runtime-verified with:
- real seed
- real DB rows
- real POST
- before/after DB proof
- real support export output

---

## Demo Narrative

### Recommended hosted demo flow
1. Start with a hosted dinner check that has booking context.
2. Show organizer, payer, reservation-holder, and primary guest separately.
3. Show captured deposit that has not yet been applied.
4. Show the resulting exception and incorrect remaining balance.
5. Apply a hosted or deposit resolution action.
6. Show updated funding composition and cleared exception.
7. Open support export and show the plain-language summary.

### Core message
This is not just a payment debugger. It is an event-driven settlement and service-recovery system for higher-value hospitality workflows.

---

## Success Criteria

A strong Phase 2 extension should make a reviewer think:
- the current architecture really does scale to higher-value workflows
- guest identity is being used where it matters operationally
- deposit and hosted settlement logic is clear, not hand-wavy
- the product is still focused and not drifting into CRM territory
- support and operator workflows remain first-class

### Concrete success criteria
- hosted/deposit fields exist in state and UI
- at least 4 hosted/deposit scenarios are seeded
- at least 1 hosted/deposit write flow is runtime-verified
- support export clearly explains deposit and funding composition
- new exception classes are specific and believable

---

## README Requirements

README additions for Phase 2 should include:
- why hosted/dining workflows are a natural extension of the original architecture
- how guest roles differ from canonical identity
- how deposit/application/hosted funding composition is modeled
- which new write flows are supported
- one demo walkthrough for hosted settlement resolution

---

## Known Limitations

- still no real processor integrations
- still no real reservation integration
- still no true corporate billing system
- still synthetic hosted workflow data
- hosted terms and business policies are simplified for prototype purposes
- not a full event-sales or private-dining management system

These are acceptable because the value of this phase is the state and recovery model, not exhaustive hospitality back-office coverage.

---

## Future Extensions

After this phase, possible next steps include:
- real-time source divergence overlays for hosted settlement sources
- guest-facing hosted payment explanation UI
- benefit / pass entitlement allocation
- multi-check event settlement
- deeper VIP access logic
- partial refund automation
- event-level analytics and resolution times

---

## Appendix A: Sample Support Summary

```md
# Support Summary

Check ID: CHK-ORE-20260330-011
Restaurant: Olive Room Events
Booking: BrightTable Client Dinner
Booking Type: hosted_event
Booking Status: confirmed

## Guest Roles
- Organizer: Rachel Morgan
- Reservation Holder: Rachel Morgan
- Payer: Jonathan Reed
- Primary Guest: Jonathan Reed
- Role Resolution State: resolved_with_split

## Deposit Summary
- Deposit Amount: $500.00
- Deposit State: captured
- Applied To Final Check: $0.00
- Remaining Unapplied Deposit: $500.00

## Final Check Summary
- Check Total: $1,633.60
- Hosted Amount Applied: $0.00
- Direct Guest Balance: $1,633.60
- Service State: awaiting_staff_action

## Active Exceptions
- deposit_captured_not_applied (action_required)
- organizer_payer_mismatch (warning)

## Recommended Next Action
- Confirm organizer/payer split and apply deposit to final check before communicating the remaining balance.

## Manual Actions
- None
```

---

## Appendix B: Sample Operator Walkthrough

1. Manager opens a hosted-event check.
2. The header shows that payment is authorized/captured as usual, but Booking Context shows a separate organizer and payer.
3. Deposit State shows a captured deposit with zero applied amount.
4. Funding Composition shows the full guest balance still due.
5. Exception Queue flags `deposit_captured_not_applied`.
6. Manager confirms organizer-payer split or marks deposit applied.
7. Reducer recomputes:
   - deposit_state becomes `fully_applied` or `partially_applied`
   - remaining balance drops
   - exception clears if resolved
8. Support export now tells a clean story.

---

## Glossary

### Booking context
The higher-value reservation or event wrapper around a check.

### Deposit
Advance money movement associated with a reservation or event.

### Hosted amount
Portion of final check covered by sponsor, organizer, or hosted program.

### Funding composition
Breakdown of how the check is being funded.

### Role resolution
The process of confirming who is organizer, payer, reservation holder, and primary guest.

### Allocation
Application of deposit or hosted value to the final check.

---

## Final Build Guidance

Treat this document as a **phase-extension PRD**, not a replacement for the original core.

Build this phase by preserving the original thesis:
- keep the check timeline central
- keep the reducer deterministic
- keep exceptions concrete
- keep identity explainable
- use hosted logic to deepen the current product, not to reset it

The strongest version of this phase is one where a reviewer can see that the current Checkgraph core naturally extends into reservation-linked, deposit-backed, higher-value hospitality workflows without losing focus.
