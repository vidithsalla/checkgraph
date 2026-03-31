import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { checks } from "./checks";
import { supportCaseStatusEnum } from "./enums";

export const supportCases = pgTable(
  "support_cases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    checkId: uuid("check_id")
      .notNull()
      .references(() => checks.id),
    status: supportCaseStatusEnum("status").notNull().default("open"),
    summary: text("summary").notNull(),
    guestVisibleSummary: text("guest_visible_summary"),
    owner: text("owner"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    checkStatusIdx: index("support_cases_check_status_idx").on(
      table.checkId,
      table.status,
    ),
  }),
);
