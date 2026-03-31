import type { CanonicalSeedScenario } from "./types";

export const cancelledBookingActiveDepositScenario: CanonicalSeedScenario = {
  scenarioId: "SCN_BOOKING_CANCELLED_ACTIVE_DEPOSIT",
  title: "Cancelled Booking With Active Deposit",
  purpose:
    "Show the operational failure mode where a booking is cancelled after deposit capture and the deposit outcome still needs resolution.",
  restaurantSlug: "olive-room-events",
  booking: {
    bookingRef: "BK-ORE-20260331-303",
    bookingType: "hosted_event",
    bookingName: "Northstar Board Dinner",
    status: "cancelled",
    organizerGuestRef: "rachel-morgan",
    payerGuestRef: "jonathan-reed",
    reservationGuestRef: "rachel-morgan",
    depositAmountCents: 50000,
    hostedAmountCents: 0,
    partySize: 12,
    eventDate: "2026-03-31T19:00:00-04:00",
    notes: "Cancelled after deposit capture; payer still owns the deposit outcome.",
  },
  deposit: {
    depositRef: "dep_ore_303",
    depositType: "event_deposit",
    state: "captured",
    amountCents: 50000,
    appliedAmountCents: 0,
    refundableAmountCents: 50000,
    fundingOwnerGuestRef: "jonathan-reed",
    captureRef: "cap_dep_ore_303",
  },
  check: {
    externalCheckRef: "CHK-ORE-20260331-033",
    tableLabel: "CANCELLED-1",
    serviceChannel: "hosted_event",
    partySize: 12,
    subtotalAmountCents: 0,
    taxAmountCents: 0,
    tipAmountCents: 0,
    totalAmountCents: 0,
    openedAt: "2026-03-28T10:00:00-04:00",
  },
  primaryGuestKey: "jonathan-reed",
  payerGuestKey: "jonathan-reed",
  reservationGuestKey: "rachel-morgan",
  fragments: [
    {
      sourceSystem: "identity_service",
      externalIdentityRef: "booking_northstar_303",
      rawName: "Rachel Morgan",
      rawEmail: "rachel.morgan@northstar.com",
      guestKey: "rachel-morgan",
      metadata: {
        roleHint: "reservation",
      },
    },
    {
      sourceSystem: "terminal",
      externalIdentityRef: "cancelled_payer_303",
      rawName: "Jonathan Reed",
      paymentAlias: "card_1881",
      guestKey: "jonathan-reed",
      metadata: {
        roleHint: "payer",
      },
    },
  ],
  events: [
    { type: "check_created", occurredAt: "2026-03-28T10:00:00-04:00" },
    {
      type: "booking_attached",
      occurredAt: "2026-03-28T10:00:05-04:00",
      payload: {
        bookingRef: "BK-ORE-20260331-303",
      },
    },
    {
      type: "organizer_attached",
      occurredAt: "2026-03-28T10:00:10-04:00",
      payload: {
        bookingRef: "BK-ORE-20260331-303",
      },
    },
    {
      type: "reservation_holder_attached",
      occurredAt: "2026-03-28T10:00:15-04:00",
      payload: {
        bookingRef: "BK-ORE-20260331-303",
      },
    },
    {
      type: "payer_attached",
      occurredAt: "2026-03-28T10:00:20-04:00",
      payload: {
        bookingRef: "BK-ORE-20260331-303",
      },
    },
    {
      type: "deposit_requested",
      occurredAt: "2026-03-25T14:00:00-04:00",
      payload: {
        depositRef: "dep_ore_303",
        depositType: "event_deposit",
        amountCents: 50000,
      },
    },
    {
      type: "deposit_captured",
      occurredAt: "2026-03-25T14:05:00-04:00",
      payload: {
        depositRef: "dep_ore_303",
        depositType: "event_deposit",
        amountCents: 50000,
        captureRef: "cap_dep_ore_303",
      },
    },
    {
      type: "booking_cancelled",
      occurredAt: "2026-03-27T11:30:00-04:00",
      payload: {
        bookingRef: "BK-ORE-20260331-303",
        reason: "Organizer cancelled the event before service.",
        cancelledBy: "organizer",
      },
    },
  ],
  expected: {
    paymentState: "not_started",
    receiptState: "not_available",
    rewardsState: "not_eligible",
    identityState: "linked_confident",
    bookingState: "cancelled",
    depositState: "captured",
    hostedSettlementState: "none",
    roleResolutionState: "resolved_with_split",
    depositAmountCents: 50000,
    depositAppliedAmountCents: 0,
    hostedAmountCents: 0,
    hostedAppliedAmountCents: 0,
    remainingBalanceCents: 0,
    directPaymentDueCents: 0,
    exceptionState: "action_required",
    serviceState: "awaiting_staff_action",
    exceptions: ["booking_cancelled_with_active_deposit"],
    nextActionOwner: "manager",
    nextActionText:
      "Mark the captured deposit for refund because the booking was cancelled before the deposit outcome was resolved.",
  },
};
