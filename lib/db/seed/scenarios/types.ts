import type {
  BookingState,
  BookingStatus,
  DepositState,
  DepositType,
  ExceptionState,
  ExceptionType,
  HostedSettlementState,
  IdentityState,
  MatchBand,
  PaymentState,
  ReceiptState,
  RoleResolutionState,
  RewardsState,
  RoleType,
  ServiceChannel,
  ServiceState,
  SourceSystem,
} from "@/lib/db/schema";
import type { SeedEventInput } from "@/lib/domain/events/event-group-map";

export type ScenarioFragment = {
  sourceSystem: SourceSystem;
  externalIdentityRef: string;
  rawName?: string;
  rawPhone?: string;
  rawEmail?: string;
  paymentAlias?: string;
  reservationRef?: string;
  deviceRef?: string;
  metadata?: Record<string, unknown>;
  guestKey?: string;
};

export type ScenarioMatchSuggestion = {
  fragmentRef: string;
  candidateGuestKey: string;
  confidenceScore: number;
  matchBand: MatchBand;
  reasons: string[];
  conflicts: string[];
  suggestedAction: string;
};

export type ScenarioSupportCase = {
  status: "open" | "investigating" | "waiting_on_restaurant" | "waiting_on_backend";
  summary: string;
  guestVisibleSummary?: string;
};

export type ScenarioAuditEntry = {
  actionType: string;
  actorRole: RoleType;
  actorId: string;
  note?: string;
  payload?: Record<string, unknown>;
};

export type ScenarioExpectedState = {
  paymentState: PaymentState;
  receiptState: ReceiptState;
  rewardsState: RewardsState;
  identityState: IdentityState;
  exceptionState: ExceptionState;
  serviceState: ServiceState;
  bookingState?: BookingState;
  depositState?: DepositState;
  hostedSettlementState?: HostedSettlementState;
  roleResolutionState?: RoleResolutionState;
  depositAmountCents?: number;
  depositAppliedAmountCents?: number;
  hostedAmountCents?: number;
  hostedAppliedAmountCents?: number;
  remainingBalanceCents?: number;
  directPaymentDueCents?: number;
  nextActionOwner?: RoleType;
  nextActionText?: string;
};

export type CanonicalSeedScenario = {
  scenarioId: string;
  title: string;
  purpose: string;
  restaurantSlug: string;
  check: {
    externalCheckRef: string;
    tableLabel?: string;
    serviceChannel: ServiceChannel;
    partySize?: number;
    subtotalAmountCents: number;
    taxAmountCents: number;
    tipAmountCents: number;
    totalAmountCents: number;
    reservationRef?: string;
    openedAt: string;
  };
  eventBooking?: {
    bookingRef?: string;
    eventName: string;
    bookingType: "hosted_event" | "private_dinner" | "corporate_dining";
    status: BookingStatus;
    organizerGuestKey?: string;
    payerGuestKey?: string;
    reservationGuestKey?: string;
    partySize?: number;
    depositAmountCents?: number;
    hostedAmountCents?: number;
    eventDate?: string;
    notes?: string;
  };
  booking?: {
    bookingRef: string;
    bookingType: "hosted_event" | "private_dinner" | "corporate_dining";
    bookingName: string;
    status: BookingStatus;
    organizerGuestRef?: string;
    payerGuestRef?: string;
    reservationGuestRef?: string;
    partySize?: number;
    depositAmountCents?: number;
    hostedAmountCents?: number;
    eventDate?: string;
    notes?: string;
  };
  deposit?: {
    depositRef: string;
    depositType: DepositType;
    state: DepositState;
    amountCents: number;
    appliedAmountCents: number;
    refundableAmountCents: number;
    fundingOwnerGuestRef?: string;
    captureRef?: string;
    holdRef?: string;
  };
  primaryGuestKey?: string;
  payerGuestKey?: string;
  reservationGuestKey?: string;
  fragments?: ScenarioFragment[];
  matchSuggestions?: ScenarioMatchSuggestion[];
  events: SeedEventInput[];
  expected: ScenarioExpectedState & {
    exceptions: ExceptionType[];
  };
  supportCase?: ScenarioSupportCase;
  auditEntries?: ScenarioAuditEntry[];
};
