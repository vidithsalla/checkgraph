# Phase 2 Build Delta: Hosted Check / Deposit Resolution

**Project:** Checkgraph  
**Phase:** 2  
**Purpose:** Define exactly what changes in the next build phase now that the core event-driven payment-state / exception-resolution slice is already working.

---

## 1. How to use this document

This is a **delta doc**, not a replacement for the full product spec.

Use it like this:

1. `HOSTED_CHECK_DEPOSIT_RESOLUTION_PRD.md` = canonical top-level product spec for the current build branch
2. `HOSTED_CHECK_DEPOSIT_SCHEMA_AND_SEEDS.md` = canonical schema + seed reference for the current build branch
3. `CODEX_BUILD_GUIDE.md` = execution guide
4. `PRE_BUILD_DECISIONS.md` = locked architectural decisions
5. **This file** = what to add, change, and avoid in Phase 2

This file should keep the agent from doing one of two bad things:
- rebuilding the product from scratch as if Phase 1 did not happen
- adding hosted/deposit features in an ad hoc way that breaks the existing state model

---

## 2. Phase 2 thesis

Phase 1 proved that Checkgraph can:
- model check lifecycle through append-only events
- compute derived state deterministically
- detect and resolve exceptions
- support audited manual overrides
- export support summaries
- run a real DB-backed vertical slice

Phase 2 should prove something stronger:

> The same event-driven exception-resolution infrastructure can support **higher-value restaurant workflows** where reservation identity, organizer identity, payer identity, deposit money, and final settlement can drift out of sync.

This phase is **not** a pivot away from Checkgraph.
It is the strongest extension of the system you already built.

---

## 3. What stays the same

These parts of the system remain foundational and should not be redesigned:

### Core architecture
- append-only `check_events` as the source of truth
- reducer-driven `derived_check_state`
- explicit persisted `exceptions`
- audit logs for every manual action
- support export pipeline
- DB-backed loaders and write path architecture

### Core product framing
- this is still an **operator-facing source-of-truth and recovery tool**
- this is still **not** a CRM
- this is still **not** a private-dining sales pipeline
- this is still **not** a fake processor integration

### Locked design decisions
Keep the current decisions from `PRE_BUILD_DECISIONS.md`, especially:
- canonical event ordering
- synchronous recompute model
- payment truth separated from operational closure
- explicit guest roles instead of one overloaded guest field
- minimal server-side prototype role enforcement on current write actions

---

## 4. What changes in Phase 2

Phase 2 adds a new operational layer:

# Hosted Check / Deposit Resolution

The system must now support restaurant workflows where:
- a reservation exists before the check
- a deposit or prepayment may exist before the check
- the organizer is not the same person as the payer
- the reservation holder is not the same person as the diner or final payer
- a hosted amount, credit, or deposit may need to be applied against the final check
- support needs to explain both payment state and funding composition

This means the product must now answer:

- What money has already been collected before service?
- Who provided that money?
- Is the deposit still just a hold, actually captured, released, applied, or refunded?
- How much of the final check is covered by deposit or hosted funds?
- Which identity owns the reservation versus the payment versus the hosted relationship?
- If something is wrong, who should fix it and what exactly is wrong?

---

## 5. Product boundary for Phase 2

### In scope
- reservation-linked hosted check support
- deposit lifecycle modeling
- deposit application to final check
- organizer / payer / reservation-holder / primary guest role clarity
- hosted/deposit exceptions
- hosted/deposit-aware support export
- at least one real write flow for hosted/deposit state
- at least one live-verified hosted/deposit scenario

### Out of scope
- full private-dining CRM
- proposal / contracting workflow
- quoting and menu selection
- guest messaging
- real payments processor integration
- full benefits engine / membership engine
- broad analytics expansion
- replay overhaul
- auth expansion

The build should stay focused on **settlement, identity, and operator recovery**.

---

## 6. New domain concepts to add

Add these concepts on top of the existing model.

### Reservation-linked context
A check can now be explicitly linked to a reservation or event context.

### Deposit lifecycle
Model deposit or prepayment as its own operational object and/or event sequence.

Minimum lifecycle states:
- requested
- hold_placed
- authorized
- captured
- partially_applied
- fully_applied
- released
- refunded
- voided
- unknown

### Funding composition
The check detail view should be able to explain:
- deposit amount collected
- hosted amount or credit applied
- remaining guest-paid amount
- total funded vs total outstanding

### Guest role clarity
A check or booking may involve:
- `primary_guest_id`
- `payer_guest_id`
- `reservation_guest_id`
- `organizer_guest_id`

### Hosted settlement context
The final payment state should now coexist with a funding breakdown:
- guest-funded portion
- deposit-funded portion
- hosted-funded portion

Clarification:
`hosted_settlement_state` is only the stored funding reconciliation status for the hosted/deposit layer. It must not be treated as a synonym for full payment completion or full operational completion. `payment_state` and `service_state` still own those meanings.

