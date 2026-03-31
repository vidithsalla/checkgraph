import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

export async function loadActiveExceptions() {
  const rows = await db
    .select({
      exception: schema.exceptions,
      check: schema.checks,
      restaurant: schema.restaurants,
    })
    .from(schema.exceptions)
    .innerJoin(schema.checks, eq(schema.exceptions.checkId, schema.checks.id))
    .innerJoin(schema.restaurants, eq(schema.checks.restaurantId, schema.restaurants.id))
    .where(inArray(schema.exceptions.status, ["open", "acknowledged"]))
    .orderBy(desc(schema.exceptions.detectedAt));

  return rows.map((row) => ({
    checkId: row.check.externalCheckRef,
    checkDbId: row.check.id,
    externalCheckRef: row.check.externalCheckRef,
    scenarioId: row.check.scenarioId ?? "synthetic",
    restaurantName: row.restaurant.name,
    tableLabel: row.check.tableLabel ?? row.check.serviceChannel,
    totalAmountCents: row.check.totalAmountCents,
    severity: row.exception.severity,
    type: row.exception.exceptionType,
    recommendedOwner: row.exception.recommendedOwner ?? "manager",
    detectedAt: row.exception.detectedAt.toISOString(),
    explanationText: row.exception.explanationText,
  }));
}
