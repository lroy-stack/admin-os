import { describe, vi } from "vitest";

import { itPinsToolsOf, type PinnedTool } from "./mcp.server.testkit";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
  headers: async () => new Headers(),
}));

/** What an agent gets from the `inventory` module's tools (ADR 0017 §7; the generic cases are in mcp.server.test.ts). */
const PINNED = [
  ["inventory_orders_list", true, false, true, 1, false],
  ["inventory_stock_list", true, false, true, 1, false],
] as const satisfies readonly PinnedTool[];

describe("the inventory tools (ADR 0009)", () => {
  itPinsToolsOf(PINNED, "inventory");
});
