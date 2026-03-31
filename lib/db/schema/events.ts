import { index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { checks } from "./checks";
import {
  actorTypeEnum,
  eventGroupEnum,
  eventTypeEnum,
  sourceSystemEnum,
} from "./enums";

export const checkEvents = pgTable(
  "check_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    checkId: uuid("check_id")
      .notNull()
      .references(() => checks.id),
    sequenceNo: integer("sequence_no").notNull(),
    eventType: eventTypeEnum("event_type").notNull(),
    eventGroup: eventGroupEnum("event_group").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    sourceSystem: sourceSystemEnum("source_system").notNull(),
    actorType: actorTypeEnum("actor_type").notNull(),
    actorId: text("actor_id"),
    correlationId: text("correlation_id"),
    idempotencyKey: text("idempotency_key"),
    payloadJson: jsonb("payload_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    checkOccurredIdx: index("check_events_check_occurred_idx").on(
      table.checkId,
      table.occurredAt,
    ),
    checkEventTypeIdx: index("check_events_check_type_idx").on(
      table.checkId,
      table.eventType,
    ),
    correlationIdx: index("check_events_correlation_idx").on(table.correlationId),
    uniqueSequence: unique("check_events_check_sequence_unq").on(
      table.checkId,
      table.sequenceNo,
    ),
  }),
);
