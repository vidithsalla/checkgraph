import type { CanonicalSeedScenario } from "./types";

export const hostedDepositUnappliedScenario: CanonicalSeedScenario = {
  scenarioId: "SCN_HOSTED_DEPOSIT_UNAPPLIED",
  title: "Hosted Deposit Captured But Not Applied",
  purpose:
    "Show the key Phase 2 failure mode where deposit money exists but the final check still appears fully due.",
  restaurantSlug: "olive-room-events",
  booking: {
    bookingRef: "BK-ORE-20260330-101",
    bookingType: "hosted_event",
    bookingName: "BrightTable Client Dinner",
    status: "confirmed",
    organizerGuestRef: "rachel-morgan",
    payerGuestRef: "jonathan-reed",
    reservationGuestRef: "rachel-morgan",
    depositAmountCents: 50000,
    hostedAmountCents: 0,
    partySize: 10,
    eventDate: "2026-03-30T19:30:00-04:00",
    notes: "Organizer and payer differ by design for hosted deposit reconciliation.",
  },
  deposit: {
    depositRef: "dep_ore_101",
    depositType: "event_deposit",
    state: "captured",
    amountCents: 50000,
    appliedAmountCents: 0,
    refundableAmountCents: 50000,
    fundingOwnerGuestRef: "jonathan-reed",
    captureRef: "cap_dep_ore_101",
  },
  check: {
    externalCheckRef: "CHK-ORE-20260330-011",
    tableLabel: "PRIVATE-1",
    serviceChannel: "hosted_event",
    partySize: 10,
    subtotalAmountCents: 128000,
    taxAmountCents: 11360,
    tipAmountCents: 24000,
    totalAmountCents: 163360,
    openedAt: "2026-03-30T21:05:00-04:00",
  },
  primaryGuestKey: "jonathan-reed",
  payerGuestKey: "jonathan-reed",
  reservationGuestKey: "rachel-morgan",
  fragments: [
    {
      sourceSystem: "identity_service",
      externalIdentityRef: "booking_brighttable_101",
      rawName: "Rachel Morgan",
      rawEmail: "rachel.morgan@brighttable.com",
      guestKey: "rachel-morgan",
      metadata: {
        roleHint: "reservation",
      },
    },
    {
      sourceSystem: "terminal",
      externalIdentityRef: "hosted_payer_101",
      rawName: "Jonathan Reed",
      paymentAlias: "card_1881",
      guestKey: "jonathan-reed",
      metadata: {
        roleHint: "payer",
      },
    },
  ],
  events: [
    { type: "check_created", occurredAt: "2026-03-30T21:05:00-04:00" },
    {
      type: "booking_attached",
      occurredAt: "2026-03-30T21:05:10-04:00",
      payload: {
        bookingRef: "BK-ORE-20260330-101",
      },
    },
    {
      type: "organizer_attached",
      occurredAt: "2026-03-30T21:05:15-04:00",
      payload: {
        bookingRef: "BK-ORE-20260330-101",
      },
    },
    {
      type: "reservation_holder_attached",
      occurredAt: "2026-03-30T21:05:20-04:00",
      payload: {
        bookingRef: "BK-ORE-20260330-101",
      },
    },
    {
      type: "payer_attached",
      occurredAt: "2026-03-30T21:05:25-04:00",
      payload: {
        bookingRef: "BK-ORE-20260330-101",
      },
    },
    {
      type: "deposit_requested",
      occurredAt: "2026-03-29T10:00:00-04:00",
      payload: {
        depositRef: "dep_ore_101",
        depositType: "event_deposit",
        amountCents: 50000,
      },
    },
    {
      type: "deposit_captured",
      occurredAt: "2026-03-29T10:05:00-04:00",
      payload: {
        depositRef: "dep_ore_101",
        depositType: "event_deposit",
        amountCents: 50000,
        captureRef: "cap_dep_ore_101",
      },
    },
    { type: "check_opened", occurredAt: "2026-03-30T21:06:00-04:00" },
    { type: "items_synced", occurredAt: "2026-03-30T22:35:00-04:00" },
    {
      type: "payment_authorization_requested",
      occurredAt: "2026-03-30T22:40:00-04:00",
    },
    { type: "payment_authorized", occurredAt: "2026-03-30T22:40:05-04:00" },
    { type: "final_receipt_received", occurredAt: "2026-03-30T22:43:00-04:00" },
  ],
  expected: {
    paymentState: "authorized",
    receiptState: "received",
    rewardsState: "not_eligible",
    identityState: "linked_confident",
    bookingState: "attached",
    depositState: "captured",
    hostedSettlementState: "settlement_mismatch",
    roleResolutionState: "resolved_with_split",
    depositAmountCents: 50000,
    depositAppliedAmountCents: 0,
    hostedAmountCents: 0,
    hostedAppliedAmountCents: 0,
    remainingBalanceCents: 163360,
    directPaymentDueCents: 163360,
    exceptionState: "action_required",
    serviceState: "awaiting_staff_action",
    exceptions: ["deposit_captured_not_applied"],
    nextActionOwner: "manager",
    nextActionText:
      "Apply captured deposit to final check before confirming the remaining balance.",
  },
};
