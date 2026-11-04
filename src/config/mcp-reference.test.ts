import { describe, expect, it } from "vitest";

import { MCP_REFERENCE_PATH, renderMcpReference } from "./mcp-reference";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const committed = () => readFileSync(fileURLToPath(new URL(`../../${MCP_REFERENCE_PATH}`, import.meta.url)), "utf8");

describe("the MCP reference (spec 004 AC10)", () => {
  it("matches the committed docs/mcp/reference.md", () => {
    expect(committed(), "docs/mcp/reference.md is stale: run npm run mcp:reference").toBe(renderMcpReference());
  });
});
