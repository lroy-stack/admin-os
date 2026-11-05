import { describe, expect, it, vi } from "vitest";

import { connect, itPinsToolsOf, keysOf, owner, type PinnedTool, rowsOf } from "./mcp.server.testkit";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
  headers: async () => new Headers(),
}));

/** What an agent gets from the `staff` module's tools (ADR 0017 §7; the generic cases are in mcp.server.test.ts). */
const PINNED = [
  ["staff_get", true, false, true, 1, false],
  ["staff_list", true, false, true, 1, false],
  ["staff_shifts_list", true, false, true, 1, false],
] as const satisfies readonly PinnedTool[];

describe("the staff tools (ADR 0009)", () => {
  itPinsToolsOf(PINNED, "staff");

  it("lists staff without contract terms or ext", async () => {
    const { client } = await connect(owner);
    const result = await client.callTool({ name: "staff_list", arguments: { limit: 200 } });
    expect(keysOf(rowsOf(result)).filter((key) => ["contract", "ext"].includes(key))).toEqual([]);
  });

  it("answers the UI-only staff_contract_get with access.forbidden (spec 012)", async () => {
    const { client } = await connect(owner, undefined, crypto.randomUUID());
    const result = await client.callTool({ name: "staff_contract_get", arguments: { staffId: "staff-marta" } });
    expect(result).toMatchObject({ isError: true, structuredContent: { code: "access.forbidden" } });
  });
});
