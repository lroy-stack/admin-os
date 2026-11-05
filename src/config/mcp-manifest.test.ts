import { describe, expect, it } from "vitest";

import { exposedCapabilities, type ToolManifest } from "@/core/mcp/server";

import { CATALOG, type CatalogById, type KernelCatalogById } from "./catalog";
import { instructionsFor } from "./mcp-instructions";
import { KERNEL_TOOLS, MCP_MANIFEST, type StrayHintOf } from "./mcp-manifest";
import { MODULES } from "./modules.generated";

/**
 * The composition of the manifest, checked on kernel ids. What a module's entries pin is in
 * `mcp-manifest.<module>.test.ts` (ADR 0017 §7).
 */
const exposedWrites = exposedCapabilities(CATALOG, MCP_MANIFEST).filter((capability) => capability.effect !== "read");

describe("the MCP manifest (spec 004 D5)", () => {
  it("classifies every capability of the catalogue", () => {
    expect(() => exposedCapabilities(CATALOG, MCP_MANIFEST)).not.toThrow();
  });

  it("does not compile when a capability is left unclassified", () => {
    const { "approvals.get": _omitted, ...unclassified } = MCP_MANIFEST;
    // @ts-expect-error `approvals.get` has no entry, so the manifest does not cover the catalogue.
    const incomplete: ToolManifest<CatalogById> = unclassified;
    expect(Object.keys(incomplete)).not.toContain("approvals.get");
  });

  it("does not compile when an id hint names a field the capability has no input for", () => {
    const misnamed: ToolManifest<CatalogById> = {
      ...MCP_MANIFEST,
      // @ts-expect-error `heldId` is not an input field of `approvals.get`.
      "approvals.get": { expose: true, title: "Check a held write", ids: { heldId: ["clock.get"] } },
    };
    expect(misnamed["approvals.get"]).toHaveProperty("ids");
  });

  it("does not compile when an id hint names no capability", () => {
    const misnamed: ToolManifest<CatalogById> = {
      ...MCP_MANIFEST,
      // @ts-expect-error `clock.find` is not a capability of the catalogue.
      "approvals.get": { expose: true, title: "Check a held write", ids: { approvalId: ["clock.find"] } },
    };
    expect(misnamed["approvals.get"]).toHaveProperty("ids");
  });

  it.each(exposedWrites)("$id declares its idempotency mode (ADR 0016, resolution 3)", (capability) => {
    expect(["key", "target-state"]).toContain(capability.idempotency);
  });

  it.each(["tags[]", "tags", "name", "phone", "email"])(
    "leaves %s plain in every untrusted path of every module, since an agent needs it unwrapped",
    (path) => {
      const marked = Object.values(MCP_MANIFEST).flatMap((entry) =>
        "untrusted" in entry ? (entry.untrusted ?? []) : [],
      );
      expect(marked.filter((marking) => marking.endsWith(path))).toEqual([]);
    },
  );
});

describe("the kernel's MCP entries (ADR 0017 §1)", () => {
  it("does not compile when a kernel capability is left unclassified", () => {
    const { "clock.get": _omitted, ...unclassified } = KERNEL_TOOLS;
    // @ts-expect-error `clock.get` has no entry, so the kernel's entries do not cover the kernel's catalogue.
    const incomplete: ToolManifest<KernelCatalogById> = unclassified;
    expect(Object.keys(incomplete)).not.toContain("clock.get");
  });

  it("names a hint to a missing tool of an installed module as stray, and a hint to an absent module as not", () => {
    type Entries = {
      readonly x: { readonly ids: { readonly id: readonly ["clock.find", "gone.list", "clock.get"] } };
    };
    const stray: StrayHintOf<Entries> = "clock.find";
    // @ts-expect-error a tool of a module that is not installed is dropped by composition, not stray.
    const absent: StrayHintOf<Entries> = "gone.list";
    expect([stray, absent]).toEqual(["clock.find", "gone.list"]);
  });
});

describe("the instructions of a composition (ADR 0017 §5)", () => {
  const ask = { toolIds: new Set<string>(), readOnly: false };

  it("name no business words when no module is installed", () => {
    expect(instructionsFor([], CATALOG)(ask)).toMatch(/^admin-OS runs one small business\. An error names/);
  });

  it.each(MODULES.map((installed) => ({ id: installed.id, noun: installed.mcp.noun })))(
    "name the module $id installed alone: $noun",
    ({ id, noun }) => {
      const alone = MODULES.filter((installed) => installed.id === id);
      expect(instructionsFor(alone, CATALOG)(ask).startsWith(`admin-OS runs one small business: ${noun}. `)).toBe(true);
    },
  );
});
