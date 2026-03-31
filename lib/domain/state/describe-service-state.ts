import type { BookingStatus, DepositState, ServiceState } from "@/lib/db/schema";

function humanizeState(value: string) {
  return value.replaceAll("_", " ");
}

export function describeServiceState(input: {
  serviceState?: ServiceState | null;
  bookingStatus?: BookingStatus | null;
  depositState?: DepositState | null;
}) {
  if (!input.serviceState) {
    return {
      label: "unknown",
      detail: undefined,
    };
  }

  if (
    input.serviceState === "awaiting_backend_completion" &&
    input.bookingStatus === "cancelled" &&
    input.depositState === "refund_pending"
  ) {
    return {
      label: "refund follow-through pending",
      detail: "Manager triage is complete; refund/backoffice follow-through is still pending.",
    };
  }

  return {
    label: humanizeState(input.serviceState),
    detail: undefined,
  };
}
