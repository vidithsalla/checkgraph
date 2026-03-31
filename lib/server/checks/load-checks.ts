import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

export async function loadChecksOverview() {
  const rows = await db
    .select({
      check: schema.checks,
      restaurant: schema.restaurants,
      derivedState: schema.derivedCheckState,
    })
    .from(schema.checks)
    .innerJoin(schema.restaurants, eq(schema.checks.restaurantId, schema.restaurants.id))
    .leftJoin(schema.derivedCheckState, eq(schema.derivedCheckState.checkId, schema.checks.id))
    .orderBy(desc(schema.checks.openedAt));

  return rows.map((row) => ({
    id: row.check.externalCheckRef,
    dbId: row.check.id,
    scenarioId: row.check.scenarioId,
    restaurantName: row.restaurant.name,
    tableLabel: row.check.tableLabel ?? row.check.serviceChannel,
    totalAmountCents: row.check.totalAmountCents,
    derivedState: row.derivedState,
  }));
}
