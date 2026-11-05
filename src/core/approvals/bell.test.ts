import { describe, expect, it } from "vitest";

import { APPROVALS_FEED, approvalRows } from "./bell";
import { approvalsMessages } from "./server";
import { readdirSync, readFileSync } from "node:fs";

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
const sentences = { "widgets.retire": "An assistant asks to retire widget {target}." };

describe("approvalRows", () => {
  it("words a waiting write in the locale, naming the record it concerns", () => {
    expect(
      approvalRows([entry({ capabilityId: "widgets.retire" })], approvalsMessages.es.bell, "es", {
        "widgets.retire": "Un asistente pide retirar el widget {target}.",
      }),
    ).toEqual([
      {
        feed: APPROVALS_FEED,
        id: "approval.requested:apr-1",
        kind: "approval.requested",
        title: approvalsMessages.es.bell.title,
        body: "Un asistente pide retirar el widget R-1046.",
        unread: true,
        approvalId: "apr-1",
      },
    ]);
  });

  it.each(["approved", "rejected", "expired", "conflict"])("leaves out a write that is %s", (status) => {
    expect(approvalRows([entry({ status })], text, "en", sentences)).toEqual([]);
  });

  it("words a write by the sentence its module gave for the capability", () => {
    const [row] = approvalRows([entry({ capabilityId: "widgets.retire" })], text, "en", sentences);
    expect(row?.body).toBe("An assistant asks to retire widget R-1046.");
  });

  it("reads a capability it has no sentence for as a change to the record", () => {
    const [row] = approvalRows([entry({ capabilityId: "staff.update" })], text, "en", sentences);
    expect(row?.body).toBe("An assistant asks to make a change to R-1046.");
  });

  it("leaves the target empty when the input names no record", () => {
    const [row] = approvalRows([entry({ capabilityId: "staff.update", input: null })], text, "en", sentences);
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
      sentences,
    );
    expect(rows.map(({ approvalId }) => approvalId)).toEqual(["old", "new"]);
  });
});

const moduleIds = readdirSync(new URL("../../modules", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

describe("the kernel's approval files", () => {
  it("sees the modules that exist", () => {
    expect(moduleIds).toContain("bookings");
  });

  it.each(["bell.ts", "server.ts"])("%s names no module capability", (file) => {
    const named = new RegExp(`\\b(${moduleIds.join("|")})[.A-Z_]`);
    expect(readFileSync(new URL(file, import.meta.url), "utf8")).not.toMatch(named);
  });
});
