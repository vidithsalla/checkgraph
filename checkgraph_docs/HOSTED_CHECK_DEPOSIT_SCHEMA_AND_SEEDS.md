# Checkgraph Phase 2 Schema and Seeds: Hosted Check / Deposit Resolution

**Version:** 2.0  
**Companion to:** `HOSTED_CHECK_DEPOSIT_RESOLUTION_PRD.md`, existing `CODEX_BUILD_GUIDE.md`, existing `PRE_BUILD_DECISIONS.md`  
**Purpose:** Concrete schema, enums, relationships, seed strategy, and scenario definitions for the Hosted Check / Deposit Resolution phase.  
**Status:** Build-ready phase extension

---

## Table of Contents

1. [How to Use This File](#how-to-use-this-file)
2. [Phase 2 Schema Design Principles](#phase-2-schema-design-principles)
3. [What Changes From Phase 1](#what-changes-from-phase-1)
4. [Recommended Drizzle Layout Updates](#recommended-drizzle-layout-updates)
5. [Core New Enums](#core-new-enums)
6. [Updated Existing Tables](#updated-existing-tables)
7. [New Tables](#new-tables)
8. [Indexes and Constraints](#indexes-and-constraints)
9. [Recommended Drizzle Schema Skeleton](#recommended-drizzle-schema-skeleton)
10. [Derived State Computation Strategy](#derived-state-computation-strategy)
11. [Seed Data Goals](#seed-data-goals)
12. [Reference Data and Role Targets](#reference-data-and-role-targets)
13. [Booking / Hosted Seed Set](#booking--hosted-seed-set)
14. [Hosted Check Scenario Specifications](#hosted-check-scenario-specifications)
15. [Canonical Event Payload Shapes](#canonical-event-payload-shapes)
16. [Seed Script Plan](#seed-script-plan)
17. [Validation and Assertions](#validation-and-assertions)
18. [Recommended Scenario IDs](#recommended-scenario-ids)
19. [Implementation Notes for Codex](#implementation-notes-for-codex)
20. [Known Simplifications](#known-simplifications)
21. [Appendix A: Example Phase 2 Seed Object](#appendix-a-example-phase-2-seed-object)
22. [Appendix B: Scenario-to-Exception Matrix](#appendix-b-scenario-to-exception-matrix)
23. [Appendix C: Suggested Sample Names and Values](#appendix-c-suggested-sample-names-and-values)

---

## How to Use This File

This is the phase-extension companion to the original schema and seeds spec.

Use it this way:
- The original Phase 1 schema/seeds file remains the base.
- This file describes **what must be added or changed** for Hosted Check / Deposit Resolution.
- If implementation speed matters, this file should be treated as the authoritative Phase 2 delta spec.

Priority order when there is tension:
1. Phase 2 PRD intent wins
2. Existing pre-build decisions still win on foundational architecture
3. This file defines concrete data-layer and seed changes
4. The existing build guide remains valid unless Phase 2 explicitly overrides sequencing

---

## Phase 2 Schema Design Principles

### 1. Extend, do not fork
Hosted and deposit data should extend the existing check/event/derived-state architecture, not create a parallel product model.

### 2. Keep money movement explicit
Deposits, hosted credits, and allocations should be represented in a way that supports support summaries and before/after DB verification.

### 3. Model guest roles explicitly
Do not overload one guest field when the workflow contains organizer, payer, reservation-holder, and primary guest.

### 4. Preserve check centrality
Bookings matter only because they affect check resolution, funding composition, and support recovery.

### 5. Prefer explicit allocation rows where helpful
Events remain source of truth, but explicit read-side tables for deposits and allocations improve UI clarity and debugging.

---

## What Changes From Phase 1

### Existing tables extended
- `checks`
- `derived_check_state`
- `event_bookings`
- maybe `exceptions` with new exception types only

### New tables recommended
- `booking_deposits`
- `check_allocations`

### New enums required
- booking state / status extensions
- deposit state
- hosted settlement state
- allocation type
- deposit type
- new exception types
- role resolution state

### New scenario classes
- deposit captured not applied
- hosted amount partial settlement
- booking cancelled with active deposit
- hosted role split resolution
- deposit applied but receipt not reflecting it

---

## Recommended Drizzle Layout Updates

Existing layout remains, but add:

```text
lib/db/schema/
  bookings.ts
  deposits.ts
  allocations.ts
```

Recommended domain additions:

```text
lib/domain/
  bookings/
    derive-booking-state.ts
    summarize-booking-context.ts
  deposits/
    derive-deposit-state.ts
    compute-deposit-application.ts
  allocations/
    derive-funding-composition.ts
    validate-allocation-balance.ts
```

Recommended seed additions:

```text
lib/db/seed/scenarios/
  hosted-deposit-unapplied.ts
  hosted-partial-coverage.ts
  booking-cancelled-active-deposit.ts
  deposit-applied-receipt-mismatch.ts
  organizer-payer-split.ts
```

---

## Core New Enums

Define centrally in `lib/db/schema/enums.ts`.

### Booking state / status

#### `bookingStatus`
- `lead`
- `deposit_pending`
- `deposit_held`
- `deposit_captured`
- `confirmed`
- `modified`
- `cancelled`
- `completed`

#### `bookingState`
Derived-state enum:
- `none`
- `attached`
- `modified`
- `cancelled`
- `settled`

### Deposit enums

#### `depositType`
- `reservation_hold`
- `event_deposit`
- `minimum_spend_deposit`
- `vip_guarantee_hold`

#### `depositState`
- `none`
- `requested`
- `hold_active`
- `captured`
- `partially_applied`
- `fully_applied`
- `refund_pending`
- `refunded`
- `unknown`

### Hosted settlement enums

#### `hostedSettlementState`
- `none`
- `hosted_pending`
- `partially_reconciled`
- `fully_hosted`
- `settlement_mismatch`
- `settled`

Definition:
`hostedSettlementState` is an internal stored field for hosted/deposit funding reconciliation status on the check. It is not a synonym for full check settlement or full payment completion. `payment_state` remains the source of truth for payment completion, and `service_state` remains the source of truth for operational completion.

#### `allocationType`
- `deposit`
- `hosted_credit`
- `manual_credit`

#### `fundingSourceType`
- `guest_direct_payment`
- `captured_deposit`
- `hosted_credit`
- `house_account`
- `manual_adjustment`

### Role-resolution enums

#### `roleResolutionState`
- `fully_resolved`
- `resolved_with_split`
- `ambiguous`
- `mismatch_flagged`

### New exception types
- `deposit_captured_not_applied`
- `deposit_hold_stale`
- `deposit_refund_missing`
- `deposit_refunded_after_application`
- `deposit_state_unknown`
- `hosted_amount_missing_for_booking`
- `hosted_amount_exceeds_check`
- `hosted_settlement_mismatch`
- `remaining_balance_incorrect`
- `booking_cancelled_with_active_deposit`
- `organizer_payer_mismatch`
- `reservation_organizer_mismatch`
- `hosted_benefit_linked_to_wrong_guest`
- `unresolved_role_assignment`
- `guest_visible_hold_plus_final_charge`
- `deposit_application_not_reflected_in_receipt`

---

## Updated Existing Tables

## 1. `checks`
Add or confirm:
- `booking_id` UUID nullable FK -> `event_bookings.id`
- `hosted_context_label` text nullable
- `is_hosted` boolean not null default false

### Notes
If you already have `event_booking_id`, keep that and do not rename unless needed.

---

## 2. `derived_check_state`
Extend with:
- `booking_state` enum nullable or not null default `none`
- `deposit_state` enum nullable or not null default `none`
- `hosted_settlement_state` enum nullable or not null default `none`
- `role_resolution_state` enum nullable
- `organizer_guest_id` UUID nullable
- `reservation_guest_id` UUID nullable
- `payer_guest_id` UUID nullable
- `primary_guest_id` UUID nullable (if not already present)
- `deposit_amount_cents` integer not null default 0
- `deposit_applied_amount_cents` integer not null default 0
- `hosted_amount_cents` integer not null default 0
- `hosted_applied_amount_cents` integer not null default 0
- `remaining_balance_cents` integer not null default 0
- `direct_payment_due_cents` integer not null default 0
- `funding_summary_json` jsonb optional for UI convenience

### Notes
These fields should be recomputed from events + booking/deposit/allocation context.
`hosted_settlement_state` should be interpreted narrowly as funding reconciliation status only, not as end-to-end payment completion.

---

## 3. `event_bookings`
Expand minimally to support read-side clarity.

Recommended columns:
- `id` UUID PK
- `restaurant_id` UUID FK
- `booking_ref` text unique not null
- `booking_type` enum not null
- `status` enum not null
- `booking_name` text not null
- `organizer_guest_id` UUID nullable
- `payer_guest_id` UUID nullable
- `reservation_guest_id` UUID nullable
- `service_tier` text nullable
- `party_size` integer nullable
- `deposit_amount_cents` integer nullable
- `hosted_amount_cents` integer nullable
- `event_date` timestamptz nullable
- `notes` text nullable
- `created_at`
- `updated_at`

### Notes
This is still intentionally minimal. Do not turn it into a large booking CRM schema.

---

## New Tables

## 4. `booking_deposits`
Represents deposit/hold/payment value attached to a booking or reservation context.

### Columns
- `id` UUID PK
- `event_booking_id` UUID FK -> `event_bookings.id`
- `deposit_ref` text unique not null
- `deposit_type` enum not null
- `state` enum not null
- `amount_cents` integer not null
- `applied_amount_cents` integer not null default 0
- `refundable_amount_cents` integer not null default 0
- `funding_owner_guest_id` UUID nullable FK -> `guest_profiles.id`
- `capture_ref` text nullable
- `hold_ref` text nullable
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### Notes
This table is useful because support and UI often need the current deposit read model directly.

---

## 5. `check_allocations`
Represents applied non-direct funding on a check.

### Columns
- `id` UUID PK
- `check_id` UUID FK -> `checks.id`
- `event_booking_id` UUID nullable FK -> `event_bookings.id`
- `allocation_type` enum not null
- `funding_source_type` enum not null
- `source_ref` text not null
- `amount_cents` integer not null
- `applied_by_event_id` UUID nullable FK -> `check_events.id`
- `note` text nullable
- `created_at` timestamptz not null default now()

### Notes
This helps you prove and inspect how deposit or hosted value was applied.

---

## 6. Optional helper table: `booking_guest_roles`
Only if you want more explicit many-role history. Usually unnecessary for prototype.

Recommended to skip unless implementation needs it.

---

## Indexes and Constraints

### New / updated indexes

#### `event_bookings`
- unique index on `booking_ref`
- index on `(restaurant_id, status)`
- index on `event_date`
- index on `organizer_guest_id`
- index on `payer_guest_id`

#### `booking_deposits`
- unique index on `deposit_ref`
- index on `(event_booking_id, state)`
- index on `funding_owner_guest_id`

#### `check_allocations`
- index on `(check_id, allocation_type)`
- index on `event_booking_id`
- index on `source_ref`

#### `derived_check_state`
- index on `booking_state`
- index on `deposit_state`
- index on `hosted_settlement_state`
- index on `role_resolution_state`

### Constraints
- `booking_deposits.amount_cents >= 0`
- `booking_deposits.applied_amount_cents >= 0`
- `booking_deposits.refundable_amount_cents >= 0`
- `check_allocations.amount_cents > 0`
- `deposit_applied_amount_cents <= deposit_amount_cents`
- `hosted_applied_amount_cents <= hosted_amount_cents`
- `remaining_balance_cents >= 0`

---

## Recommended Drizzle Schema Skeleton

```ts
export const depositStateEnum = pgEnum('deposit_state', [
  'none',
  'requested',
  'hold_active',
  'captured',
  'partially_applied',
  'fully_applied',
  'refund_pending',
  'refunded',
  'unknown',
]);

export const hostedSettlementStateEnum = pgEnum('hosted_settlement_state', [
  'none',
  'hosted_pending',
  'partially_reconciled',
  'fully_hosted',
  'settlement_mismatch',
  'settled',
]);

export const allocationTypeEnum = pgEnum('allocation_type', [
  'deposit',
  'hosted_credit',
  'manual_credit',
]);
```

```ts
export const bookingDeposits = pgTable('booking_deposits', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventBookingId: uuid('event_booking_id').notNull().references(() => eventBookings.id),
  depositRef: text('deposit_ref').notNull().unique(),
  depositType: depositTypeEnum('deposit_type').notNull(),
  state: depositStateEnum('state').notNull(),
  amountCents: integer('amount_cents').notNull(),
  appliedAmountCents: integer('applied_amount_cents').notNull().default(0),
  refundableAmountCents: integer('refundable_amount_cents').notNull().default(0),
  fundingOwnerGuestId: uuid('funding_owner_guest_id').references(() => guestProfiles.id),
  captureRef: text('capture_ref'),
  holdRef: text('hold_ref'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

```ts
export const checkAllocations = pgTable('check_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  checkId: uuid('check_id').notNull().references(() => checks.id),
  eventBookingId: uuid('event_booking_id').references(() => eventBookings.id),
  allocationType: allocationTypeEnum('allocation_type').notNull(),
  fundingSourceType: fundingSourceTypeEnum('funding_source_type').notNull(),
  sourceRef: text('source_ref').notNull(),
  amountCents: integer('amount_cents').notNull(),
  appliedByEventId: uuid('applied_by_event_id').references(() => checkEvents.id),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### `derived_check_state` extension sketch
```ts
bookingState: bookingStateEnum('booking_state').notNull().default('none'),
depositState: depositStateEnum('deposit_state').notNull().default('none'),
hostedSettlementState: hostedSettlementStateEnum('hosted_settlement_state').notNull().default('none'),
roleResolutionState: roleResolutionStateEnum('role_resolution_state'),
organizerGuestId: uuid('organizer_guest_id').references(() => guestProfiles.id),
reservationGuestId: uuid('reservation_guest_id').references(() => guestProfiles.id),
payerGuestId: uuid('payer_guest_id').references(() => guestProfiles.id),
primaryGuestId: uuid('primary_guest_id').references(() => guestProfiles.id),
depositAmountCents: integer('deposit_amount_cents').notNull().default(0),
depositAppliedAmountCents: integer('deposit_applied_amount_cents').notNull().default(0),
hostedAmountCents: integer('hosted_amount_cents').notNull().default(0),
hostedAppliedAmountCents: integer('hosted_applied_amount_cents').notNull().default(0),
remainingBalanceCents: integer('remaining_balance_cents').notNull().default(0),
directPaymentDueCents: integer('direct_payment_due_cents').notNull().default(0),
fundingSummaryJson: jsonb('funding_summary_json').$type<Record<string, unknown>>().default({}),
```

---

## Derived State Computation Strategy

### New inputs
For hosted/deposit scenarios, reducer inputs expand to include:
- booking row
- booking deposit rows
- check allocation rows
- role relationship fragments

### Recommended derivation order
1. derive base payment / receipt / rewards state from events
2. derive booking state from booking row + booking events
3. derive deposit state from deposit rows + deposit events
4. derive funding composition from allocations + check total
5. derive role resolution state from explicit guest roles + identity suggestions + role-confirmation events
6. derive hosted settlement state
7. detect exceptions
8. compute next action

### Important rule
Do not derive deposit state only from current deposit rows if the event history disagrees. Use events as the source of truth and deposit rows as readable state projection.

---

## Seed Data Goals

Phase 2 seed data should prove two things:
1. the architecture really extends to higher-value workflows
2. the resulting product still feels like Checkgraph, not a CRM

### Goal qualities
- deposits feel plausible
- role splits feel realistic
- funding composition is inspectable
- support export becomes richer, not noisier
- at least one scenario is clearly support-worthy

---

## Reference Data and Role Targets

### Dev operator identities
Reuse existing dev users / roles.

### Suggested role personas in scenarios
- organizer: Rachel Morgan
- reservation-holder: Rachel Morgan or executive assistant style proxy
- payer: Jonathan Reed
- attendee / primary guest: Jonathan Reed or Sophia Grant

### Time anchor
Use the same seeded day range as Phase 1 so both sets feel like one living environment.

---

## Booking / Hosted Seed Set

Create at least 2 bookings, even if only 1 is central.

### Booking 1: BrightTable Client Dinner
- booking_ref: `BK-ORE-20260330-101`
- restaurant: Olive Room Events
- booking_type: `hosted_event`
- booking_name: `BrightTable Client Dinner`
- organizer: Rachel Morgan
- payer: Jonathan Reed
- reservation-holder: Rachel Morgan
- party size: 10
- deposit amount: 50000 cents
- hosted amount: 50000 cents or partial hosted commitment
- event date: 2026-03-30 evening

### Booking 2: Sable Private Room Anniversary
- booking_ref: `BK-SBL-20260330-202`
- restaurant: Sable
- booking_type: `private_dinner`
- organizer: Ava Chen
- payer: Ava Chen
- reservation-holder: Ava Chen
- deposit amount: 25000 cents

---

## Hosted Check Scenario Specifications

Each scenario should include:
- booking context
- deposit state if applicable
- allocations if applicable
- explicit role mapping
- expected funding composition
- expected derived states and exceptions

## Scenario HD1: Deposit Captured, Not Applied

### Scenario ID
`SCN_HOSTED_DEPOSIT_UNAPPLIED`

### Purpose
Show the most important failure mode: deposit money exists, but the final check still looks fully due.

### Restaurant
`olive-room-events`

### Booking
- booking_ref: `BK-ORE-20260330-101`
- organizer: Rachel Morgan
- payer: Jonathan Reed
- reservation-holder: Rachel Morgan
- deposit amount: 50000

### Check
- external_check_ref: `CHK-ORE-20260330-011`
- service channel: `hosted_event`
- total_amount_cents: `163360`

### Deposit row
- state: `captured`
- applied_amount_cents: `0`
- refundable_amount_cents: `50000`

### Allocations
- none yet

### Event sequence
1. `check_created`
2. `booking_attached`
3. `organizer_attached`
4. `reservation_holder_attached`
5. `payer_attached`
6. `deposit_requested`
7. `deposit_captured`
8. `check_opened`
9. `items_synced`
10. `payment_authorization_requested`
11. `payment_authorized`
12. `final_receipt_received`

### Expected derived state
- payment_state: `authorized`
- booking_state: `attached`
- deposit_state: `captured`
- hosted_settlement_state: `settlement_mismatch`
- role_resolution_state: `resolved_with_split`
- remaining_balance_cents: `163360`
- direct_payment_due_cents: `163360`
- exception_state: `action_required`
- service_state: `awaiting_staff_action`

### Expected active exceptions
- `deposit_captured_not_applied`
- `organizer_payer_mismatch` optional warning if you want both surfaces

### Expected next action
- owner: `manager`
- text: `Apply captured deposit to final check before confirming the remaining balance.`

---

## Scenario HD2: Partial Hosted Coverage, Remainder Due

### Scenario ID
`SCN_HOSTED_PARTIAL_COVERAGE`

### Purpose
Show a happy but non-trivial hosted settlement.

### Restaurant
`olive-room-events`

### Booking
- hosted amount: `60000`
- no deposit, or deposit already converted to hosted credit

### Check
- total: `163360`

### Allocations
- hosted_credit_applied_to_check: `60000`

### Expected derived state
- hosted_settlement_state: `partially_reconciled`
- remaining_balance_cents: `103360`
- direct_payment_due_cents: `103360`
- exception_state: `none` or `warning` only if receipt path omitted

### Expected active exceptions
- none

### Value of scenario
Shows that this system is not only about failure; it can also explain correct complex settlement.

---

## Scenario HD3: Booking Cancelled With Active Deposit

### Scenario ID
`SCN_BOOKING_CANCELLED_ACTIVE_DEPOSIT`

### Purpose
Show a support-heavy failure where booking is cancelled but deposit remains unresolved.

### Booking
- deposit captured or hold active
- booking status cancelled

### Event sequence
1. `booking_attached`
2. `deposit_requested`
3. `deposit_hold_placed` or `deposit_captured`
4. `booking_cancelled`

### Expected derived state
- booking_state: `cancelled`
- deposit_state: `hold_active` or `captured`
- hosted_settlement_state: `none`
- exception_state: `urgent`

### Expected active exceptions
- `booking_cancelled_with_active_deposit`
- optionally `deposit_refund_missing`

### Expected next action
- owner: `support`
- text: `Release or refund active deposit for cancelled booking.`

---

## Scenario HD4: Deposit Applied, Receipt Not Reflecting Application

### Scenario ID
`SCN_DEPOSIT_APPLIED_RECEIPT_MISMATCH`

### Purpose
Show a support scenario where the system knows value was applied, but the receipt path does not reflect it clearly.

### Event sequence
1. `booking_attached`
2. `deposit_captured`
3. `check_opened`
4. `deposit_applied_to_check`
5. `payment_authorization_requested`
6. `payment_authorized`
7. `final_receipt_missing_timeout` or `receipt_itemization_unavailable`

### Expected derived state
- deposit_state: `fully_applied` or `partially_applied`
- remaining_balance_cents`: reduced
- exception_state: `warning` or `action_required`

### Expected active exceptions
- `deposit_application_not_reflected_in_receipt`
- maybe `receipt_itemization_unavailable`

---

## Scenario HD5: Organizer-Payer Split Needs Confirmation

### Scenario ID
`SCN_ORGANIZER_PAYER_SPLIT`

### Purpose
Use guest identity meaningfully in higher-value workflow.

### Setup
- organizer guest clearly known
- payer identity fragment detected separately
- no operator confirmation yet

### Expected derived state before confirmation
- role_resolution_state: `ambiguous` or `mismatch_flagged`
- exception_state: `warning`

### Expected active exceptions
- `organizer_payer_mismatch`
- `unresolved_role_assignment`

### Optional write flow
- `organizer_payer_split_confirmed`

### Expected state after confirmation
- role_resolution_state: `resolved_with_split`
- exceptions clear or reduce

---

## Scenario HD6: Hosted Benefit Linked To Wrong Guest

### Scenario ID
`SCN_HOSTED_BENEFIT_WRONG_GUEST`

### Purpose
Connect VIP/access logic to hosted settlement.

### Setup
- hosted or VIP-linked benefit attached to organizer
- primary guest or payer differs
- role mismatch creates application confusion

### Expected exceptions
- `hosted_benefit_linked_to_wrong_guest`

---

## Canonical Event Payload Shapes

### `booking_attached`
```ts
{
  bookingRef: 'BK-ORE-20260330-101',
  bookingType: 'hosted_event',
  bookingName: 'BrightTable Client Dinner',
  eventDate: '2026-03-30T19:30:00-04:00',
}
```

### `organizer_attached`
```ts
{
  organizerGuestRef: 'guest_rachel_morgan',
  organizerDisplayName: 'Rachel Morgan',
}
```

### `payer_attached`
```ts
{
  payerGuestRef: 'guest_jonathan_reed',
  payerDisplayName: 'Jonathan Reed',
  roleSource: 'payment_identity',
}
```

### `deposit_requested`
```ts
{
  depositRef: 'dep_ore_101',
  amountCents: 50000,
  depositType: 'event_deposit',
  bookingRef: 'BK-ORE-20260330-101',
}
```

### `deposit_hold_placed`
```ts
{
  depositRef: 'dep_ore_101',
  amountCents: 50000,
  holdRef: 'hold_dep_101',
}
```

### `deposit_captured`
```ts
{
  depositRef: 'dep_ore_101',
  amountCents: 50000,
  captureRef: 'cap_dep_101',
}
```

### `deposit_applied_to_check`
```ts
{
  depositRef: 'dep_ore_101',
  appliedToCheckRef: 'CHK-ORE-20260330-011',
  amountCents: 50000,
}
```

### `hosted_amount_committed`
```ts
{
  bookingRef: 'BK-ORE-20260330-101',
  amountCents: 60000,
  fundingOwnerGuestRef: 'guest_rachel_morgan',
}
```

### `hosted_credit_applied_to_check`
```ts
{
  bookingRef: 'BK-ORE-20260330-101',
  appliedToCheckRef: 'CHK-ORE-20260330-011',
  amountCents: 60000,
}
```

### `organizer_payer_split_confirmed`
```ts
{
  organizerGuestRef: 'guest_rachel_morgan',
  payerGuestRef: 'guest_jonathan_reed',
  reason: 'Corporate organizer booked event, attendee settled remainder',
  actorRole: 'manager',
}
```

---

## Seed Script Plan

Recommended Phase 2 seed order:
1. seed restaurants
2. seed guest profiles
3. seed base event bookings
4. seed booking deposits
5. seed checks
6. seed identity fragments
7. seed check events
8. materialize allocations from seed declarations
9. recompute derived state
10. insert exceptions
11. insert support cases or audit logs where needed

### Script output should include
- seeded bookings count
- seeded deposits count
- seeded allocations count
- hosted scenario count
- total check / event counts

Example:
- `Seeded 2 bookings`
- `Seeded 3 booking deposits`
- `Seeded 5 hosted scenarios`
- `Seeded 7 check allocations`

---

## Validation and Assertions

After seed, assert:
- every hosted check with booking context has a booking row
- every deposit allocation references a real event or source ref
- `deposit_applied_amount_cents <= deposit_amount_cents`
- `hosted_applied_amount_cents <= hosted_amount_cents`
- `remaining_balance_cents` matches total minus applied amounts
- `SCN_HOSTED_DEPOSIT_UNAPPLIED` has `deposit_captured_not_applied`
- `SCN_BOOKING_CANCELLED_ACTIVE_DEPOSIT` has `booking_cancelled_with_active_deposit`
- at least one hosted scenario has no active exception
- at least one hosted scenario has role-resolution ambiguity

### Optional DB verification helper
Write a tiny verification script that prints:
- booking summary
- deposit summary
- funding composition
- role summary
for one hosted check.

---

## Recommended Scenario IDs

Keep Phase 1 scenario IDs and add:
- `SCN_HOSTED_DEPOSIT_UNAPPLIED`
- `SCN_HOSTED_PARTIAL_COVERAGE`
- `SCN_BOOKING_CANCELLED_ACTIVE_DEPOSIT`
- `SCN_DEPOSIT_APPLIED_RECEIPT_MISMATCH`
- `SCN_ORGANIZER_PAYER_SPLIT`
- `SCN_HOSTED_BENEFIT_WRONG_GUEST`

If you want to replace the old generic hosted scenario, do so explicitly rather than mixing semantics.

---

## Implementation Notes for Codex

### 1. Keep scenario objects declarative
Each hosted scenario should define:
- booking
- deposits
- allocations
- roles
- events
- expected derived state
- expected exceptions

### 2. Reuse the recompute path
Do not create a separate hosted-state updater. Extend the existing recompute service.

### 3. Use cents everywhere
No floating-point money.

### 4. Make funding composition inspectable
Either via explicit table rows or via materialized computed object in derived state.

### 5. Keep role-linked write flows narrow
Best initial live-verifiable actions:
- `mark_deposit_applied`
- `confirm_organizer_payer_split`

### 6. Preserve Phase 1 test shape
Hosted scenario expectations should plug into the same scenario-based test harness if possible.

---

## Known Simplifications

- deposits and hosted credits are synthetic internal constructs for prototype purposes
- no real PSP or reservation integration
- no invoice / AR / payout model
- event booking model is intentionally shallow
- benefit / VIP entitlements are lightly represented
- one booking may map to one main check in prototype even if real life is messier

---

## Appendix A: Example Phase 2 Seed Object

```ts
export const hostedDepositUnappliedScenario = {
  scenarioId: 'SCN_HOSTED_DEPOSIT_UNAPPLIED',
  restaurantSlug: 'olive-room-events',
  booking: {
    bookingRef: 'BK-ORE-20260330-101',
    bookingType: 'hosted_event',
    bookingName: 'BrightTable Client Dinner',
    status: 'confirmed',
    organizerGuestRef: 'guest_rachel_morgan',
    payerGuestRef: 'guest_jonathan_reed',
    reservationGuestRef: 'guest_rachel_morgan',
    depositAmountCents: 50000,
    hostedAmountCents: 0,
    partySize: 10,
    eventDate: '2026-03-30T19:30:00-04:00',
  },
  deposit: {
    depositRef: 'dep_ore_101',
    depositType: 'event_deposit',
    state: 'captured',
    amountCents: 50000,
    appliedAmountCents: 0,
    refundableAmountCents: 50000,
    fundingOwnerGuestRef: 'guest_jonathan_reed',
  },
  check: {
    externalCheckRef: 'CHK-ORE-20260330-011',
    tableLabel: 'PRIVATE-1',
    serviceChannel: 'hosted_event',
    partySize: 10,
    subtotalAmountCents: 128000,
    taxAmountCents: 11360,
    tipAmountCents: 24000,
    totalAmountCents: 163360,
    openedAt: '2026-03-30T21:05:00-04:00',
  },
  allocations: [],
  events: [
    { type: 'check_created', occurredAt: '2026-03-30T21:05:00-04:00' },
    { type: 'booking_attached', occurredAt: '2026-03-30T21:05:10-04:00' },
    { type: 'organizer_attached', occurredAt: '2026-03-30T21:05:15-04:00' },
    { type: 'reservation_holder_attached', occurredAt: '2026-03-30T21:05:20-04:00' },
    { type: 'payer_attached', occurredAt: '2026-03-30T21:05:25-04:00' },
    { type: 'deposit_requested', occurredAt: '2026-03-29T10:00:00-04:00' },
    { type: 'deposit_captured', occurredAt: '2026-03-29T10:05:00-04:00' },
    { type: 'check_opened', occurredAt: '2026-03-30T21:06:00-04:00' },
    { type: 'items_synced', occurredAt: '2026-03-30T22:35:00-04:00' },
    { type: 'payment_authorization_requested', occurredAt: '2026-03-30T22:40:00-04:00' },
    { type: 'payment_authorized', occurredAt: '2026-03-30T22:40:05-04:00' },
    { type: 'final_receipt_received', occurredAt: '2026-03-30T22:43:00-04:00' },
  ],
  expected: {
    paymentState: 'authorized',
    bookingState: 'attached',
    depositState: 'captured',
    hostedSettlementState: 'settlement_mismatch',
    roleResolutionState: 'resolved_with_split',
    depositAmountCents: 50000,
    depositAppliedAmountCents: 0,
    hostedAmountCents: 0,
    hostedAppliedAmountCents: 0,
    remainingBalanceCents: 163360,
    directPaymentDueCents: 163360,
    exceptionState: 'action_required',
    serviceState: 'awaiting_staff_action',
    exceptions: ['deposit_captured_not_applied'],
    nextActionOwner: 'manager',
    nextActionText: 'Apply captured deposit to final check before confirming the remaining balance.',
  },
};
```

---

## Appendix B: Scenario-to-Exception Matrix

| Scenario ID | Expected Active Exceptions |
|---|---|
| `SCN_HOSTED_DEPOSIT_UNAPPLIED` | `deposit_captured_not_applied`, optional `organizer_payer_mismatch` |
| `SCN_HOSTED_PARTIAL_COVERAGE` | none |
| `SCN_BOOKING_CANCELLED_ACTIVE_DEPOSIT` | `booking_cancelled_with_active_deposit`, optional `deposit_refund_missing` |
| `SCN_DEPOSIT_APPLIED_RECEIPT_MISMATCH` | `deposit_application_not_reflected_in_receipt`, optional `receipt_itemization_unavailable` |
| `SCN_ORGANIZER_PAYER_SPLIT` | `organizer_payer_mismatch`, `unresolved_role_assignment` |
| `SCN_HOSTED_BENEFIT_WRONG_GUEST` | `hosted_benefit_linked_to_wrong_guest` |

---

## Appendix C: Suggested Sample Names and Values

### Example booking refs
- `BK-ORE-20260330-101`
- `BK-SBL-20260330-202`

### Example deposit refs
- `dep_ore_101`
- `dep_sbl_202`

### Example external check refs
- `CHK-ORE-20260330-011`
- `CHK-ORE-20260330-014`
- `CHK-SBL-20260330-021`

### Example support-friendly phrasing
- `A captured event deposit has not yet been applied to the final check.`
- `This booking was cancelled while a deposit remained active.`
- `Part of this hosted dinner was covered by a booking-level credit. The remaining balance was settled directly.`
- `The organizer and payer are distinct and the relationship has not yet been confirmed.`

---

This file should be enough to extend the current Checkgraph schema, seed engine, and scenario harness into Hosted Check / Deposit Resolution without inventing a parallel product model.
