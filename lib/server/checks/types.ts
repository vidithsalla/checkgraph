import type { InferSelectModel } from "drizzle-orm";
import type {
  bookingDeposits,
  checkAllocations,
  auditLogs,
  checkEvents,
  checks,
  derivedCheckState,
  eventBookings,
  exceptions,
  guestIdentityFragments,
  guestMatchSuggestions,
  guestProfiles,
  restaurants,
} from "@/lib/db/schema";

export type CheckRow = InferSelectModel<typeof checks>;
export type RestaurantRow = InferSelectModel<typeof restaurants>;
export type BookingRow = InferSelectModel<typeof eventBookings>;
export type BookingDepositRow = InferSelectModel<typeof bookingDeposits>;
export type CheckAllocationRow = InferSelectModel<typeof checkAllocations>;
export type EventRow = InferSelectModel<typeof checkEvents>;
export type DerivedStateRow = InferSelectModel<typeof derivedCheckState>;
export type ExceptionRow = InferSelectModel<typeof exceptions>;
export type AuditLogRow = InferSelectModel<typeof auditLogs>;
export type GuestFragmentRow = InferSelectModel<typeof guestIdentityFragments>;
export type MatchSuggestionRow = InferSelectModel<typeof guestMatchSuggestions>;
export type GuestProfileRow = InferSelectModel<typeof guestProfiles>;

export type AssembledCheckDetail = {
  check: CheckRow;
  restaurant: RestaurantRow;
  booking: BookingRow | null;
  bookingDeposits: BookingDepositRow[];
  checkAllocations: CheckAllocationRow[];
  derivedState: DerivedStateRow | null;
  activeExceptions: ExceptionRow[];
  timeline: EventRow[];
  auditTrail: AuditLogRow[];
  fragments: GuestFragmentRow[];
  suggestions: MatchSuggestionRow[];
  guestsById: Map<string, GuestProfileRow>;
};
