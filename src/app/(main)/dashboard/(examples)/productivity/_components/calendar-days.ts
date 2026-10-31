/** The server's current calendar day as an ISO date ("2026-10-31"), the input of `formatCalendarDate`. */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** An ISO calendar day moved by whole days (negative goes back), without any time-zone shift. */
export function addCalendarDays(isoDate: string, days: number): string {
  const moved = new Date(`${isoDate}T00:00:00Z`);
  moved.setUTCDate(moved.getUTCDate() + days);
  return moved.toISOString().slice(0, 10);
}
