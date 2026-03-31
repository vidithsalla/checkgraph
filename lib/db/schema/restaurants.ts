import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { serviceModeEnum } from "./enums";

export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    serviceMode: serviceModeEnum("service_mode").notNull(),
    timezone: text("timezone").notNull(),
    city: text("city"),
    stateRegion: text("state_region"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugIdx: index("restaurants_slug_idx").on(table.slug),
  }),
);
