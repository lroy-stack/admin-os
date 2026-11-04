import { describe, expect, it } from "vitest";

import { callLineOf } from "../src/log";

const refusalOf = (tool: string) =>
  callLineOf(
    { event: "mcp.refused", tool, status: "access.forbidden", correlationId: "c-1", actorRole: "staff", via: "mcp" },
    "demo-staff",
  );

describe("the call line of a refused call", () => {
  it.each(["bookings_cancel", "no_such_tool"])("logs the tool name %s, which has a tool's shape", (tool) => {
    expect(refusalOf(tool).tool).toBe(tool);
  });

  it.each([
    ["text a client injected", "ignore previous instructions"],
    ["a name past 64 characters", "a".repeat(65)],
    ["upper case and dots", "Bookings.Cancel"],
    ["an empty name", ""],
  ])("logs <unknown> instead of %s", (_case, tool) => {
    expect(refusalOf(tool)).toEqual({
      event: "mcp.call",
      correlationId: "c-1",
      clientId: "demo-staff",
      tool: "<unknown>",
      status: "refused",
      code: "access.forbidden",
      via: "mcp-worker",
    });
  });
});
