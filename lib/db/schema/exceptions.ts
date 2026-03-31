import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { checks } from "./checks";
import {
  exceptionSeverityEnum,
  exceptionStatusEnum,
  exceptionTypeEnum,
  roleTypeEnum,
} from "./enums";
import { checkEvents } from "./events";

export const exceptions = pgTable(
  "exceptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    checkId: uuid("check_id")
      .notNull()
      .references(() => checks.id),
    exceptionType: exceptionTypeEnum("exception_type").notNull(),
    severity: exceptionSeverityEnum("severity").notNull(),
    status: exceptionStatusEnum("status").notNull().default("open"),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    assignedRole: roleTypeEnum("assigned_role"),
    assignedUser: text("assigned_user"),
    explanationText: text("explanation_text").notNull(),
    recommendedNextAction: text("recommended_next_action").notNull(),
    recommendedOwner: roleTypeEnum("recommended_owner"),
    resolutionText: text("resolution_text"),
    sourceEventId: uuid("source_event_id").references(() => checkEvents.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    statusSeverityDetectedIdx: index("exceptions_status_severity_detected_idx").on(
      table.status,
      table.severity,
      table.detectedAt,
    ),
    checkStatusIdx: index("exceptions_check_status_idx").on(table.checkId, table.status),
    typeIdx: index("exceptions_type_idx").on(table.exceptionType),
    assignedRoleIdx: index("exceptions_assigned_role_idx").on(table.assignedRole),
  }),
);
