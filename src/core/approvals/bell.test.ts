import { describe, expect, it } from "vitest";

import { APPROVALS_FEED, approvalRows } from "./bell";
import { approvalsMessages } from "./server";

const entry = (overrides: Record<string, unknown>) =>
  ({
    approvalId: "apr-1",
    capabilityId: "bookings.cancel",
    status: "pending",
    requestedBy: { actorId: "a", role: "owner", via: "mcp" },
    requestedAt: "2026-10-31T12:00:00.000Z",
    expiresAt: "2026-11-01T12:00:00.000Z",
    input: { id: "R-1046" },
    ...overrides,
  }) as Parameters<typeof approvalRows>[0][number];

const text = approvalsMessages.en.bell;

describe("approvalRows", () => {
  it("words a waiting write in the locale, naming the record it concerns", () => {
    expect(approvalRows([entry({})], approvalsMessages.es.bell, "es")).toEqual([
      {
        feed: APPROVALS_FEED,
        id: "approval.requested:apr-1",
        kind: "approval.requested",
        title: approvalsMessages.es.bell.title,
        body: expect.stringContaining("R-1046"),
        unread: true,
        approvalId: "apr-1",
      },
    ]);
  });

  it.each(["approved", "rejected", "expired", "conflict"])("leaves out a write that is %s", (status) => {
    expect(approvalRows([entry({ status })], text, "en")).toEqual([]);
  });

  it("reads a capability it has no sentence for as a change to the record", () => {
    const [row] = approvalRows([entry({ capabilityId: "staff.update" })], text, "en");
    expect(row?.body).toBe("An assistant asks to make a change to R-1046.");
  });

  it("leaves the target empty when the input names no record", () => {
    const [row] = approvalRows([entry({ capabilityId: "staff.update", input: null })], text, "en");
    expect(row?.body).toBe("An assistant asks to make a change to .");
  });

  it("lists the oldest request first", () => {
    const rows = approvalRows(
      [
        entry({ approvalId: "new", requestedAt: "2026-10-31T13:00:00.000Z" }),
        entry({ approvalId: "old", requestedAt: "2026-10-31T11:00:00.000Z" }),
      ],
      text,
      "en",
    );
    expect(rows.map(({ approvalId }) => approvalId)).toEqual(["old", "new"]);
  });
});
