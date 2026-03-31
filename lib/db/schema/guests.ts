import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { checks } from "./checks";
import { matchBandEnum, matchStatusEnum, sourceSystemEnum } from "./enums";

export const guestProfiles = pgTable(
  "guest_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    displayName: text("display_name").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    phoneNormalized: text("phone_normalized"),
    emailNormalized: text("email_normalized"),
    vipTier: text("vip_tier"),
    guestValueScore: integer("guest_value_score"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    phoneIdx: index("guest_profiles_phone_idx").on(table.phoneNormalized),
    emailIdx: index("guest_profiles_email_idx").on(table.emailNormalized),
    nameIdx: index("guest_profiles_name_idx").on(table.lastName, table.firstName),
  }),
);

export const guestIdentityFragments = pgTable(
  "guest_identity_fragments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestProfileId: uuid("guest_profile_id").references(() => guestProfiles.id),
    checkId: uuid("check_id").references(() => checks.id),
    sourceSystem: sourceSystemEnum("source_system").notNull(),
    externalIdentityRef: text("external_identity_ref").notNull(),
    rawName: text("raw_name"),
    rawPhone: text("raw_phone"),
    rawEmail: text("raw_email"),
    paymentAlias: text("payment_alias"),
    reservationRef: text("reservation_ref"),
    deviceRef: text("device_ref"),
    metadataJson: jsonb("metadata_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    checkSourceIdx: index("guest_identity_fragments_check_source_idx").on(
      table.checkId,
      table.sourceSystem,
    ),
    guestProfileIdx: index("guest_identity_fragments_guest_profile_idx").on(
      table.guestProfileId,
    ),
    externalRefIdx: index("guest_identity_fragments_external_ref_idx").on(
      table.externalIdentityRef,
    ),
    paymentAliasIdx: index("guest_identity_fragments_payment_alias_idx").on(
      table.paymentAlias,
    ),
    reservationIdx: index("guest_identity_fragments_reservation_idx").on(
      table.reservationRef,
    ),
  }),
);

export const guestMatchSuggestions = pgTable(
  "guest_match_suggestions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    checkId: uuid("check_id")
      .notNull()
      .references(() => checks.id),
    fragmentId: uuid("fragment_id")
      .notNull()
      .references(() => guestIdentityFragments.id),
    candidateGuestId: uuid("candidate_guest_id")
      .notNull()
      .references(() => guestProfiles.id),
    confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }).notNull(),
    matchBand: matchBandEnum("match_band").notNull(),
    reasonsJson: jsonb("reasons_json").$type<string[]>().notNull().default([]),
    conflictsJson: jsonb("conflicts_json").$type<string[]>().notNull().default([]),
    suggestedAction: text("suggested_action").notNull(),
    status: matchStatusEnum("status").notNull().default("suggested"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    checkStatusIdx: index("guest_match_suggestions_check_status_idx").on(
      table.checkId,
      table.status,
    ),
    fragmentStatusIdx: index("guest_match_suggestions_fragment_status_idx").on(
      table.fragmentId,
      table.status,
    ),
    candidateIdx: index("guest_match_suggestions_candidate_idx").on(
      table.candidateGuestId,
    ),
    confidenceBounds: check(
      "guest_match_suggestions_confidence_bounds",
      sql`${table.confidenceScore} >= 0 and ${table.confidenceScore} <= 1`,
    ),
  }),
);
