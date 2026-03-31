# Checkgraph Schema and Seeds

**Version:** 1.0  
**Companion to:** `checkgraph_prd.md`, `CODEX_BUILD_GUIDE.md`  
**Purpose:** Concrete schema, enums, table-level guidance, seed data structure, and scenario definitions for the Checkgraph prototype.  
**Status:** Build-ready

---

## Table of Contents

1. [How to Use This File](#how-to-use-this-file)
2. [Schema Design Principles](#schema-design-principles)
3. [Storage Strategy](#storage-strategy)
4. [Recommended Drizzle Layout](#recommended-drizzle-layout)
5. [Core Enums](#core-enums)
6. [Table Specifications](#table-specifications)
7. [Indexes and Constraints](#indexes-and-constraints)
8. [Suggested Drizzle Schema Skeleton](#suggested-drizzle-schema-skeleton)
9. [Derived State Computation Strategy](#derived-state-computation-strategy)
10. [Seed Data Goals](#seed-data-goals)
11. [Seed Dataset Shape](#seed-dataset-shape)
12. [Base Reference Data](#base-reference-data)
13. [Guest Seed Set](#guest-seed-set)
14. [Restaurant Seed Set](#restaurant-seed-set)
15. [Scenario Seed Specifications](#scenario-seed-specifications)
16. [Canonical Event Payload Shapes](#canonical-event-payload-shapes)
17. [Seed Script Plan](#seed-script-plan)
18. [Validation and Assertions](#validation-and-assertions)
19. [Recommended Scenario IDs](#recommended-scenario-ids)
20. [Implementation Notes for Codex](#implementation-notes-for-codex)
21. [Known Simplifications](#known-simplifications)
22. [Appendix A: Example Seed Object Shape](#appendix-a-example-seed-object-shape)
23. [Appendix B: Scenario-to-Exception Matrix](#appendix-b-scenario-to-exception-matrix)
24. [Appendix C: Suggested Sample Names and Values](#appendix-c-suggested-sample-names-and-values)

---

## How to Use This File

Use this file as the lowest-level domain reference while building Checkgraph.

- The **PRD** defines product intent.
- The **Codex Build Guide** defines build order and acceptance criteria.
- This file defines the concrete **schema shape**, **enum values**, **relationships**, and **seed scenarios**.

This file should reduce ambiguity around:
- which tables to create
- which columns matter for the prototype
- how to represent append-only events
- how to seed realistic demo data
- how scenarios should map to expected derived states and exceptions

If there is a conflict:
1. PRD intent wins
2. This schema file decides implementation detail
3. The build guide decides sequencing

---

## Schema Design Principles

### 1. Events are the primary truth
The `check_events` table is the canonical source of truth for check lifecycle history.

### 2. Derived state is cached convenience, not authority
The `derived_check_state` table is a computed summary for UI performance and convenience. It should be fully derivable from `check_events` and related identity data.

### 3. Exceptions are explicit first-class objects
Exceptions should not be hidden inside computed state only. They need their own table so they can be filtered, triaged, resolved, and audited.

### 4. Identity is fragmented by default
The schema should assume guest identity is initially incomplete and cross-system fragments must be linked later.

### 5. Future high-value workflows should be possible without redesign
Even if private dining, hosted payments, deposits, and event workflows are not fully implemented, the schema should leave a clean path for them.

### 6. Favor operational readability over maximal normalization
This prototype should be credible and easy to iterate on. It does not need perfect warehouse-style normalization.

---

## Storage Strategy

Use Postgres with Drizzle ORM.

### Recommended patterns
- use string-backed Postgres enums where helpful
- use UUID primary keys
- use `jsonb` for event payloads and identity matching reasons/conflicts
- use `timestamptz` for all timestamps
- use explicit foreign keys where domain ownership is clear
- allow a small amount of denormalization for UI speed and seed simplicity

### Tables that should be append-only in practice
- `check_events`
- `audit_logs`
- optionally `guest_match_reviews` if you split review history into its own table

### Tables that may be updated
- `derived_check_state`
- `exceptions`
- `support_cases`
- `guest_match_suggestions`
- `checks`
- `guest_profiles`
- `event_bookings`

---

## Recommended Drizzle Layout

Recommended file structure under `lib/db/schema/`:

```text
lib/db/schema/
  enums.ts
  restaurants.ts
  checks.ts
  events.ts
  derived-state.ts
  exceptions.ts
  guests.ts
  support.ts
  bookings.ts
  relations.ts
```

Recommended supporting files:

```text
lib/db/seed/
  reference.ts
  restaurants.ts
  guests.ts
  scenarios/
    happy-path.ts
    preauth-confusion.ts
    delayed-receipt.ts
    duplicate-charge.ts
    payer-mismatch.ts
    network-fallback.ts
    vip-linking.ts
    hosted-event.ts
  seed.ts
```

---

## Core Enums

Define these enums centrally in one file.

### Restaurant / service enums

#### `serviceMode`
- `full_service`
- `quick_service`
- `bar_lounge`
- `private_event`

#### `serviceChannel`
- `table_service`
- `bar_tab`
- `counter`
- `private_dining`
- `hosted_event`

### Check state enums

#### `paymentState`
- `not_started`
- `preauthorized`
- `authorization_pending`
- `authorized`
- `capture_pending`
- `captured`
- `capture_failed`
- `closed`
- `unknown`

#### `receiptState`
- `not_available`
- `pending`
- `received`
- `missing_after_timeout`

#### `rewardsState`
- `not_eligible`
- `awaiting_final_receipt`
- `ready_to_post`
- `posting`
- `posted`
- `failed`

#### `identityState`
- `unlinked`
- `linked_confident`
- `linked_low_confidence`
- `ambiguous`
- `mismatch_flagged`

#### `exceptionState`
- `none`
- `warning`
- `action_required`
- `urgent`

#### `serviceState`
- `active`
- `awaiting_guest_action`
- `awaiting_staff_action`
- `awaiting_backend_completion`
- `blocked`
- `completed`

### Event enums

#### `eventGroup`
- `payment`
- `receipt`
- `rewards`
- `identity`
- `operations`
- `support`
- `overrides`
- `lifecycle`

#### `eventType`
Use the full set from the PRD/build guide:
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
- `final_receipt_received`
- `final_receipt_missing_timeout`
- `rewards_eligibility_confirmed`
- `rewards_post_requested`
- `rewards_posted`
- `rewards_post_failed`
- `check_closed`
- `check_reopened`
- `manual_override_applied`
- `manual_override_reverted`
- `support_case_created`
- `support_case_resolved`
- `guest_checkin_detected`
- `reservation_attached`
- `payment_identity_detected`
- `identity_match_suggested`
- `identity_match_confirmed`
- `identity_match_rejected`
- `identity_merge_applied`
- `duplicate_charge_suspected`
- `payer_reservation_mismatch_detected`
- `receipt_itemization_unavailable`
- `network_degraded`
- `terminal_offline`
- `fallback_mode_entered`
- `fallback_mode_exited`

### Source / actor enums

#### `sourceSystem`
- `mobile_app`
- `terminal`
- `pos`
- `rewards_engine`
- `identity_service`
- `ops_console`
- `support_console`
- `scenario_seed`

#### `actorType`
- `guest`
- `server`
- `host`
- `manager`
- `support`
- `system`
- `admin`

#### `roleType`
- `server`
- `manager`
- `support`
- `admin`

### Exception enums

#### `exceptionType`
- `duplicate_charge_suspected`
- `auth_succeeded_capture_missing`
- `capture_succeeded_close_missing`
- `stale_preauth_visibility`
- `payment_state_unknown`
- `capture_failed_after_auth`
- `reopened_after_close`
- `final_receipt_missing_after_timeout`
- `receipt_itemization_unavailable`
- `receipt_amount_mismatch`
- `rewards_waiting_on_final_receipt`
- `rewards_failed_after_receipt`
- `rewards_posted_to_ambiguous_guest`
- `payer_reservation_mismatch`
- `multiple_plausible_guest_matches`
- `low_confidence_guest_assignment`
- `vip_profile_not_linked`
- `network_degraded_during_payment`
- `terminal_offline_during_close`
- `fallback_mode_unresolved`
- `manual_override_without_note`

#### `exceptionSeverity`
- `warning`
- `action_required`
- `urgent`

#### `exceptionStatus`
- `open`
- `acknowledged`
- `resolved`
- `suppressed`

### Identity match enums

#### `matchStatus`
- `suggested`
- `confirmed`
- `rejected`
- `superseded`

#### `matchBand`
- `high`
- `medium`
- `low`

### Support case enums

#### `supportCaseStatus`
- `open`
- `investigating`
- `waiting_on_restaurant`
- `waiting_on_backend`
- `resolved`
- `closed`

### Booking / future-workflow enums

#### `bookingType`
- `private_dinner`
- `hosted_event`
- `corporate_dining`

#### `bookingStatus`
- `lead`
- `deposit_pending`
- `deposit_paid`
- `confirmed`
- `completed`
- `cancelled`

---

## Table Specifications

## 1. `restaurants`
Represents restaurant locations or demo restaurant instances.

### Columns
- `id` UUID PK
- `slug` text unique not null
- `name` text not null
- `service_mode` enum not null
- `timezone` text not null
- `city` text nullable
- `state_region` text nullable
- `is_active` boolean not null default true
- `created_at` timestamptz not null default now()

### Notes
Keep this simple. Seed 2 to 3 restaurants with slightly different service patterns.

---

## 2. `checks`
Represents a dining bill / session instance.

### Columns
- `id` UUID PK
- `restaurant_id` UUID FK -> `restaurants.id`
- `scenario_id` text nullable
- `external_check_ref` text unique not null
- `table_label` text nullable
- `service_channel` enum not null
- `status_label` text nullable
- `party_size` integer nullable
- `subtotal_amount_cents` integer not null
- `tax_amount_cents` integer not null
- `tip_amount_cents` integer not null default 0
- `total_amount_cents` integer not null
- `currency` text not null default `'USD'`
- `reservation_ref` text nullable
- `event_booking_id` UUID nullable FK -> `event_bookings.id`
- `opened_at` timestamptz not null
- `closed_at` timestamptz nullable
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### Notes
- `scenario_id` makes demo filtering easier.
- `external_check_ref` should feel like something from a POS or orchestration system.

---

## 3. `check_events`
Canonical append-only log of check lifecycle facts.

### Columns
- `id` UUID PK
- `check_id` UUID FK -> `checks.id`
- `sequence_no` integer not null
- `event_type` enum not null
- `event_group` enum not null
- `occurred_at` timestamptz not null
- `source_system` enum not null
- `actor_type` enum not null
- `actor_id` text nullable
- `correlation_id` text nullable
- `idempotency_key` text nullable
- `payload_json` jsonb not null default `'{}'`
- `created_at` timestamptz not null default now()

### Notes
- `sequence_no` is per-check ordering convenience. Also sort by `occurred_at`.
- `payload_json` should be typed in TS with a union or helper mappers.
- For prototype purposes, do not over-model event payload columns as relational tables.

---

## 4. `derived_check_state`
Cached current state summary per check.

### Columns
- `check_id` UUID PK FK -> `checks.id`
- `payment_state` enum not null
- `receipt_state` enum not null
- `rewards_state` enum not null
- `identity_state` enum not null
- `exception_state` enum not null
- `service_state` enum not null
- `linked_guest_id` UUID nullable FK -> `guest_profiles.id`
- `next_action_owner` enum nullable (`roleType` works fine here)
- `next_action_text` text nullable
- `active_exception_count` integer not null default 0
- `last_event_at` timestamptz nullable
- `computed_at` timestamptz not null default now()

### Notes
- This table can be recomputed from seed or on write.
- For MVP, recompute synchronously after scenario seed insertion or manual override.

---

## 5. `exceptions`
Active and historical operational exceptions.

### Columns
- `id` UUID PK
- `check_id` UUID FK -> `checks.id`
- `exception_type` enum not null
- `severity` enum not null
- `status` enum not null default `'open'`
- `detected_at` timestamptz not null
- `resolved_at` timestamptz nullable
- `assigned_role` enum nullable
- `assigned_user` text nullable
- `explanation_text` text not null
- `recommended_next_action` text not null
- `recommended_owner` enum nullable
- `resolution_text` text nullable
- `source_event_id` UUID nullable FK -> `check_events.id`
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### Notes
- Keep both active and resolved exceptions for timeline and auditability.
- Do not hard-delete exceptions in prototype.

---

## 6. `guest_profiles`
Canonical guest entity.

### Columns
- `id` UUID PK
- `display_name` text not null
- `first_name` text nullable
- `last_name` text nullable
- `phone_normalized` text nullable
- `email_normalized` text nullable
- `vip_tier` text nullable
- `guest_value_score` integer nullable
- `notes` text nullable
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### Notes
- `guest_value_score` is okay as demo metadata, but avoid making it the centerpiece.
- Keep VIP tiers human-readable: `gold`, `vip`, `frequent`, etc.

---

## 7. `guest_identity_fragments`
Cross-system fragments that may or may not already map to a canonical guest.

### Columns
- `id` UUID PK
- `guest_profile_id` UUID nullable FK -> `guest_profiles.id`
- `check_id` UUID nullable FK -> `checks.id`
- `source_system` enum not null
- `external_identity_ref` text not null
- `raw_name` text nullable
- `raw_phone` text nullable
- `raw_email` text nullable
- `payment_alias` text nullable
- `reservation_ref` text nullable
- `device_ref` text nullable
- `metadata_json` jsonb not null default `'{}'`
- `created_at` timestamptz not null default now()

### Notes
- `check_id` is helpful for scenario-local identity ambiguity.
- `guest_profile_id` can be null for unmatched fragments.

---

## 8. `guest_match_suggestions`
Candidate identity matches for fragments.

### Columns
- `id` UUID PK
- `check_id` UUID FK -> `checks.id`
- `fragment_id` UUID FK -> `guest_identity_fragments.id`
- `candidate_guest_id` UUID FK -> `guest_profiles.id`
- `confidence_score` numeric(5,2) not null
- `match_band` enum not null
- `reasons_json` jsonb not null default `'[]'`
- `conflicts_json` jsonb not null default `'[]'`
- `suggested_action` text not null
- `status` enum not null default `'suggested'`
- `reviewed_by` text nullable
- `reviewed_at` timestamptz nullable
- `created_at` timestamptz not null default now()

### Notes
- This table is current suggestion state, not full review history.
- All review actions should additionally emit audit logs and events.

---

## 9. `support_cases`
Support investigations tied to checks.

### Columns
- `id` UUID PK
- `check_id` UUID FK -> `checks.id`
- `status` enum not null default `'open'`
- `summary` text not null
- `guest_visible_summary` text nullable
- `owner` text nullable
- `created_at` timestamptz not null default now()
- `resolved_at` timestamptz nullable
- `updated_at` timestamptz not null default now()

---

## 10. `audit_logs`
Audit trail for manual actions and support actions.

### Columns
- `id` UUID PK
- `entity_type` text not null
- `entity_id` UUID not null
- `action_type` text not null
- `actor_role` enum not null
- `actor_id` text not null
- `note` text nullable
- `payload_json` jsonb not null default `'{}'`
- `created_at` timestamptz not null default now()

### Notes
Good `entity_type` values:
- `check`
- `exception`
- `guest_match_suggestion`
- `guest_profile`
- `support_case`

---

## 11. `event_bookings`
Future-facing support for higher-value workflows.

### Columns
- `id` UUID PK
- `restaurant_id` UUID FK -> `restaurants.id`
- `booking_type` enum not null
- `status` enum not null
- `event_name` text not null
- `organizer_guest_id` UUID nullable FK -> `guest_profiles.id`
- `payer_guest_id` UUID nullable FK -> `guest_profiles.id`
- `party_size` integer nullable
- `deposit_amount_cents` integer nullable
- `event_date` timestamptz nullable
- `notes` text nullable
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### Notes
Do not overbuild this. One seeded hosted/private scenario is enough.

---

## 12. Optional helper table: `app_users`
Only if you want cleaner dev role switching.

### Columns
- `id` UUID PK
- `email` text unique not null
- `display_name` text not null
- `role` enum not null
- `created_at` timestamptz not null default now()

### Notes
This is optional. A hardcoded role switcher is acceptable.

---

## Indexes and Constraints

## Recommended indexes

### `checks`
- unique index on `external_check_ref`
- index on `(restaurant_id, opened_at desc)`
- index on `scenario_id`
- index on `event_booking_id`

### `check_events`
- unique index on `(check_id, sequence_no)`
- index on `(check_id, occurred_at asc)`
- index on `(check_id, event_type)`
- index on `correlation_id`
- optional unique partial index on `idempotency_key` where not null

### `derived_check_state`
- index on `exception_state`
- index on `payment_state`
- index on `identity_state`
- index on `last_event_at desc`

### `exceptions`
- index on `(status, severity, detected_at desc)`
- index on `(check_id, status)`
- index on `exception_type`
- index on `assigned_role`

### `guest_profiles`
- index on `phone_normalized`
- index on `email_normalized`
- index on `(last_name, first_name)`

### `guest_identity_fragments`
- index on `(check_id, source_system)`
- index on `guest_profile_id`
- index on `external_identity_ref`
- index on `payment_alias`
- index on `reservation_ref`

### `guest_match_suggestions`
- index on `(check_id, status)`
- index on `(fragment_id, status)`
- index on `candidate_guest_id`

### `support_cases`
- index on `(check_id, status)`

### `audit_logs`
- index on `(entity_type, entity_id, created_at desc)`

## Recommended constraints
- `checks.total_amount_cents >= 0`
- `checks.subtotal_amount_cents >= 0`
- `checks.tax_amount_cents >= 0`
- `checks.tip_amount_cents >= 0`
- `checks.party_size > 0` when not null
- `guest_match_suggestions.confidence_score >= 0 and <= 1`
- `event_bookings.deposit_amount_cents >= 0` when not null

---

## Suggested Drizzle Schema Skeleton

This is intentionally partial. Codex can expand it, but should stay close to this shape.

```ts
// lib/db/schema/enums.ts
export const serviceModeEnum = pgEnum('service_mode', [
  'full_service',
  'quick_service',
  'bar_lounge',
  'private_event',
]);

export const serviceChannelEnum = pgEnum('service_channel', [
  'table_service',
  'bar_tab',
  'counter',
  'private_dining',
  'hosted_event',
]);

export const paymentStateEnum = pgEnum('payment_state', [
  'not_started',
  'preauthorized',
  'authorization_pending',
  'authorized',
  'capture_pending',
  'captured',
  'capture_failed',
  'closed',
  'unknown',
]);

export const receiptStateEnum = pgEnum('receipt_state', [
  'not_available',
  'pending',
  'received',
  'missing_after_timeout',
]);

export const rewardsStateEnum = pgEnum('rewards_state', [
  'not_eligible',
  'awaiting_final_receipt',
  'ready_to_post',
  'posting',
  'posted',
  'failed',
]);

export const identityStateEnum = pgEnum('identity_state', [
  'unlinked',
  'linked_confident',
  'linked_low_confidence',
  'ambiguous',
  'mismatch_flagged',
]);

export const exceptionStateEnum = pgEnum('exception_state', [
  'none',
  'warning',
  'action_required',
  'urgent',
]);

export const serviceStateEnum = pgEnum('service_state', [
  'active',
  'awaiting_guest_action',
  'awaiting_staff_action',
  'awaiting_backend_completion',
  'blocked',
  'completed',
]);
```

```ts
// lib/db/schema/checks.ts
export const checks = pgTable('checks', {
  id: uuid('id').defaultRandom().primaryKey(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id),
  scenarioId: text('scenario_id'),
  externalCheckRef: text('external_check_ref').notNull().unique(),
  tableLabel: text('table_label'),
  serviceChannel: serviceChannelEnum('service_channel').notNull(),
  statusLabel: text('status_label'),
  partySize: integer('party_size'),
  subtotalAmountCents: integer('subtotal_amount_cents').notNull(),
  taxAmountCents: integer('tax_amount_cents').notNull(),
  tipAmountCents: integer('tip_amount_cents').notNull().default(0),
  totalAmountCents: integer('total_amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  reservationRef: text('reservation_ref'),
  eventBookingId: uuid('event_booking_id').references(() => eventBookings.id),
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

```ts
// lib/db/schema/events.ts
export const checkEvents = pgTable('check_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  checkId: uuid('check_id').notNull().references(() => checks.id),
  sequenceNo: integer('sequence_no').notNull(),
  eventType: eventTypeEnum('event_type').notNull(),
  eventGroup: eventGroupEnum('event_group').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  sourceSystem: sourceSystemEnum('source_system').notNull(),
  actorType: actorTypeEnum('actor_type').notNull(),
  actorId: text('actor_id'),
  correlationId: text('correlation_id'),
  idempotencyKey: text('idempotency_key'),
  payloadJson: jsonb('payload_json').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueSequence: unique().on(table.checkId, table.sequenceNo),
  checkOccurredIdx: index().on(table.checkId, table.occurredAt),
}));
```

Codex should flesh out the rest in the repo, but stay close to this design.

---

## Derived State Computation Strategy

### Source inputs
- `checks`
- ordered `check_events`
- linked `guest_identity_fragments`
- active `guest_match_suggestions`
- optionally `event_bookings`

### Output targets
- one row in `derived_check_state`
- zero or more rows in `exceptions`

### Recommended approach
1. load the full event sequence for one check
2. reduce events into an intermediate state object
3. run exception detection rules on the reduced state + events
4. run identity evaluation on fragments + suggestions
5. compute `next_action_owner` and `next_action_text`
6. persist final state and upsert exception rows

### Important implementation note
Do not spread this logic across UI or route handlers. Build pure domain functions under something like:

```text
lib/domain/state/
lib/domain/exceptions/
lib/domain/identity/
```

---

## Seed Data Goals

The seed data should feel like something a restaurant-tech engineer or product lead would recognize as plausible.

### Goals
- demonstrate all major state transitions
- demonstrate failure states, not just happy paths
- cover both guest-side confusion and operator-side confusion
- show identity ambiguity in realistic ways
- show at least one higher-value workflow example
- provide enough variety for Overview and Exception Queue to feel real

### Avoid
- obvious placeholder names like `Test Restaurant 1`
- silly check IDs
- fake metrics or cartoon values
- overly synthetic edge cases that never happen operationally

---

## Seed Dataset Shape

Recommended totals:
- 3 restaurants
- 8 canonical scenarios
- 10 to 15 checks total
- 6 to 10 guest profiles
- 12 to 20 identity fragments
- 8 to 15 match suggestions
- 1 to 2 support cases
- 1 event booking
- 40 to 90 total events depending on scenario depth

### Why more than 8 checks?
Eight scenario checks is enough for demo, but the Overview and Queue screens feel more believable with some extra calm or semi-normal checks.

---

## Base Reference Data

Seed these constants in code:

### Dev users / role switch targets
- `alex.server@checkgraph.dev` → server
- `marina.manager@checkgraph.dev` → manager
- `sam.support@checkgraph.dev` → support
- `priya.admin@checkgraph.dev` → admin

### Timezone
Use one timezone consistently for restaurants in prototype, for example:
- `America/New_York`

### Base date window
Seed all scenarios within the same recent 48-hour window so the app feels alive.

Example anchor:
- base date: `2026-03-28T17:00:00-04:00`

Then offset events by minutes.

---

## Guest Seed Set

Seed 8 canonical guest profiles.

### Recommended guests
1. **Ava Chen**
   - phone: `+1 917 555 0131`
   - email: `ava.chen@example.com`
   - vip tier: `vip`
   - guest value score: `91`

2. **Daniel Ortiz**
   - phone: `+1 646 555 0188`
   - email: `daniel.ortiz@example.com`
   - frequent diner

3. **Maya Patel**
   - phone: `+1 718 555 0104`
   - email: `maya.patel@example.com`

4. **Jonathan Reed**
   - phone: `+1 917 555 0147`
   - email: `jon.reed@northpeak.co`

5. **Leah Kim**
   - phone: `+1 646 555 0172`
   - email: `leah.kim@example.com`

6. **Sophia Grant**
   - phone: `+1 212 555 0125`
   - email: `sophia.grant@example.com`

7. **Ethan Brooks**
   - phone: `+1 646 555 0194`
   - email: `ethan.brooks@example.com`

8. **Rachel Morgan**
   - phone: `+1 917 555 0166`
   - email: `rachel.morgan@brighttable.com`
   - organizer-like profile for hosted event

### Notes
- Use realistic overlaps and variations in fragments later, for example:
  - missing country code
  - abbreviated first names
  - organizer email used for booking, another person pays

---

## Restaurant Seed Set

Seed 3 restaurants with distinct feel.

### 1. `sable-nyc`
- name: `Sable`
- service mode: `full_service`
- city: `New York`
- service channel mix: mostly table service

### 2. `northline-bar`
- name: `Northline Bar`
- service mode: `bar_lounge`
- city: `Brooklyn`
- service channel mix: bar tabs + table service

### 3. `olive-room-events`
- name: `Olive Room Events`
- service mode: `private_event`
- city: `New York`
- service channel mix: hosted events / private dining

### Notes
These do not need to mimic any real restaurant. They just need to feel plausible and let the UI show varied service contexts.

---

## Scenario Seed Specifications

Each scenario below should include:
- one `checks` row
- 4 to 12 events
- optional identity fragments
- optional match suggestions
- optional support case or audit logs
- expected derived state
- expected active exceptions

## Scenario 1: Happy Path

### Scenario ID
`SCN_HAPPY_PATH`

### Purpose
Baseline successful check lifecycle.

### Restaurant
`sable-nyc`

### Check summary
- table: `12`
- party size: `2`
- subtotal: `12400`
- tax: `1100`
- tip: `2600`
- total: `16100`

### Suggested guest
Daniel Ortiz

### Event sequence
1. `check_created`
2. `check_opened`
3. `guest_checkin_detected`
4. `items_synced`
5. `payment_method_attached`
6. `payment_authorization_requested`
7. `payment_authorized`
8. `payment_capture_requested`
9. `payment_captured`
10. `final_receipt_received`
11. `rewards_eligibility_confirmed`
12. `rewards_post_requested`
13. `rewards_posted`
14. `check_closed`

### Expected derived state
- payment_state: `closed`
- receipt_state: `received`
- rewards_state: `posted`
- identity_state: `linked_confident`
- exception_state: `none`
- service_state: `completed`

### Expected exceptions
None.

---

## Scenario 2: Preauth Confusion

### Scenario ID
`SCN_PREAUTH_CONFUSION`

### Purpose
Show a captured payment where the temporary hold still appears and could confuse the diner.

### Restaurant
`sable-nyc`

### Check summary
- table: `7`
- party size: `3`
- subtotal: `8900`
- tax: `790`
- tip: `1800`
- total: `11490`

### Suggested guest
Maya Patel

### Event sequence
1. `check_created`
2. `check_opened`
3. `guest_checkin_detected`
4. `payment_method_attached`
5. `preauth_placed`
6. `items_synced`
7. `payment_authorization_requested`
8. `payment_authorized`
9. `payment_capture_requested`
10. `payment_captured`
11. `final_receipt_received`
12. `rewards_eligibility_confirmed`
13. `rewards_post_requested`
14. `rewards_posted`
15. `check_closed`

### Important missing event
No `preauth_released` yet.

### Expected derived state
- payment_state: `closed`
- receipt_state: `received`
- rewards_state: `posted`
- identity_state: `linked_confident`
- exception_state: `warning`
- service_state: `completed`

### Expected active exceptions
- `stale_preauth_visibility`

### Expected recommended action
- owner: `support` or `manager`
- text: explain hold versus captured charge and monitor release timing

---

## Scenario 3: Delayed Final Receipt Blocking Rewards

### Scenario ID
`SCN_DELAYED_RECEIPT`

### Purpose
Show a normal payment that has captured, but final receipt has not arrived yet, so rewards remain pending.

### Restaurant
`sable-nyc`

### Check summary
- table: `15`
- party size: `2`
- subtotal: `6700`
- tax: `600`
- tip: `1400`
- total: `8700`

### Suggested guest
Leah Kim

### Event sequence
1. `check_created`
2. `check_opened`
3. `guest_checkin_detected`
4. `items_synced`
5. `payment_method_attached`
6. `payment_authorization_requested`
7. `payment_authorized`
8. `payment_capture_requested`
9. `payment_captured`
10. `receipt_itemization_unavailable`
11. `final_receipt_missing_timeout`
12. `rewards_eligibility_confirmed`

### Expected derived state
- payment_state: `captured`
- receipt_state: `missing_after_timeout`
- rewards_state: `awaiting_final_receipt`
- identity_state: `linked_confident`
- exception_state: `action_required`
- service_state: `awaiting_backend_completion`

### Expected active exceptions
- `final_receipt_missing_after_timeout`
- `receipt_itemization_unavailable`
- `rewards_waiting_on_final_receipt`

### Expected recommended action
- owner: `manager` or `support`
- text: verify final receipt ingestion before escalating reward issue

---

## Scenario 4: Duplicate Charge Suspicion

### Scenario ID
`SCN_DUPLICATE_CHARGE`

### Purpose
Show a retry or repeated capture flow that looks like a duplicate charge.

### Restaurant
`northline-bar`

### Check summary
- table: `BAR-04`
- party size: `1`
- subtotal: `4200`
- tax: `370`
- tip: `1000`
- total: `5570`

### Suggested guest
Ethan Brooks

### Event sequence
1. `check_created`
2. `check_opened`
3. `guest_checkin_detected`
4. `items_synced`
5. `payment_method_attached`
6. `payment_authorization_requested`
7. `payment_authorized`
8. `payment_capture_requested`
9. `payment_captured`
10. `payment_capture_requested`
11. `payment_captured`
12. `duplicate_charge_suspected`
13. `support_case_created`

### Expected derived state
- payment_state: `captured`
- receipt_state: `pending`
- rewards_state: `awaiting_final_receipt`
- identity_state: `linked_confident`
- exception_state: `urgent`
- service_state: `blocked`

### Expected active exceptions
- `duplicate_charge_suspected`
- optionally `capture_succeeded_close_missing`

### Support case
Create one open support case for this scenario.

### Expected recommended action
- owner: `support`
- text: investigate duplicate capture before communicating final charge status

---

## Scenario 5: Payer Does Not Match Reservation Holder

### Scenario ID
`SCN_PAYER_MISMATCH`

### Purpose
Show a realistic identity problem where the reservation holder and payer are different people.

### Restaurant
`sable-nyc`

### Check summary
- table: `21`
- party size: `4`
- subtotal: `18300`
- tax: `1625`
- tip: `3600`
- total: `23525`
- reservation ref: `RES-SBL-2107`

### Canonical guests involved
- reservation holder: Jonathan Reed
- likely payer: Sophia Grant

### Identity fragments
- reservation fragment for Jonathan Reed
- payment identity fragment for `S. Grant`
- optional app identity fragment with phone matching Sophia Grant

### Event sequence
1. `check_created`
2. `check_opened`
3. `reservation_attached`
4. `guest_checkin_detected`
5. `payment_identity_detected`
6. `payer_reservation_mismatch_detected`
7. `items_synced`
8. `payment_authorization_requested`
9. `payment_authorized`
10. `payment_capture_requested`
11. `payment_captured`
12. `final_receipt_received`

### Match suggestions
- medium-to-high suggestion for Sophia Grant as payer
- confirmed reservation holder Jonathan Reed

### Expected derived state
- payment_state: `captured`
- receipt_state: `received`
- rewards_state: `ready_to_post` or `posting` depending on seed choice
- identity_state: `mismatch_flagged`
- exception_state: `warning`
- service_state: `awaiting_staff_action`

### Expected active exceptions
- `payer_reservation_mismatch`
- possibly `multiple_plausible_guest_matches` if you include another weak candidate

### Expected recommended action
- owner: `manager`
- text: confirm payer-versus-reservation relationship before linking rewards or closing guest identity issue

---

## Scenario 6: Network Degradation and Fallback Mode

### Scenario ID
`SCN_NETWORK_FALLBACK`

### Purpose
Show operational degradation during payment close.

### Restaurant
`northline-bar`

### Check summary
- table: `LNG-02`
- party size: `2`
- subtotal: `9600`
- tax: `850`
- tip: `1900`
- total: `12350`

### Suggested guest
Ava Chen

### Event sequence
1. `check_created`
2. `check_opened`
3. `guest_checkin_detected`
4. `items_synced`
5. `payment_method_attached`
6. `payment_authorization_requested`
7. `network_degraded`
8. `terminal_offline`
9. `fallback_mode_entered`
10. `payment_authorized`
11. `manual_override_applied`
12. `payment_captured`
13. `fallback_mode_exited`

### Optional audit log
- manager confirms payment manually with note

### Expected derived state
- payment_state: `captured`
- receipt_state: `pending`
- rewards_state: `awaiting_final_receipt`
- identity_state: `linked_confident`
- exception_state: `action_required`
- service_state: `awaiting_backend_completion`

### Expected active exceptions
- `network_degraded_during_payment`
- `terminal_offline_during_close`
- possibly `manual_override_without_note` only if you intentionally omit note in one version

### Expected recommended action
- owner: `manager`
- text: confirm receipt and clear fallback-related warning before final closure

---

## Scenario 7: Existing VIP Guest Not Linked

### Scenario ID
`SCN_VIP_NOT_LINKED`

### Purpose
Show fragmented identity where the right guest exists, but current check is only weakly linked until operator review.

### Restaurant
`sable-nyc`

### Check summary
- table: `5`
- party size: `2`
- subtotal: `14900`
- tax: `1320`
- tip: `3000`
- total: `19220`

### Canonical guest
Ava Chen, VIP

### Identity fragments
- app identity uses `A. Chen`
- phone missing country code
- payment alias matches prior visit alias
- reservation absent or different spelling

### Event sequence
1. `check_created`
2. `check_opened`
3. `payment_identity_detected`
4. `guest_checkin_detected`
5. `identity_match_suggested`
6. `items_synced`
7. `payment_authorization_requested`
8. `payment_authorized`
9. `payment_capture_requested`
10. `payment_captured`
11. `final_receipt_received`

### Match suggestions
- Ava Chen with confidence 0.78, reasons include phone suffix and payment alias history

### Expected derived state before operator review
- payment_state: `captured`
- receipt_state: `received`
- rewards_state: `ready_to_post`
- identity_state: `linked_low_confidence`
- exception_state: `warning`
- service_state: `awaiting_staff_action`

### Expected active exceptions
- `vip_profile_not_linked`
- `low_confidence_guest_assignment`

### Optional follow-up interaction
Seed an audit log or separate replay action where manager confirms match and emits:
- `identity_match_confirmed`
- `identity_merge_applied`

---

## Scenario 8: Hosted Dinner / Higher-Value Workflow Support

### Scenario ID
`SCN_HOSTED_EVENT`

### Purpose
Show that the schema and state model can support higher-value workflows without turning the product into a CRM.

### Restaurant
`olive-room-events`

### Event booking summary
- booking type: `hosted_event`
- event name: `BrightTable Client Dinner`
- organizer: Rachel Morgan
- payer: Jonathan Reed
- party size: `10`
- deposit amount: `50000`

### Check summary
- service channel: `hosted_event`
- subtotal: `128000`
- tax: `11360`
- tip: `24000`
- total: `163360`

### Event sequence
1. `check_created`
2. `check_opened`
3. `reservation_attached`
4. `payment_identity_detected`
5. `guest_checkin_detected`
6. `items_synced`
7. `payment_authorization_requested`
8. `payment_authorized`
9. `payment_capture_requested`
10. `payment_captured`
11. `final_receipt_received`
12. `rewards_eligibility_confirmed`

### Identity reality
- organizer != payer != all attendees
- no exception if modeled correctly

### Expected derived state
- payment_state: `captured`
- receipt_state: `received`
- rewards_state: `ready_to_post` or `not_eligible`, depending on how you want event dining handled
- identity_state: `linked_confident` or `mismatch_flagged` if you want a warning surface
- exception_state: `none` or `warning`
- service_state: `awaiting_backend_completion` or `completed`

### Recommended use in UI
This scenario should be visible as proof that Checkgraph’s infrastructure supports event dining and hosted payments.

---

## Canonical Event Payload Shapes

The prototype can use `jsonb`, but Codex should still keep payloads consistent.

## Generic event payload base

```ts
{
  note?: string;
  amountCents?: number;
  currency?: 'USD';
  checkTotalCents?: number;
}
```

## Example payloads by event

### `preauth_placed`
```ts
{
  amountCents: 11490,
  paymentAlias: 'card_4242',
  holdWindowHours: 24,
}
```

### `payment_authorized`
```ts
{
  amountCents: 11490,
  authorizationRef: 'auth_01',
  paymentAlias: 'card_4242',
}
```

### `payment_captured`
```ts
{
  amountCents: 11490,
  captureRef: 'cap_01',
  paymentAlias: 'card_4242',
  duplicateRisk: false,
}
```

### `final_receipt_received`
```ts
{
  receiptRef: 'rcpt_01',
  subtotalAmountCents: 8900,
  taxAmountCents: 790,
  tipAmountCents: 1800,
  totalAmountCents: 11490,
  itemCount: 4,
}
```

### `guest_checkin_detected`
```ts
{
  guestToken: 'guest_tok_01',
  appAccountRef: 'acct_01',
  deviceRef: 'device_01',
}
```

### `reservation_attached`
```ts
{
  reservationRef: 'RES-SBL-2107',
  reservationName: 'Jonathan Reed',
  partySize: 4,
}
```

### `payment_identity_detected`
```ts
{
  paymentAlias: 'card_1881',
  payerDisplayName: 'S. Grant',
  billingZipSuffix: '10011',
}
```

### `manual_override_applied`
```ts
{
  overrideType: 'mark_payment_confirmed',
  reason: 'Terminal offline during close; manager verified processor success',
  actorRole: 'manager',
}
```

### `identity_match_suggested`
```ts
{
  fragmentRef: 'frag_01',
  candidateGuestRef: 'guest_ava_chen',
  confidenceScore: 0.78,
  reasons: ['Payment alias seen on prior linked visit', 'Phone suffix matches 0131'],
  conflicts: ['Reservation not present for this check'],
}
```

---

## Seed Script Plan

Recommended top-level seed order:

1. insert restaurants
2. insert canonical guest profiles
3. insert event booking for hosted dinner scenario
4. insert checks
5. insert guest identity fragments
6. insert check events in sequence order
7. compute guest match suggestions
8. compute derived state for each check
9. insert exceptions
10. insert support cases
11. insert audit logs

### Seed implementation strategy
Use one orchestration file:

```text
scripts/seed.ts
```

That file should:
- clear tables in safe order
- insert reference data
- call scenario builders
- run recompute helpers
- print a small summary at end

Example output:
- `Seeded 3 restaurants`
- `Seeded 8 guest profiles`
- `Seeded 10 checks`
- `Seeded 74 events`
- `Seeded 11 active exceptions`

---

## Validation and Assertions

After seeding, Codex should run validations.

### Suggested assertions
- every `check_events` set starts at `sequence_no = 1`
- every `check_events` set is gap-free or at least strictly increasing
- every check has one `derived_check_state` row
- every check with `exception_state != none` has at least one open exception
- no `guest_match_suggestions` exist for nonexistent fragments
- duplicate charge scenario has at least one open support case
- happy path has no open exceptions
- hosted event check links to `event_bookings`

### Optional development check
Generate a JSON debug file summarizing all seeded checks and expected states. This is useful for testing the reducer.

---

## Recommended Scenario IDs

Use stable IDs because they are useful in routing, filters, and demo docs.

- `SCN_HAPPY_PATH`
- `SCN_PREAUTH_CONFUSION`
- `SCN_DELAYED_RECEIPT`
- `SCN_DUPLICATE_CHARGE`
- `SCN_PAYER_MISMATCH`
- `SCN_NETWORK_FALLBACK`
- `SCN_VIP_NOT_LINKED`
- `SCN_HOSTED_EVENT`

Optional extra calm scenarios:
- `SCN_BAR_TAB_NORMAL`
- `SCN_CHECK_REOPENED_AFTER_CLOSE`

---

## Implementation Notes for Codex

### 1. Keep event builders ergonomic
Create helpers like:

```ts
makeEvent(checkId, sequenceNo, eventType, overrides)
```

This avoids messy seed boilerplate.

### 2. Keep scenario data declarative
Prefer a structure like:

```ts
{
  scenarioId: 'SCN_DELAYED_RECEIPT',
  check: {...},
  fragments: [...],
  events: [...],
  expected: {...},
}
```

This makes testing and replay easier.

### 3. Separate scenario expectation from persistence shape
Seed objects should include:
- domain input
- expected derived state
- expected exception list

That makes regression testing much easier.

### 4. Normalize phones during seeding
For fragments, intentionally include raw variants but normalize canonical guest profile phones.

Examples:
- canonical: `+19175550131`
- fragment raw: `917-555-0131`
- fragment raw: `(917) 555-0131`

### 5. Use cents everywhere
Do not use floating-point money.

### 6. Build one source-of-truth event map
Have a single mapping from `event_type -> event_group` to avoid inconsistent seeding.

---

## Known Simplifications

These are acceptable for the prototype.

- no real payment processor integration
- no real POS integration
- no background jobs
- derived state can be recomputed synchronously in dev
- support exports can be generated server-side from DB records without a job queue
- identity matching can be rules-based and deterministic
- event booking support can be minimal and mostly used for seed/demo credibility

---

## Appendix A: Example Seed Object Shape

```ts
export const delayedReceiptScenario = {
  scenarioId: 'SCN_DELAYED_RECEIPT',
  restaurantSlug: 'sable-nyc',
  check: {
    externalCheckRef: 'CHK-SBL-20260328-015',
    tableLabel: '15',
    serviceChannel: 'table_service',
    partySize: 2,
    subtotalAmountCents: 6700,
    taxAmountCents: 600,
    tipAmountCents: 1400,
    totalAmountCents: 8700,
    openedAt: '2026-03-28T19:12:00-04:00',
  },
  fragments: [
    {
      sourceSystem: 'mobile_app',
      externalIdentityRef: 'acct_leah_01',
      rawName: 'Leah Kim',
      rawPhone: '(646) 555-0172',
      rawEmail: 'leah.kim@example.com',
    },
  ],
  events: [
    { type: 'check_created', occurredAt: '2026-03-28T19:12:00-04:00' },
    { type: 'check_opened', occurredAt: '2026-03-28T19:13:00-04:00' },
    { type: 'guest_checkin_detected', occurredAt: '2026-03-28T19:15:00-04:00' },
    { type: 'items_synced', occurredAt: '2026-03-28T19:58:00-04:00' },
    { type: 'payment_method_attached', occurredAt: '2026-03-28T19:59:00-04:00' },
    { type: 'payment_authorization_requested', occurredAt: '2026-03-28T20:00:00-04:00' },
    { type: 'payment_authorized', occurredAt: '2026-03-28T20:00:04-04:00' },
    { type: 'payment_capture_requested', occurredAt: '2026-03-28T20:01:00-04:00' },
    { type: 'payment_captured', occurredAt: '2026-03-28T20:01:05-04:00' },
    { type: 'receipt_itemization_unavailable', occurredAt: '2026-03-28T20:02:00-04:00' },
    { type: 'final_receipt_missing_timeout', occurredAt: '2026-03-28T20:20:00-04:00' },
    { type: 'rewards_eligibility_confirmed', occurredAt: '2026-03-28T20:21:00-04:00' },
  ],
  expected: {
    paymentState: 'captured',
    receiptState: 'missing_after_timeout',
    rewardsState: 'awaiting_final_receipt',
    identityState: 'linked_confident',
    exceptionState: 'action_required',
    serviceState: 'awaiting_backend_completion',
    exceptions: [
      'final_receipt_missing_after_timeout',
      'receipt_itemization_unavailable',
      'rewards_waiting_on_final_receipt',
    ],
  },
};
```

---

## Appendix B: Scenario-to-Exception Matrix

| Scenario ID | Expected Active Exceptions |
|---|---|
| `SCN_HAPPY_PATH` | none |
| `SCN_PREAUTH_CONFUSION` | `stale_preauth_visibility` |
| `SCN_DELAYED_RECEIPT` | `final_receipt_missing_after_timeout`, `receipt_itemization_unavailable`, `rewards_waiting_on_final_receipt` |
| `SCN_DUPLICATE_CHARGE` | `duplicate_charge_suspected`, optional `capture_succeeded_close_missing` |
| `SCN_PAYER_MISMATCH` | `payer_reservation_mismatch`, optional `multiple_plausible_guest_matches` |
| `SCN_NETWORK_FALLBACK` | `network_degraded_during_payment`, `terminal_offline_during_close`, optional `manual_override_without_note` |
| `SCN_VIP_NOT_LINKED` | `vip_profile_not_linked`, `low_confidence_guest_assignment` |
| `SCN_HOSTED_EVENT` | none or one low-severity identity-related warning depending on seed choice |

---

## Appendix C: Suggested Sample Names and Values

### Example external check refs
- `CHK-SBL-20260328-012`
- `CHK-SBL-20260328-015`
- `CHK-NLB-20260328-004`
- `CHK-ORE-20260329-001`

### Example correlation IDs
- `corr_chk_015_close`
- `corr_chk_004_retry_capture`

### Example payment aliases
- `card_4242`
- `card_1881`
- `card_9027`
- `wallet_8841`

### Example receipt refs
- `rcpt_sbl_015`
- `rcpt_nlb_004`

### Example support summaries
- `Guest reports two charges visible; check timeline indicates one capture and one active hold.`
- `Payment captured successfully, but final receipt has not been ingested, so rewards remain pending.`

---

This file should be enough for Codex to implement the data layer and seed engine without inventing core domain structure on its own.
