export const FOCUS_MS = 90 * 60 * 1000;

/** A countdown that can be paused: `startedAt` is when it last started running, `null` while paused. */
export interface FocusTimer {
  readonly remainingMs: number;
  readonly startedAt: number | null;
}

export const idleTimer: FocusTimer = { remainingMs: FOCUS_MS, startedAt: null };

export function remainingAt(timer: FocusTimer, now: number): number {
  if (timer.startedAt === null) return timer.remainingMs;
  return Math.max(0, timer.remainingMs - (now - timer.startedAt));
}

export function isRunning(timer: FocusTimer): boolean {
  return timer.startedAt !== null;
}

export function startTimer(timer: FocusTimer, now: number): FocusTimer {
  if (isRunning(timer)) return timer;
  // A finished countdown starts over.
  return { remainingMs: timer.remainingMs === 0 ? FOCUS_MS : timer.remainingMs, startedAt: now };
}

export function pauseTimer(timer: FocusTimer, now: number): FocusTimer {
  return { remainingMs: remainingAt(timer, now), startedAt: null };
}

/** "89:59": whole minutes and seconds, rounded up so the clock never reads 00:00 before it is done. */
export function formatClock(remainingMs: number): string {
  const seconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
