import { and, eq, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";
import type {
  BookingRow,
  BookingDepositRow,
  CheckRow,
  DerivedStateRow,
} from "@/lib/server/checks/types";

type DbLike = PostgresJsDatabase<typeof schema>;
type PrototypeRole = "server" | "manager" | "support" | "admin";

const prototypeRoleValues = new Set<PrototypeRole>(["server", "manager", "support", "admin"]);
const prototypeActorIds = {
  server: "sam.server@checkgraph.dev",
  manager: "marina.manager@checkgraph.dev",
  support: "sasha.support@checkgraph.dev",
  admin: "adrian.admin@checkgraph.dev",
} as const;

export function getPrototypeRole(): PrototypeRole {
  const role = process.env.CHECKGRAPH_PROTOTYPE_ROLE ?? "manager";
  return prototypeRoleValues.has(role as PrototypeRole) ? (role as PrototypeRole) : "manager";
}

export function assertPrototypeRole(allowedRoles: PrototypeRole[]): PrototypeRole {
  const currentRole = getPrototypeRole();

  if (!allowedRoles.includes(currentRole)) {
    throw new Error(
      `Role ${currentRole} cannot perform this action in the current prototype configuration.`,
    );
  }

  return currentRole;
}

export function assertPrototypeActor(
  allowedRoles: PrototypeRole[],
): {
  actorRole: PrototypeRole;
  actorId: (typeof prototypeActorIds)[PrototypeRole];
} {
  const actorRole = assertPrototypeRole(allowedRoles);

  return {
    actorRole,
    actorId: prototypeActorIds[actorRole],
  };
}

export async function loadWriteSnapshot(db: DbLike, checkId: string): Promise<{
  check: CheckRow;
  derivedState: DerivedStateRow | null;
  booking: BookingRow | null;
  deposits: BookingDepositRow[];
  activeExceptionTypes: Set<string>;
  eventTypes: Set<string>;
}> {
  const [checkWithState] = await db
    .select({
      check: schema.checks,
      derivedState: schema.derivedCheckState,
    })
    .from(schema.checks)
    .leftJoin(schema.derivedCheckState, eq(schema.derivedCheckState.checkId, schema.checks.id))
    .where(eq(schema.checks.id, checkId))
    .limit(1);

  if (!checkWithState) {
    throw new Error(`Check not found: ${checkId}`);
  }

  const [booking, deposits, activeExceptions, events] = await Promise.all([
    checkWithState.check.eventBookingId
      ? db
          .select()
          .from(schema.eventBookings)
          .where(eq(schema.eventBookings.id, checkWithState.check.eventBookingId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    checkWithState.check.eventBookingId
      ? db
          .select()
          .from(schema.bookingDeposits)
          .where(eq(schema.bookingDeposits.eventBookingId, checkWithState.check.eventBookingId))
      : Promise.resolve([]),
    db
      .select({
        exceptionType: schema.exceptions.exceptionType,
      })
      .from(schema.exceptions)
      .where(
        and(
          eq(schema.exceptions.checkId, checkId),
          inArray(schema.exceptions.status, ["open", "acknowledged"]),
        ),
      ),
    db
      .select({
        eventType: schema.checkEvents.eventType,
      })
      .from(schema.checkEvents)
      .where(eq(schema.checkEvents.checkId, checkId)),
  ]);

  return {
    check: checkWithState.check,
    derivedState: checkWithState.derivedState,
    booking,
    deposits,
    activeExceptionTypes: new Set(activeExceptions.map((row) => row.exceptionType)),
    eventTypes: new Set(events.map((row) => row.eventType)),
  };
}
