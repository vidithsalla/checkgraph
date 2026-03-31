import type {
  AllocationType,
  ActorType,
  BookingState,
  BookingStatus,
  BookingType,
  DepositState,
  DepositType,
  EventGroup,
  EventType,
  ExceptionSeverity,
  ExceptionState,
  ExceptionType,
  FundingSourceType,
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

export type DomainGuestProfile = {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phoneNormalized?: string;
  emailNormalized?: string;
  vipTier?: string;
  knownPaymentAliases?: string[];
};

export type DomainFragment = {
  id: string;
  sourceSystem: SourceSystem;
  externalIdentityRef: string;
  rawName?: string;
  rawPhone?: string;
  rawEmail?: string;
  paymentAlias?: string;
  reservationRef?: string;
  deviceRef?: string;
  guestProfileId?: string;
  metadata?: Record<string, unknown>;
};

export type DomainEvent = {
  id?: string;
  sequenceNo: number;
  type: EventType;
  eventGroup: EventGroup;
  occurredAt: string;
  payload: Record<string, unknown>;
  sourceSystem: SourceSystem;
  actorType: ActorType;
  actorId?: string | null;
  correlationId?: string | null;
  idempotencyKey?: string | null;
};

export type DomainIdentitySuggestion = {
  fragmentId: string;
  candidateGuestId: string;
  confidenceScore: number;
  matchBand: MatchBand;
  reasons: string[];
  conflicts: string[];
  suggestedAction: string;
};

export type DomainBookingContext = {
  id: string;
  bookingRef: string;
  bookingType: BookingType;
  status: BookingStatus;
  bookingName: string;
  organizerGuestId?: string;
  payerGuestId?: string;
  reservationGuestId?: string;
  partySize?: number;
  depositAmountCents: number;
  hostedAmountCents: number;
  eventDate?: string;
  notes?: string;
};

export type DomainDepositProjection = {
  depositRef: string;
  depositType: DepositType;
  state: DepositState;
  amountCents: number;
  appliedAmountCents: number;
  refundableAmountCents: number;
  fundingOwnerGuestId?: string;
  captureRef?: string;
  holdRef?: string;
};

export type DomainFundingAllocation = {
  allocationType: AllocationType;
  fundingSourceType: FundingSourceType;
  sourceRef: string;
  amountCents: number;
  note?: string;
  appliedByEventId?: string;
  appliedAt: string;
};

export type DomainCheckContext = {
  checkId: string;
  scenarioId?: string;
  openedAt: string;
  totalAmountCents: number;
  serviceChannel: ServiceChannel;
  reservationRef?: string;
  booking?: DomainBookingContext;
  organizerGuestId?: string;
  primaryGuestId?: string;
  payerGuestId?: string;
  reservationGuestId?: string;
  deposits: DomainDepositProjection[];
  allocations: DomainFundingAllocation[];
  events: DomainEvent[];
  fragments: DomainFragment[];
  suggestions: DomainIdentitySuggestion[];
};

export type DerivedCheckState = {
  paymentState: PaymentState;
  receiptState: ReceiptState;
  rewardsState: RewardsState;
  identityState: IdentityState;
  exceptionState: ExceptionState;
  serviceState: ServiceState;
  bookingState: BookingState;
  depositState: DepositState;
  hostedSettlementState: HostedSettlementState;
  roleResolutionState?: RoleResolutionState;
  organizerGuestId?: string;
  primaryGuestId?: string;
  payerGuestId?: string;
  reservationGuestId?: string;
  depositAmountCents: number;
  depositAppliedAmountCents: number;
  hostedAmountCents: number;
  hostedAppliedAmountCents: number;
  remainingBalanceCents: number;
  directPaymentDueCents: number;
  fundingSummary: {
    depositCoveredCents: number;
    hostedCoveredCents: number;
    guestPaidRemainderCents: number;
  };
  nextActionOwner?: RoleType;
  nextActionText?: string;
  activeExceptionCount: number;
  lastEventAt?: string;
};

export type DetectedException = {
  type: ExceptionType;
  severity: ExceptionSeverity;
  explanationText: string;
  recommendedOwner: RoleType;
  recommendedNextAction: string;
  detectedAt: string;
};
