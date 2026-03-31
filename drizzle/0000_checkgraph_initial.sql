DO $$ BEGIN
 CREATE TYPE "service_mode" AS ENUM('full_service', 'quick_service', 'bar_lounge', 'private_event');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "service_channel" AS ENUM('table_service', 'bar_tab', 'counter', 'private_dining', 'hosted_event');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "payment_state" AS ENUM('not_started', 'preauthorized', 'authorization_pending', 'authorized', 'capture_pending', 'captured', 'capture_failed', 'closed', 'unknown');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "receipt_state" AS ENUM('not_available', 'pending', 'received', 'missing_after_timeout');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "rewards_state" AS ENUM('not_eligible', 'awaiting_final_receipt', 'ready_to_post', 'posting', 'posted', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "identity_state" AS ENUM('unlinked', 'linked_confident', 'linked_low_confidence', 'ambiguous', 'mismatch_flagged');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "exception_state" AS ENUM('none', 'warning', 'action_required', 'urgent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "service_state" AS ENUM('active', 'awaiting_guest_action', 'awaiting_staff_action', 'awaiting_backend_completion', 'blocked', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "event_group" AS ENUM('payment', 'receipt', 'rewards', 'identity', 'operations', 'support', 'overrides', 'lifecycle');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "event_type" AS ENUM(
  'check_created', 'check_opened', 'check_viewed_by_diner', 'items_synced', 'tip_selected',
  'split_requested', 'split_confirmed', 'payment_method_attached', 'preauth_placed',
  'preauth_released', 'payment_authorization_requested', 'payment_authorized',
  'payment_authorization_failed', 'payment_capture_requested', 'payment_captured',
  'payment_capture_failed', 'final_receipt_received', 'final_receipt_missing_timeout',
  'rewards_eligibility_confirmed', 'rewards_post_requested', 'rewards_posted',
  'rewards_post_failed', 'check_closed', 'check_reopened', 'manual_override_applied',
  'manual_override_reverted', 'support_case_created', 'support_case_resolved',
  'guest_checkin_detected', 'reservation_attached', 'payment_identity_detected',
  'identity_match_suggested', 'identity_match_confirmed', 'identity_match_rejected',
  'identity_merge_applied', 'duplicate_charge_suspected',
  'payer_reservation_mismatch_detected', 'receipt_itemization_unavailable',
  'network_degraded', 'terminal_offline', 'fallback_mode_entered', 'fallback_mode_exited'
 );
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "source_system" AS ENUM('mobile_app', 'terminal', 'pos', 'rewards_engine', 'identity_service', 'ops_console', 'support_console', 'scenario_seed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "actor_type" AS ENUM('guest', 'server', 'host', 'manager', 'support', 'system', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "role_type" AS ENUM('server', 'manager', 'support', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "exception_type" AS ENUM(
  'duplicate_charge_suspected', 'auth_succeeded_capture_missing',
  'duplicate_capture_close_missing', 'stale_preauth_visibility',
  'payment_state_unknown', 'capture_failed_after_auth', 'reopened_after_close',
  'final_receipt_missing_after_timeout', 'receipt_itemization_unavailable',
  'receipt_amount_mismatch', 'rewards_waiting_on_final_receipt',
  'rewards_failed_after_receipt', 'rewards_posted_to_ambiguous_guest',
  'payer_reservation_mismatch', 'multiple_plausible_guest_matches',
  'low_confidence_guest_assignment', 'vip_profile_not_linked',
  'network_degraded_during_payment', 'terminal_offline_during_close',
  'fallback_mode_unresolved', 'manual_override_without_note'
 );
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "exception_severity" AS ENUM('warning', 'action_required', 'urgent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "exception_status" AS ENUM('open', 'acknowledged', 'resolved', 'suppressed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "match_status" AS ENUM('suggested', 'confirmed', 'rejected', 'superseded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "match_band" AS ENUM('high', 'medium', 'low');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "support_case_status" AS ENUM('open', 'investigating', 'waiting_on_restaurant', 'waiting_on_backend', 'resolved', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "booking_type" AS ENUM('private_dinner', 'hosted_event', 'corporate_dining');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "booking_status" AS ENUM('lead', 'deposit_pending', 'deposit_paid', 'confirmed', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "restaurants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "service_mode" "service_mode" NOT NULL,
  "timezone" text NOT NULL,
  "city" text,
  "state_region" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "guest_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "display_name" text NOT NULL,
  "first_name" text,
  "last_name" text,
  "phone_normalized" text,
  "email_normalized" text,
  "vip_tier" text,
  "guest_value_score" integer,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "event_bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurant_id" uuid NOT NULL REFERENCES "restaurants"("id"),
  "booking_type" "booking_type" NOT NULL,
  "status" "booking_status" NOT NULL,
  "event_name" text NOT NULL,
  "organizer_guest_id" uuid REFERENCES "guest_profiles"("id"),
  "payer_guest_id" uuid REFERENCES "guest_profiles"("id"),
  "party_size" integer,
  "deposit_amount_cents" integer,
  "event_date" timestamptz,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "event_bookings_deposit_non_negative" CHECK ("deposit_amount_cents" >= 0)
);

CREATE TABLE IF NOT EXISTS "checks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurant_id" uuid NOT NULL REFERENCES "restaurants"("id"),
  "scenario_id" text,
  "external_check_ref" text NOT NULL UNIQUE,
  "table_label" text,
  "service_channel" "service_channel" NOT NULL,
  "status_label" text,
  "party_size" integer,
  "subtotal_amount_cents" integer NOT NULL,
  "tax_amount_cents" integer NOT NULL,
  "tip_amount_cents" integer NOT NULL DEFAULT 0,
  "total_amount_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "reservation_ref" text,
  "event_booking_id" uuid REFERENCES "event_bookings"("id"),
  "opened_at" timestamptz NOT NULL,
  "closed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "checks_total_amount_non_negative" CHECK ("total_amount_cents" >= 0),
  CONSTRAINT "checks_subtotal_amount_non_negative" CHECK ("subtotal_amount_cents" >= 0),
  CONSTRAINT "checks_tax_amount_non_negative" CHECK ("tax_amount_cents" >= 0),
  CONSTRAINT "checks_tip_amount_non_negative" CHECK ("tip_amount_cents" >= 0)
);

CREATE TABLE IF NOT EXISTS "check_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "check_id" uuid NOT NULL REFERENCES "checks"("id"),
  "sequence_no" integer NOT NULL,
  "event_type" "event_type" NOT NULL,
  "event_group" "event_group" NOT NULL,
  "occurred_at" timestamptz NOT NULL,
  "source_system" "source_system" NOT NULL,
  "actor_type" "actor_type" NOT NULL,
  "actor_id" text,
  "correlation_id" text,
  "idempotency_key" text,
  "payload_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "check_events_check_sequence_unq" UNIQUE ("check_id", "sequence_no")
);

