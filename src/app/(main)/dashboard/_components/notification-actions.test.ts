import { beforeEach, describe, expect, it, vi } from "vitest";

import { ok } from "@/core/result";

const world = vi.hoisted(() => ({
  runWrite: vi.fn(),
  call: vi.fn(),
}));

vi.mock("@/config/write-action.server", () => ({ runWrite: world.runWrite }));
vi.mock("@/config/runtime", () => ({
  getRuntime: async () => ({
    client: { call: world.call },
    actor: { permissions: [] },
    locale: "en",
  }),
}));

import { bellAction } from "./notification-actions";

beforeEach(() => {
  world.runWrite.mockReset().mockResolvedValue({ status: "ok", value: {} });
  world.call.mockReset().mockResolvedValue(ok({}));
});

describe("bellAction", () => {
  it("refuses a request that is not one of the bell's", async () => {
    const answer = await bellAction({ op: "delete" }, "k-1");

    expect([answer, world.runWrite.mock.calls.length]).toEqual([
      expect.objectContaining({ status: "error", code: "schema.invalid_input" }),
      0,
    ]);
  });

  it("refuses a feed no installed module declares", async () => {
    const answer = await bellAction({ op: "read", feed: "no-such-feed", input: {} }, "k-1");

    expect([answer, world.runWrite.mock.calls.length]).toEqual([
      expect.objectContaining({ status: "error", code: "schema.invalid_input" }),
      0,
    ]);
  });

  it("runs the read capability of the named feed with the attempt key", async () => {
    await bellAction({ op: "read", feed: "notifications", input: { ids: ["a"] } }, "k-1");

    expect(world.runWrite).toHaveBeenCalledWith("notifications.read", { ids: ["a"] }, "k-1");
  });

  it("runs approvals.approve for an approval", async () => {
    await bellAction({ op: "approve", input: { approvalId: "a-1" } }, "k-2");

    expect(world.runWrite).toHaveBeenCalledWith("approvals.approve", { approvalId: "a-1" }, "k-2");
  });
});
