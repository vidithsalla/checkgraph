import { canonicalScenarios } from "@/lib/db/seed";
import { guestSeeds } from "@/lib/db/seed/guests";
import type {
  CanonicalSeedScenario,
  ScenarioFragment,
} from "@/lib/db/seed/scenarios/types";
import { projectCheckAllocations } from "@/lib/domain/allocations/project-check-allocations";
import { createSeedEvent } from "@/lib/domain/events/event-group-map";
import { generateCandidateMatches } from "@/lib/domain/identity/generate-candidate-matches";
import { projectBookingDeposits } from "@/lib/domain/deposits/project-booking-deposits";
import type { DomainCheckContext, DomainFragment, DomainGuestProfile } from "@/lib/domain/types";

function toDomainGuestProfiles(): DomainGuestProfile[] {
  return guestSeeds.map((guest) => ({
    id: guest.key,
    displayName: guest.displayName,
    firstName: guest.firstName,
    lastName: guest.lastName,
    phoneNormalized: guest.phoneNormalized,
    emailNormalized: guest.emailNormalized,
    vipTier: guest.vipTier,
  }));
}

function toFragment(fragment: ScenarioFragment): DomainFragment {
  return {
    id: fragment.externalIdentityRef,
    sourceSystem: fragment.sourceSystem,
    externalIdentityRef: fragment.externalIdentityRef,
    rawName: fragment.rawName,
    rawPhone: fragment.rawPhone,
    rawEmail: fragment.rawEmail,
    paymentAlias: fragment.paymentAlias,
    reservationRef: fragment.reservationRef,
    deviceRef: fragment.deviceRef,
    guestProfileId: fragment.guestKey,
    metadata: fragment.metadata,
  };
}

export function materializeScenarioContext(
  scenario: CanonicalSeedScenario,
): DomainCheckContext {
  const fragments = (scenario.fragments ?? []).map(toFragment);
  const guests = toDomainGuestProfiles();
  const booking = scenario.booking
    ? {
        id: scenario.booking.bookingRef,
        bookingRef: scenario.booking.bookingRef,
        bookingType: scenario.booking.bookingType,
        status: scenario.booking.status,
        bookingName: scenario.booking.bookingName,
        organizerGuestId: scenario.booking.organizerGuestRef,
        payerGuestId: scenario.booking.payerGuestRef,
        reservationGuestId: scenario.booking.reservationGuestRef,
        partySize: scenario.booking.partySize,
        depositAmountCents: scenario.booking.depositAmountCents ?? 0,
        hostedAmountCents: scenario.booking.hostedAmountCents ?? 0,
        eventDate: scenario.booking.eventDate,
        notes: scenario.booking.notes,
      }
    : scenario.eventBooking
      ? {
          id: scenario.eventBooking.bookingRef ?? `${scenario.check.externalCheckRef}:booking`,
          bookingRef:
            scenario.eventBooking.bookingRef ?? `${scenario.check.externalCheckRef}:booking`,
          bookingType: scenario.eventBooking.bookingType,
          status: scenario.eventBooking.status,
          bookingName: scenario.eventBooking.eventName,
          organizerGuestId: scenario.eventBooking.organizerGuestKey,
          payerGuestId: scenario.eventBooking.payerGuestKey,
          reservationGuestId: scenario.eventBooking.reservationGuestKey,
          partySize: scenario.eventBooking.partySize,
          depositAmountCents: scenario.eventBooking.depositAmountCents ?? 0,
          hostedAmountCents: scenario.eventBooking.hostedAmountCents ?? 0,
          eventDate: scenario.eventBooking.eventDate,
          notes: scenario.eventBooking.notes,
        }
      : undefined;

  const events = scenario.events.map((event, index) => ({
    id: `evt-${index + 1}`,
    sequenceNo: index + 1,
    ...createSeedEvent(event),
  }));

  const baseContext: DomainCheckContext = {
    checkId: scenario.check.externalCheckRef,
    scenarioId: scenario.scenarioId,
    openedAt: scenario.check.openedAt,
    totalAmountCents: scenario.check.totalAmountCents,
    serviceChannel: scenario.check.serviceChannel,
    reservationRef: scenario.check.reservationRef,
    booking,
    organizerGuestId: booking?.organizerGuestId,
    primaryGuestId:
      scenario.primaryGuestKey ?? booking?.payerGuestId ?? booking?.reservationGuestId,
    payerGuestId: scenario.payerGuestKey ?? booking?.payerGuestId,
    reservationGuestId:
      scenario.reservationGuestKey ?? booking?.reservationGuestId,
    deposits: [],
    allocations: [],
    fragments,
    suggestions: generateCandidateMatches(fragments, guests),
    events,
  };

  return {
    ...baseContext,
    deposits: projectBookingDeposits(baseContext),
    allocations: projectCheckAllocations(baseContext),
  };
}

export function materializeCanonicalScenarios() {
  return canonicalScenarios.map((scenario) => ({
    scenario,
    context: materializeScenarioContext(scenario),
  }));
}
