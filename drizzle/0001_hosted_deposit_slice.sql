ALTER TYPE "event_group" ADD VALUE IF NOT EXISTS 'booking';
ALTER TYPE "event_group" ADD VALUE IF NOT EXISTS 'deposit';
ALTER TYPE "event_group" ADD VALUE IF NOT EXISTS 'allocation';

ALTER TYPE "event_type" ADD VALUE IF NOT EXISTS 'booking_attached';
ALTER TYPE "event_type" ADD VALUE IF NOT EXISTS 'organizer_attached';
ALTER TYPE "event_type" ADD VALUE IF NOT EXISTS 'reservation_holder_attached';
ALTER TYPE "event_type" ADD VALUE IF NOT EXISTS 'payer_attached';
ALTER TYPE "event_type" ADD VALUE IF NOT EXISTS 'deposit_requested';
ALTER TYPE "event_type" ADD VALUE IF NOT EXISTS 'deposit_hold_placed';
ALTER TYPE "event_type" ADD VALUE IF NOT EXISTS 'deposit_captured';
ALTER TYPE "event_type" ADD VALUE IF NOT EXISTS 'deposit_applied_to_check';

ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'deposit_captured_not_applied';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'deposit_hold_stale';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'deposit_refund_missing';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'deposit_refunded_after_application';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'deposit_state_unknown';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'hosted_amount_missing_for_booking';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'hosted_amount_exceeds_check';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'hosted_settlement_mismatch';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'remaining_balance_incorrect';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'booking_cancelled_with_active_deposit';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'organizer_payer_mismatch';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'reservation_organizer_mismatch';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'hosted_benefit_linked_to_wrong_guest';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'unresolved_role_assignment';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'guest_visible_hold_plus_final_charge';
ALTER TYPE "exception_type" ADD VALUE IF NOT EXISTS 'deposit_application_not_reflected_in_receipt';

ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'deposit_held';
ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'deposit_captured';
ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'modified';

DO $$
BEGIN
    CREATE TYPE "booking_state" AS ENUM ('none', 'attached', 'modified', 'cancelled', 'settled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "deposit_type" AS ENUM (
      'reservation_hold',
      'event_deposit',
      'minimum_spend_deposit',
      'vip_guarantee_hold'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "deposit_state" AS ENUM (
      'none',
      'requested',
      'hold_active',
      'captured',
      'partially_applied',
      'fully_applied',
      'refund_pending',
      'refunded',
      'unknown'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "hosted_settlement_state" AS ENUM (
      'none',
      'hosted_pending',
      'partially_hosted',
      'fully_hosted',
      'settlement_mismatch',
      'settled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "allocation_type" AS ENUM ('deposit', 'hosted_credit', 'manual_credit');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "funding_source_type" AS ENUM (
      'guest_direct_payment',
      'captured_deposit',
      'hosted_credit',
      'house_account',
      'manual_adjustment'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "role_resolution_state" AS ENUM (
      'fully_resolved',
      'resolved_with_split',
      'ambiguous',
      'mismatch_flagged'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "event_bookings" ADD COLUMN IF NOT EXISTS "booking_ref" text;
UPDATE "event_bookings"
SET "booking_ref" = COALESCE("booking_ref", 'booking-' || "id"::text)
WHERE "booking_ref" IS NULL;
ALTER TABLE "event_bookings" ALTER COLUMN "booking_ref" SET NOT NULL;
ALTER TABLE "event_bookings" ADD COLUMN IF NOT EXISTS "reservation_guest_id" uuid REFERENCES "guest_profiles"("id");
ALTER TABLE "event_bookings" ADD COLUMN IF NOT EXISTS "hosted_amount_cents" integer DEFAULT 0;
UPDATE "event_bookings"
SET "hosted_amount_cents" = COALESCE("hosted_amount_cents", 0)
WHERE "hosted_amount_cents" IS NULL;
ALTER TABLE "event_bookings" ALTER COLUMN "hosted_amount_cents" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "event_bookings_booking_ref_idx" ON "event_bookings" ("booking_ref");

DO $$
BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'event_bookings_hosted_non_negative'
    ) THEN
      ALTER TABLE "event_bookings"
      ADD CONSTRAINT "event_bookings_hosted_non_negative"
      CHECK ("hosted_amount_cents" >= 0);
    END IF;
END $$;

ALTER TABLE "checks" ADD COLUMN IF NOT EXISTS "is_hosted" integer DEFAULT 0;
UPDATE "checks"
SET "is_hosted" = CASE WHEN "service_channel" = 'hosted_event' THEN 1 ELSE 0 END
WHERE "is_hosted" IS NULL;
ALTER TABLE "checks" ALTER COLUMN "is_hosted" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "booking_deposits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_booking_id" uuid NOT NULL REFERENCES "event_bookings"("id"),
  "deposit_ref" text NOT NULL UNIQUE,
  "deposit_type" "deposit_type" NOT NULL,
  "state" "deposit_state" NOT NULL,
  "amount_cents" integer NOT NULL,
  "applied_amount_cents" integer NOT NULL DEFAULT 0,
  "refundable_amount_cents" integer NOT NULL DEFAULT 0,
  "funding_owner_guest_id" uuid REFERENCES "guest_profiles"("id"),
  "capture_ref" text,
  "hold_ref" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "booking_deposits_booking_idx" ON "booking_deposits" ("event_booking_id");
CREATE INDEX IF NOT EXISTS "booking_deposits_state_idx" ON "booking_deposits" ("state");

DO $$
BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'booking_deposits_amount_non_negative'
    ) THEN
      ALTER TABLE "booking_deposits"
      ADD CONSTRAINT "booking_deposits_amount_non_negative"
      CHECK ("amount_cents" >= 0);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'booking_deposits_applied_non_negative'
    ) THEN
      ALTER TABLE "booking_deposits"
      ADD CONSTRAINT "booking_deposits_applied_non_negative"
      CHECK ("applied_amount_cents" >= 0);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'booking_deposits_refundable_non_negative'
    ) THEN
      ALTER TABLE "booking_deposits"
      ADD CONSTRAINT "booking_deposits_refundable_non_negative"
      CHECK ("refundable_amount_cents" >= 0);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "check_allocations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "check_id" uuid NOT NULL REFERENCES "checks"("id"),
  "event_booking_id" uuid REFERENCES "event_bookings"("id"),
  "allocation_type" "allocation_type" NOT NULL,
  "funding_source_type" "funding_source_type" NOT NULL,
  "source_ref" text NOT NULL,
  "amount_cents" integer NOT NULL,
  "applied_by_event_id" uuid REFERENCES "check_events"("id"),
  "note" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "check_allocations_check_idx" ON "check_allocations" ("check_id");
