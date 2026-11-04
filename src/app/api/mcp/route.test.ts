import { describe, expect, it } from "vitest";

import { DELETE, GET, OPTIONS, PATCH, POST, PUT } from "./route";

describe("/api/mcp after the move to the MCP Worker (ADR 0016, W3)", () => {
  it.each([
    ["GET", GET],
    ["POST", POST],
    ["PUT", PUT],
    ["PATCH", PATCH],
    ["DELETE", DELETE],
  ])("answers %s with 410 and a JSON-RPC error naming the new URL", async (_method, handler) => {
    const response = handler();

    expect([response.status, response.headers.get("access-control-allow-origin"), await response.json()]).toEqual([
      410,
      "*",
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32000,
          message: expect.stringContaining("https://mcp.admin-os.lr0y.dev/mcp"),
          data: { url: "https://mcp.admin-os.lr0y.dev/mcp" },
        },
      },
    ]);
  });

  it("answers a browser's preflight, so the page can read the 410", () => {
    const response = OPTIONS();

    expect([
      response.status,
      response.headers.get("access-control-allow-origin"),
      response.headers.get("access-control-allow-headers"),
    ]).toEqual([204, "*", "Authorization, Content-Type, MCP-Protocol-Version, Mcp-Method, Mcp-Name"]);
  });
});
