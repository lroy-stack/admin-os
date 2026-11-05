import { describe, expect, it } from "vitest";

import { MCP_MANIFEST } from "./mcp-manifest";

/** The `customers` module's MCP entries (ADR 0017 §7; the composition is checked in mcp-manifest.test.ts). */
describe("the customers entries of the MCP manifest (spec 004 D5)", () => {
  // The paths are pinned so a field cannot leave the registry unnoticed (security review, 2026-11-04).
  it.each([
    ["customers.get", ["notes[].text", "blockReason"]],
    ["customers.notes.add", ["notes[].text", "blockReason"]],
  ] as const)("marks the free text of %s as untrusted: %j", (id, paths) => {
    expect(MCP_MANIFEST[id]).toMatchObject({ untrusted: paths });
  });
});
