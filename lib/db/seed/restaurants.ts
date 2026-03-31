import type { ServiceMode } from "@/lib/db/schema";
import { prototypeTimezone } from "./reference";

export type RestaurantSeed = {
  slug: string;
  name: string;
  serviceMode: ServiceMode;
  timezone: string;
  city: string;
  stateRegion: string;
};

export const restaurantSeeds: RestaurantSeed[] = [
  {
    slug: "sable-nyc",
    name: "Sable",
    serviceMode: "full_service",
    timezone: prototypeTimezone,
    city: "New York",
    stateRegion: "NY",
  },
  {
    slug: "northline-bar",
    name: "Northline Bar",
    serviceMode: "bar_lounge",
    timezone: prototypeTimezone,
    city: "Brooklyn",
    stateRegion: "NY",
  },
  {
    slug: "olive-room-events",
    name: "Olive Room Events",
    serviceMode: "private_event",
    timezone: prototypeTimezone,
    city: "New York",
    stateRegion: "NY",
  },
];
