import { describe, expect, it } from "vitest";

import { exposedCapabilities, type ToolManifest } from "@/core/mcp/server";

import { CATALOG, type CatalogById } from "./catalog";
import { MCP_MANIFEST } from "./mcp-manifest";

describe("the MCP manifest (spec 004 D5)", () => {
  it("classifies every capability of the catalogue", () => {
    expect(() => exposedCapabilities(CATALOG, MCP_MANIFEST)).not.toThrow();
  });

  it("does not compile when a capability is left unclassified", () => {
    const { "staff.list": _omitted, ...unclassified } = MCP_MANIFEST;
    // @ts-expect-error `staff.list` has no entry, so the manifest does not cover the catalogue.
    const incomplete: ToolManifest<CatalogById> = unclassified;
    expect(Object.keys(incomplete)).not.toContain("staff.list");
  });
});