---

## 7. New event groups and event types

Phase 2 should reuse the event model rather than creating parallel mutable tables with hidden logic.

### Recommended new event group
- `deposit`
- optionally `booking` if you want cleaner grouping for reservation/event actions

### New event types
Minimum set:
- `booking_linked`
- `deposit_requested`
- `deposit_hold_placed`
- `deposit_authorized`
- `deposit_captured`
- `deposit_release_requested`
- `deposit_released`
- `deposit_refunded`
- `deposit_applied_to_check`
- `deposit_application_reversed`
- `hosted_amount_applied`
- `hosted_amount_removed`
- `organizer_linked`
- `payer_link_confirmed`
- `reservation_holder_link_confirmed`

Optional but useful:
- `deposit_capture_failed`
- `deposit_refund_failed`
- `booking_cancelled`
- `booking_reinstated`

Important rule:
Do not hide hosted/deposit behavior in one giant JSON blob or derived-state hack. The important transitions should be visible as explicit events.

---

## 8. Derived state extensions

Extend `derived_check_state` or assembled check detail payloads to include hosted/deposit outputs.

### New state fields to compute
- `deposit_state`
- `funding_state`
- `deposit_amount_cents`
- `deposit_applied_amount_cents`
- `hosted_amount_cents`
- `remaining_guest_amount_cents`
- `funding_summary_text`

### Recommended enums
#### `deposit_state`
- `none`
- `requested`
- `held`
- `authorized`
- `captured`
- `partially_applied`
- `fully_applied`
- `released`
- `refunded`
- `voided`
- `unknown`

#### `funding_state`
- `guest_only`
- `deposit_only`
- `deposit_plus_guest`
- `hosted_plus_guest`
- `deposit_plus_hosted_plus_guest`
- `fully_hosted`
- `unknown`

### Important product rule
Do not let deposit state overwrite payment truth.
A check can have:
- `payment_state = authorized`
- `service_state = awaiting_staff_action`
- `deposit_state = captured`
- `funding_state = deposit_plus_guest`

Those are different layers of truth.

---

## 9. New exception families

Add hosted/deposit-specific exceptions.

### Deposit exceptions
- `deposit_captured_without_booking_link`
- `deposit_captured_but_not_applied`
- `deposit_applied_exceeds_check_total`
- `deposit_applied_without_capture`
- `deposit_released_after_application_conflict`
- `deposit_refund_pending_after_cancellation`
- `stale_deposit_hold_visibility`

### Identity / hosted exceptions
- `organizer_payer_mismatch_unresolved`
- `reservation_guest_missing_for_hosted_check`
- `hosted_benefit_applied_to_ambiguous_guest`
- `deposit_owner_identity_ambiguous`

### Booking / settlement exceptions
- `booking_cancelled_with_active_deposit`
- `final_check_missing_booking_context`
- `hosted_amount_removed_after_receipt`
- `reservation_link_missing_for_deposit_workflow`

### Severity guidance
- mismatches that affect recognition only = usually `warning`
- money-state conflicts = usually `action_required`
- over-application / contradictory funding = `urgent`

---

## 10. Support export changes

Support export must now explain not only payment state but also funding composition.

### Add these sections
- Booking Summary
- Deposit Summary
- Funding Summary
- Guest Role Summary

### Example questions it should answer
- Was a deposit collected before the meal?
- Was it only a hold or actually captured?
- Was it applied to the final bill?
- How much did the diner still pay?
- Who was the organizer, payer, and reservation holder?
- Is there any remaining ambiguity that support should know about?

This is one of the highest-leverage demo improvements because it makes the prototype feel much closer to higher-value hospitality operations.

---

## 11. UI changes for Phase 2

Do not add many new pages.
Extend the existing surfaces.

### Check Detail changes
Add these cards/panels:
- **Booking Context Card**
  - event/booking name
  - booking type
  - organizer
  - reservation holder
  - payer
  - event date/status
- **Deposit State Card**
  - deposit state
  - deposit total
  - applied amount
  - remaining unapplied amount
- **Funding Composition Card**
  - guest-paid portion
  - hosted portion
  - deposit-covered portion
  - outstanding or unresolved portion

### Exception Queue changes
Add columns or filters for:
- booking-linked checks only
- deposit-state exceptions
- hosted/service-tier checks

### Guest Detail changes
Deferred in the current packaged prototype.

If revived later, add a minimal section showing:
- guest’s role in hosted workflows
- linked bookings or hosted checks
- whether they are organizer, payer, reservation holder, or attendee

### Overview changes
Add summary metrics like:
- checks with active deposit exceptions
- hosted checks in exception state
- booking-linked checks awaiting settlement resolution

No extra dashboard fluff beyond that.

---

## 12. Live-verified scope for Phase 2

