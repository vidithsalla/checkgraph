import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { roleTypeEnum } from "./enums";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    actionType: text("action_type").notNull(),
    actorRole: roleTypeEnum("actor_role").notNull(),
    actorId: text("actor_id").notNull(),
    note: text("note"),
    payloadJson: jsonb("payload_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    entityCreatedIdx: index("audit_logs_entity_created_idx").on(
      table.entityType,
      table.entityId,
      table.createdAt,
    ),
  }),
);