CREATE INDEX IF NOT EXISTS "check_allocations_booking_idx" ON "check_allocations" ("event_booking_id");
CREATE INDEX IF NOT EXISTS "check_allocations_type_idx" ON "check_allocations" ("allocation_type");

DO $$
BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'check_allocations_amount_positive'
    ) THEN
      ALTER TABLE "check_allocations"
      ADD CONSTRAINT "check_allocations_amount_positive"
      CHECK ("amount_cents" > 0);
    END IF;
END $$;

ALTER TABLE "derived_check_state" ADD COLUMN IF NOT EXISTS "booking_state" "booking_state" NOT NULL DEFAULT 'none';
ALTER TABLE "derived_check_state" ADD COLUMN IF NOT EXISTS "deposit_state" "deposit_state" NOT NULL DEFAULT 'none';
ALTER TABLE "derived_check_state" ADD COLUMN IF NOT EXISTS "hosted_settlement_state" "hosted_settlement_state" NOT NULL DEFAULT 'none';
ALTER TABLE "derived_check_state" ADD COLUMN IF NOT EXISTS "role_resolution_state" "role_resolution_state";
ALTER TABLE "derived_check_state" ADD COLUMN IF NOT EXISTS "organizer_guest_id" uuid REFERENCES "guest_profiles"("id");
ALTER TABLE "derived_check_state" ADD COLUMN IF NOT EXISTS "deposit_amount_cents" integer NOT NULL DEFAULT 0;
ALTER TABLE "derived_check_state" ADD COLUMN IF NOT EXISTS "deposit_applied_amount_cents" integer NOT NULL DEFAULT 0;
ALTER TABLE "derived_check_state" ADD COLUMN IF NOT EXISTS "hosted_amount_cents" integer NOT NULL DEFAULT 0;
ALTER TABLE "derived_check_state" ADD COLUMN IF NOT EXISTS "hosted_applied_amount_cents" integer NOT NULL DEFAULT 0;
ALTER TABLE "derived_check_state" ADD COLUMN IF NOT EXISTS "remaining_balance_cents" integer NOT NULL DEFAULT 0;
ALTER TABLE "derived_check_state" ADD COLUMN IF NOT EXISTS "direct_payment_due_cents" integer NOT NULL DEFAULT 0;
ALTER TABLE "derived_check_state" ADD COLUMN IF NOT EXISTS "funding_summary_json" jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS "derived_check_state_booking_state_idx" ON "derived_check_state" ("booking_state");
CREATE INDEX IF NOT EXISTS "derived_check_state_deposit_state_idx" ON "derived_check_state" ("deposit_state");
CREATE INDEX IF NOT EXISTS "derived_check_state_hosted_settlement_state_idx" ON "derived_check_state" ("hosted_settlement_state");
