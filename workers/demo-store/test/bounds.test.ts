import { describe, expect, it } from "vitest";

import type { ApprovalRecord } from "@/core/approvals";

import { boundSession, MAX_APPROVALS, MAX_REPLAYS } from "../src/bounds";

const replay = { fingerprint: "{}", result: { ok: true as const, value: null } };

const NOW = Date.UTC(2026, 10, 4, 12);
const LATER = new Date(NOW + 3_600_000).toISOString();
const EARLIER = new Date(NOW - 3_600_000).toISOString();

const approval = (n: number, overrides: Partial<ApprovalRecord> = {}): ApprovalRecord => ({
  approvalId: `a${n}`,
  capabilityId: "x.y",
  input: {},
  fingerprint: "{}",
  expected: "{}",
  requestedBy: { actorId: "demo-owner", role: "owner", via: "mcp" },
  requestedAt: EARLIER,
  expiresAt: LATER,
  status: "pending",
  ...overrides,
});

const idsOf = (approvals: readonly ApprovalRecord[]) => approvals.map((record) => record.approvalId);

describe("boundSession", () => {
  it("drops the oldest replay records beyond the cap and keeps the newest", () => {
    const replays = new Map(Array.from({ length: MAX_REPLAYS + 3 }, (_, n) => [`k${n}`, replay] as const));

    boundSession({ replays, approvals: [] }, NOW);

    expect([replays.size, replays.has("k2"), replays.has("k3"), replays.has(`k${MAX_REPLAYS + 2}`)]).toEqual([
      MAX_REPLAYS,
      false,
      true,
      true,
    ]);
  });

  it("drops decided and expired approvals beyond the cap, oldest first, and keeps the pending ones", () => {
    const approvals = [
      approval(0, { status: "approved" }),
      approval(1),
      approval(2, { expiresAt: EARLIER }),
      ...Array.from({ length: MAX_APPROVALS - 1 }, (_, n) => approval(n + 3)),
    ];

    boundSession({ replays: new Map(), approvals }, NOW);

    expect([
      approvals.length,
      idsOf(approvals).includes("a0"),
      idsOf(approvals).includes("a2"),
      approvals[0]?.approvalId,
    ]).toEqual([MAX_APPROVALS, false, false, "a1"]);
  });

  it("never drops a pending approval, even beyond the cap", () => {
    const approvals = Array.from({ length: MAX_APPROVALS + 2 }, (_, n) => approval(n));

    boundSession({ replays: new Map(), approvals }, NOW);

    expect(approvals).toHaveLength(MAX_APPROVALS + 2);
  });

  it("leaves a session within its caps untouched", () => {
    const replays = new Map([["k", replay]]);
    const approvals = [approval(0, { status: "rejected" })];

    boundSession({ replays, approvals }, NOW);

    expect([replays.size, approvals.length]).toEqual([1, 1]);
  });
});
