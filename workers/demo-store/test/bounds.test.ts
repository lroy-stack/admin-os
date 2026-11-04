import { describe, expect, it } from "vitest";

import { boundSession, MAX_APPROVALS, MAX_REPLAYS } from "../src/bounds";

const replay = { fingerprint: "{}", result: { ok: true as const, value: null } };

const approval = (n: number) => ({ approvalId: `a${n}`, capabilityId: "x.y", actorId: "demo-owner", input: {} });

describe("boundSession", () => {
  it("drops the oldest replay records beyond the cap and keeps the newest", () => {
    const replays = new Map(Array.from({ length: MAX_REPLAYS + 3 }, (_, n) => [`k${n}`, replay] as const));

    boundSession({ replays, approvals: [] });

    expect([replays.size, replays.has("k2"), replays.has("k3"), replays.has(`k${MAX_REPLAYS + 2}`)]).toEqual([
      MAX_REPLAYS,
      false,
      true,
      true,
    ]);
  });

  it("drops the oldest approvals beyond the cap and keeps the newest", () => {
    const approvals = Array.from({ length: MAX_APPROVALS + 2 }, (_, n) => approval(n));

    boundSession({ replays: new Map(), approvals });

    expect([approvals.length, approvals[0]?.approvalId, approvals.at(-1)?.approvalId]).toEqual([
      MAX_APPROVALS,
      "a2",
      `a${MAX_APPROVALS + 1}`,
    ]);
  });

  it("leaves a session within its caps untouched", () => {
    const replays = new Map([["k", replay]]);
    const approvals = [approval(0)];

    boundSession({ replays, approvals });

    expect([replays.size, approvals.length]).toEqual([1, 1]);
  });
});
