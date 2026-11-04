import { describe, expect, it } from "vitest";

import { exposedCapabilities, type ToolManifest } from "@/core/mcp/server";

import { CATALOG, type CatalogById } from "./catalog";
import { MCP_MANIFEST } from "./mcp-manifest";

const exposedWrites = exposedCapabilities(CATALOG, MCP_MANIFEST).filter((capability) => capability.effect !== "read");

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

  it.each(["bookings.status.undo", "bookings.walk_in.undo"] as const)(
    "keeps %s UI-only: the undo belongs to the person who just acted (ADR 0016, resolution 3)",
    (id) => {
      expect(MCP_MANIFEST[id]).toEqual({ uiOnly: expect.stringMatching(/undo affordance/) });
    },
  );

  it.each(exposedWrites)("$id declares its idempotency mode (ADR 0016, resolution 3)", (capability) => {
    expect(["key", "target-state"]).toContain(capability.idempotency);
  });
});
