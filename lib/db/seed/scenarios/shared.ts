import { createSeedEvent, type SeedEventInput } from "@/lib/domain/events/event-group-map";

export function scenarioEvent(input: SeedEventInput) {
  return createSeedEvent(input);
}
