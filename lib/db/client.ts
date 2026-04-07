import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@127.0.0.1:5432/checkgraph_dev";

const globalForDb = globalThis as typeof globalThis & {
  __checkgraphSql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDb.__checkgraphSql ??
  postgres(connectionString, {
    max: 1,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__checkgraphSql = sql;
}

export const db = drizzle(sql, { schema });

export async function closeDb() {
  await sql.end({ timeout: 1 });
}
