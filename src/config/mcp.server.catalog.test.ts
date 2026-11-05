import { describe, vi } from "vitest";

import { itPinsToolsOf, type PinnedTool } from "./mcp.server.testkit";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
  headers: async () => new Headers(),
}));

/** What an agent gets from the `catalog` module's tools (ADR 0017 §7; the generic cases are in mcp.server.test.ts). */
const PINNED = [["catalog_list", true, false, true, 0, false]] as const satisfies readonly PinnedTool[];

describe("the catalog tools (ADR 0009)", () => {
  itPinsToolsOf(PINNED, "catalog");
});