CREATE TABLE IF NOT EXISTS "guest_identity_fragments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "guest_profile_id" uuid REFERENCES "guest_profiles"("id"),
  "check_id" uuid REFERENCES "checks"("id"),
  "source_system" "source_system" NOT NULL,
  "external_identity_ref" text NOT NULL,
  "raw_name" text,
  "raw_phone" text,
  "raw_email" text,
  "payment_alias" text,
  "reservation_ref" text,
  "device_ref" text,
  "metadata_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "guest_match_suggestions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "check_id" uuid NOT NULL REFERENCES "checks"("id"),
  "fragment_id" uuid NOT NULL REFERENCES "guest_identity_fragments"("id"),
  "candidate_guest_id" uuid NOT NULL REFERENCES "guest_profiles"("id"),
  "confidence_score" numeric(5,2) NOT NULL,
  "match_band" "match_band" NOT NULL,
  "reasons_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "conflicts_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "suggested_action" text NOT NULL,
  "status" "match_status" NOT NULL DEFAULT 'suggested',
  "reviewed_by" text,
  "reviewed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "guest_match_suggestions_confidence_bounds" CHECK ("confidence_score" >= 0 AND "confidence_score" <= 1)
);

CREATE TABLE IF NOT EXISTS "derived_check_state" (
  "check_id" uuid PRIMARY KEY REFERENCES "checks"("id"),
  "payment_state" "payment_state" NOT NULL,
  "receipt_state" "receipt_state" NOT NULL,
  "rewards_state" "rewards_state" NOT NULL,
  "identity_state" "identity_state" NOT NULL,
  "exception_state" "exception_state" NOT NULL,
  "service_state" "service_state" NOT NULL,
  "primary_guest_id" uuid REFERENCES "guest_profiles"("id"),
  "payer_guest_id" uuid REFERENCES "guest_profiles"("id"),
  "reservation_guest_id" uuid REFERENCES "guest_profiles"("id"),
  "next_action_owner" "role_type",
  "next_action_text" text,
  "active_exception_count" integer NOT NULL DEFAULT 0,
  "last_event_at" timestamptz,
  "computed_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "exceptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "check_id" uuid NOT NULL REFERENCES "checks"("id"),
  "exception_type" "exception_type" NOT NULL,
  "severity" "exception_severity" NOT NULL,
  "status" "exception_status" NOT NULL DEFAULT 'open',
  "detected_at" timestamptz NOT NULL,
  "resolved_at" timestamptz,
  "assigned_role" "role_type",
  "assigned_user" text,
  "explanation_text" text NOT NULL,
  "recommended_next_action" text NOT NULL,
  "recommended_owner" "role_type",
  "resolution_text" text,
  "source_event_id" uuid REFERENCES "check_events"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "support_cases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "check_id" uuid NOT NULL REFERENCES "checks"("id"),
  "status" "support_case_status" NOT NULL DEFAULT 'open',
  "summary" text NOT NULL,
  "guest_visible_summary" text,
  "owner" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "resolved_at" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_type" text NOT NULL,
  "entity_id" uuid NOT NULL,
  "action_type" text NOT NULL,
  "actor_role" "role_type" NOT NULL,
  "actor_id" text NOT NULL,
  "note" text,
  "payload_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "restaurants_slug_idx" ON "restaurants" ("slug");
CREATE INDEX IF NOT EXISTS "checks_restaurant_opened_idx" ON "checks" ("restaurant_id", "opened_at");
CREATE INDEX IF NOT EXISTS "checks_scenario_idx" ON "checks" ("scenario_id");
CREATE INDEX IF NOT EXISTS "checks_booking_idx" ON "checks" ("event_booking_id");
CREATE INDEX IF NOT EXISTS "check_events_check_occurred_idx" ON "check_events" ("check_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "check_events_check_type_idx" ON "check_events" ("check_id", "event_type");
CREATE INDEX IF NOT EXISTS "check_events_correlation_idx" ON "check_events" ("correlation_id");
CREATE INDEX IF NOT EXISTS "guest_profiles_phone_idx" ON "guest_profiles" ("phone_normalized");
CREATE INDEX IF NOT EXISTS "guest_profiles_email_idx" ON "guest_profiles" ("email_normalized");
CREATE INDEX IF NOT EXISTS "guest_profiles_name_idx" ON "guest_profiles" ("last_name", "first_name");
CREATE INDEX IF NOT EXISTS "guest_identity_fragments_check_source_idx" ON "guest_identity_fragments" ("check_id", "source_system");
CREATE INDEX IF NOT EXISTS "guest_identity_fragments_guest_profile_idx" ON "guest_identity_fragments" ("guest_profile_id");
CREATE INDEX IF NOT EXISTS "guest_identity_fragments_external_ref_idx" ON "guest_identity_fragments" ("external_identity_ref");
CREATE INDEX IF NOT EXISTS "guest_identity_fragments_payment_alias_idx" ON "guest_identity_fragments" ("payment_alias");
CREATE INDEX IF NOT EXISTS "guest_identity_fragments_reservation_idx" ON "guest_identity_fragments" ("reservation_ref");
CREATE INDEX IF NOT EXISTS "guest_match_suggestions_check_status_idx" ON "guest_match_suggestions" ("check_id", "status");
CREATE INDEX IF NOT EXISTS "guest_match_suggestions_fragment_status_idx" ON "guest_match_suggestions" ("fragment_id", "status");
CREATE INDEX IF NOT EXISTS "guest_match_suggestions_candidate_idx" ON "guest_match_suggestions" ("candidate_guest_id");
CREATE INDEX IF NOT EXISTS "derived_check_state_exception_state_idx" ON "derived_check_state" ("exception_state");
CREATE INDEX IF NOT EXISTS "derived_check_state_payment_state_idx" ON "derived_check_state" ("payment_state");
CREATE INDEX IF NOT EXISTS "derived_check_state_identity_state_idx" ON "derived_check_state" ("identity_state");
CREATE INDEX IF NOT EXISTS "derived_check_state_last_event_idx" ON "derived_check_state" ("last_event_at");
CREATE INDEX IF NOT EXISTS "exceptions_status_severity_detected_idx" ON "exceptions" ("status", "severity", "detected_at");
CREATE INDEX IF NOT EXISTS "exceptions_check_status_idx" ON "exceptions" ("check_id", "status");
CREATE INDEX IF NOT EXISTS "exceptions_type_idx" ON "exceptions" ("exception_type");
CREATE INDEX IF NOT EXISTS "exceptions_assigned_role_idx" ON "exceptions" ("assigned_role");
CREATE INDEX IF NOT EXISTS "support_cases_check_status_idx" ON "support_cases" ("check_id", "status");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_created_idx" ON "audit_logs" ("entity_type", "entity_id", "created_at");
