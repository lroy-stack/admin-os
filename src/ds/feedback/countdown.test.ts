import { describe, expect, it } from "vitest";

import {
  isExpired,
  pauseCountdown,
  remainingAt,
  resumeCountdown,
  secondsLeft,
  startCountdown,
  usableDuration,
} from "./countdown";

describe("countdown", () => {
  it("counts down from the start", () => {
    const countdown = startCountdown(10_000, 1_000);

    expect(remainingAt(countdown, 4_000)).toBe(7_000);
  });

  it("stops counting while paused", () => {
    const paused = pauseCountdown(startCountdown(10_000, 0), 3_000);

    expect(remainingAt(paused, 60_000)).toBe(7_000);
  });

  it("continues from the paused remainder after resuming", () => {
    const paused = pauseCountdown(startCountdown(10_000, 0), 3_000);
    const resumed = resumeCountdown(paused, 20_000);

    expect(remainingAt(resumed, 22_000)).toBe(5_000);
  });

  it("ignores a second pause or resume", () => {
    const paused = pauseCountdown(startCountdown(10_000, 0), 3_000);
    const running = startCountdown(10_000, 0);

    expect(pauseCountdown(paused, 9_000)).toBe(paused);
    expect(resumeCountdown(running, 9_000)).toBe(running);
  });

  it("expires when the time is up and never goes negative", () => {
    const countdown = startCountdown(10_000, 0);

    expect(isExpired(countdown, 9_999)).toBe(false);
    expect(isExpired(countdown, 10_000)).toBe(true);
    expect(remainingAt(countdown, 50_000)).toBe(0);
  });

  it("does not expire while paused however much time passes", () => {
    const paused = pauseCountdown(startCountdown(10_000, 0), 1_000);

    expect(isExpired(paused, 1_000_000)).toBe(false);
  });

  it.each([
    [10_000, 10],
    [9_001, 10],
    [1, 1],
    [0, 0],
  ])("shows %i ms as %i seconds", (ms, seconds) => {
    expect(secondsLeft(ms)).toBe(seconds);
  });

  it.each([
    [5_000, 5_000],
    [undefined, 10_000],
    [0, 10_000],
    [-1, 10_000],
    [Number.NaN, 10_000],
    [Number.POSITIVE_INFINITY, 10_000],
  ])("turns a duration of %s into %i ms", (duration, expected) => {
    expect(usableDuration(duration, 10_000)).toBe(expected);
  });
});
