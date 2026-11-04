import { describe, expect, it } from "vitest";

import { FOCUS_MS, formatClock, idleTimer, pauseTimer, remainingAt, startTimer } from "./focus-timer";

describe("focus timer", () => {
  it("shows the full session while idle", () => {
    expect(formatClock(remainingAt(idleTimer, 1_000))).toBe("90:00");
  });

  it("counts down while running", () => {
    const running = startTimer(idleTimer, 0);
    expect(remainingAt(running, 61_000)).toBe(FOCUS_MS - 61_000);
  });

  it("keeps what is left when paused", () => {
    const paused = pauseTimer(startTimer(idleTimer, 0), 10_000);
    expect(remainingAt(paused, 99_000)).toBe(FOCUS_MS - 10_000);
  });

  it("resumes from the paused time", () => {
    const resumed = startTimer(pauseTimer(startTimer(idleTimer, 0), 10_000), 50_000);
    expect(remainingAt(resumed, 60_000)).toBe(FOCUS_MS - 20_000);
  });

  it("stops at zero", () => {
    expect(remainingAt(startTimer(idleTimer, 0), FOCUS_MS + 5_000)).toBe(0);
  });

  it("starts over after it finished", () => {
    const finished = pauseTimer(startTimer(idleTimer, 0), FOCUS_MS + 1);
    expect(startTimer(finished, 5).remainingMs).toBe(FOCUS_MS);
  });

  it("rounds a part of a second up", () => {
    expect(formatClock(59_001)).toBe("01:00");
  });
});