At least one new **end-to-end live-verified scenario** should be built and proven.

### Required live-verified scenario
A hosted or reservation-linked check where:
- booking exists
- deposit exists and is captured
- final check exists
- deposit is not yet applied or is applied incorrectly
- operator takes one action
- event is written
- derived state changes
- exceptions update
- audit row is written
- support export reflects the new funding truth

### Suggested write flow
Choose one:
- `Apply Deposit To Check`
- `Confirm Payer Link`
- `Mark Deposit Resolved`

Best choice:
**Apply Deposit To Check**

Why:
- most clearly demonstrates money flow + booking context + auditability
- best proof that the new layer is operational, not decorative

---

## 13. Recommended new seed scenarios

Add at least 4 new canonical scenarios.

### 1. Hosted check with unapplied captured deposit
**Goal:** show that a deposit exists but has not been applied to final settlement.

Expected exception(s):
- `deposit_captured_but_not_applied`
- possibly `final_check_missing_booking_context`

### 2. Organizer vs payer vs reservation holder split
**Goal:** show that roles differ but can still be modeled cleanly.

Expected exception(s):
- `organizer_payer_mismatch_unresolved` or warning only

### 3. Booking cancelled with active deposit
**Goal:** show support / finance-style recovery path.

Expected exception(s):
- `booking_cancelled_with_active_deposit`
- `deposit_refund_pending_after_cancellation`

### 4. Deposit applied incorrectly
**Goal:** show contradictory funding math.

Expected exception(s):
- `deposit_applied_exceeds_check_total`
- `deposit_owner_identity_ambiguous` if desired

These should be added in addition to the current canonical scenarios, not replace them.

---

## 14. Schema delta guidance

Use the hosted/deposit schema doc as the new schema reference, but the implementation should only change what is necessary.

### Likely changes
- extend `event_bookings`
- add `check_funding_allocations` or equivalent helper table if needed
- add deposit/funding fields to `derived_check_state` or a dedicated `derived_check_funding_state`
- extend event enums
- extend exception enums
- extend support summary assembly

### Avoid
- giant denormalized booking table trying to model every sales workflow
- replacing events with mutable deposit columns as the hidden source of truth

---

## 15. Acceptance criteria for Phase 2

Phase 2 is successful when all of these are true:

### Architecture
- hosted/deposit behavior is still event-driven
- reducer remains modular
- exception logic remains modular
- write handlers stay thin

### Product behavior
- at least 4 hosted/deposit scenarios exist
- at least 1 hosted/deposit write flow is live-verified
- check detail clearly explains deposit + funding composition
- support export clearly explains booking/deposit/funding context
- organizer/payer/reservation-holder roles are visible and not collapsed

### Demo quality
- one hosted/deposit scenario is easy to walk through in under 90 seconds
- before/after state change is obvious
- the new layer strengthens the story instead of making the app feel like a CRM

---

## 16. Recommended build order for Phase 2

1. update canonical PRD + schema references
2. extend enums and schema
3. extend seed builders with hosted/deposit scenarios
4. extend domain reducer for deposit/funding state
5. extend exception engine with hosted/deposit rules
6. extend support summary/export
7. extend Check Detail and Overview surfaces
8. implement one hosted/deposit write action
9. live-verify that action against local Postgres
10. capture proof artifacts and update demo story

Do not start with UI.
Do not build multiple write flows before one is proven.

---

## 17. Prompt to start Phase 2

Use this with the agent when you are ready:

```text
Read these files first:
- HOSTED_CHECK_DEPOSIT_RESOLUTION_PRD.md
- HOSTED_CHECK_DEPOSIT_SCHEMA_AND_SEEDS.md
- CODEX_BUILD_GUIDE.md
- PRE_BUILD_DECISIONS.md
- PHASE2_BUILD_DELTA.md

We are now building Phase 2: Hosted Check / Deposit Resolution.

Important:
This is an extension of the existing Checkgraph architecture, not a rewrite.
Keep the current event-driven check-state / exception-resolution console as the core.
Do not pivot into a CRM or full private-dining platform.

Your job:
1. update the schema and seeds to support reservation-linked hosted checks and deposit lifecycle events
2. extend derived state and exceptions for deposit/funding context
3. extend check detail, overview, and support export to show booking/deposit/funding truth
4. implement one end-to-end write flow, preferably Apply Deposit To Check
5. live-verify that flow against the local Postgres-backed environment

Output after each phase:
- files changed
- what behavior is now proven
- what is still only implemented in code
- what remains out of scope

Do not broaden scope beyond hosted/deposit resolution.
```

---

## 18. Final guidance

The test for this phase is simple:

If someone sees the product after Phase 2, they should think:

> “This is not just a payment debugger. It is infrastructure for resolving the messy money-and-identity edge cases that show up in higher-value restaurant workflows.”

That is the bar.
