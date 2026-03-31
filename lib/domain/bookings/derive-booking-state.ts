import type { BookingState } from "@/lib/db/schema";
import type { DomainBookingContext } from "@/lib/domain/types";

export function deriveBookingState(booking?: DomainBookingContext): BookingState {
  if (!booking) {
    return "none";
  }

  if (booking.status === "cancelled") {
    return "cancelled";
  }

  if (booking.status === "modified") {
    return "modified";
  }

  if (booking.status === "completed") {
    return "settled";
  }

  return "attached";
}
