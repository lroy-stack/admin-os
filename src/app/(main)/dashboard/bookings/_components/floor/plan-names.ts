import type { BookingsMessages } from "../messages";
import type { Landmark, Level, Zone } from "./floor-model";

type VenueNames = BookingsMessages["venue"];

/**
 * The demo room stores no names: an element whose stored name is empty shows the dictionary's name for its id, so it
 * follows the language. A name someone typed is stored and wins.
 */
export function levelName(level: Level, venue: VenueNames): string {
  return level.name || venue.levels[level.id] || "";
}

export function zoneName(zone: Zone, venue: VenueNames): string {
  return zone.name || venue.zones[zone.id] || "";
}

export function landmarkLabel(landmark: Landmark, venue: VenueNames): string {
  return landmark.label || venue.landmarks[landmark.id] || "";
}
