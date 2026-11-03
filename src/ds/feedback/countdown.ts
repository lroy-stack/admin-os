/**
 * Pausable countdown as plain data. `resumedAt` is the clock reading when it last ran (null while paused), so the
 * remaining time is always `remainingMs - (now - resumedAt)` and nothing needs a timer to stay correct.
 */
export interface Countdown {
  readonly remainingMs: number;
  readonly resumedAt: number | null;
}

export const startCountdown = (durationMs: number, now: number): Countdown => ({
  remainingMs: Math.max(0, durationMs),
  resumedAt: now,
});

export const remainingAt = ({ remainingMs, resumedAt }: Countdown, now: number): number =>
  resumedAt === null ? remainingMs : Math.max(0, remainingMs - Math.max(0, now - resumedAt));

export const pauseCountdown = (countdown: Countdown, now: number): Countdown =>
  countdown.resumedAt === null ? countdown : { remainingMs: remainingAt(countdown, now), resumedAt: null };

export const resumeCountdown = (countdown: Countdown, now: number): Countdown =>
  countdown.resumedAt === null ? { remainingMs: countdown.remainingMs, resumedAt: now } : countdown;

export const isExpired = (countdown: Countdown, now: number): boolean => remainingAt(countdown, now) <= 0;

/** Whole seconds to show: rounds up so "0" appears only at expiry. */
export const secondsLeft = (remainingMs: number): number => Math.ceil(remainingMs / 1000);
