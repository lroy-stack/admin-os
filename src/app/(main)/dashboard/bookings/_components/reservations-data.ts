/**
 * B1b (plan 003): the floor and the rail still default to the seeded service moment. They move onto the clock and the
 * settings read through the seam with the floor and the rail; the list, the agenda and the drawer already take both
 * from the day they are given (`ServiceDay` in `view-model.ts`).
 */

/** 8:40 PM, the moment the demo's business clock is frozen at. */
export const SERVICE_NOW_MIN = 20 * 60 + 40;

/** A confirmed party counts as running late this many minutes after its arrival time. */
export const LATE_AFTER_MIN = 10;
