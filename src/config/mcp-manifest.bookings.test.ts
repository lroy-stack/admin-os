import { describe, expect, it } from "vitest";

import { mergeCatalogs } from "@/core/capability";
import { exposedCapabilities, type McpManifest } from "@/core/mcp/server";
import { composeMcpManifest } from "@/core/module";

import { KERNEL_CATALOGS } from "./catalog";
import { instructionsFor } from "./mcp-instructions";
import { KERNEL_TOOLS, MCP_MANIFEST } from "./mcp-manifest";
import { MODULES } from "./modules.generated";

/** The `bookings` module's MCP entries (ADR 0017 §7; the composition is checked in mcp-manifest.test.ts). */
describe("the bookings entries of the MCP manifest (spec 004 D5)", () => {
  it.each(["bookings.status.undo", "bookings.walk_in.undo"] as const)(
    "keeps %s UI-only: the undo belongs to the person who just acted (ADR 0016, resolution 3)",
    (id) => {
      expect(MCP_MANIFEST[id]).toEqual({ uiOnly: expect.stringMatching(/undo affordance/) });
    },
  );

  // The paths are pinned so a field cannot leave the registry unnoticed (security review, 2026-11-04).
  it.each([
    ["bookings.get", ["guestNote", "staffNote", "cancelReason", "noShowReason", "contactName"]],
    ["bookings.create", ["guestNote", "staffNote", "cancelReason", "noShowReason", "contactName"]],
    ["bookings.walk_in.seat", ["guestNote", "staffNote", "cancelReason", "noShowReason", "contactName"]],
    ["bookings.list", ["items[].cancelReason", "items[].noShowReason", "items[].contactName"]],
    ["bookings.search", ["items[].contactName"]],
  ] as const)("marks the free text of %s as untrusted: %j", (id, paths) => {
    expect(MCP_MANIFEST[id]).toMatchObject({ untrusted: paths });
  });
});

/**
 * The composition as it would be with the customers module removed (ADR 0017 §5, the amendment to ADR 0009). The
 * generator composes that tree since M9 (customers fills the bookings route's slots); this fixture tests the composition
 * functions on their own, in a tree where customers is still installed. It belongs to bookings, which holds the hints to
 * customers' tools.
 */
/** An id typed as text, so a tree without the customers module still compiles this comparison. */
const CUSTOMERS: string = "customers";
const withoutCustomers = MODULES.filter(({ id }) => id !== CUSTOMERS);
const catalogWithoutCustomers = mergeCatalogs(
  ...KERNEL_CATALOGS,
  ...withoutCustomers.map(({ capabilities }) => capabilities),
);
const manifestWithoutCustomers = composeMcpManifest(KERNEL_TOOLS, withoutCustomers);
const hintsKeptWithoutCustomers: McpManifest = Object.fromEntries(
  [KERNEL_TOOLS, ...withoutCustomers.map(({ mcp }) => mcp.tools)].flatMap((tools) => Object.entries(tools)),
);
const instructionsWithoutCustomers = instructionsFor(
  withoutCustomers,
  catalogWithoutCustomers,
)({
  toolIds: new Set(exposedCapabilities(catalogWithoutCustomers, manifestWithoutCustomers).map(({ id }) => id)),
  readOnly: false,
});

describe("a composition without the customers module", () => {
  it("drops bookings' hints to customers' tools, and keeps the others", () => {
    expect([manifestWithoutCustomers["bookings.search"], manifestWithoutCustomers["bookings.create"]]).toEqual([
      { expose: true, title: "Search bookings", untrusted: ["items[].contactName"] },
      expect.objectContaining({ ids: { resourceIds: ["bookings.availability.get", "resources.list"] } }),
    ]);
  });

  it("classifies its catalogue, which it could not with those hints kept", () => {
    expect(() => exposedCapabilities(catalogWithoutCustomers, manifestWithoutCustomers)).not.toThrow();
    expect(() => exposedCapabilities(catalogWithoutCustomers, hintsKeptWithoutCustomers)).toThrow(
      /id hints that name no exposed tool/,
    );
  });

  it("names the nouns of the modules that remain in the instructions, and no customer", () => {
    const nouns = withoutCustomers.map(({ mcp }) => mcp.noun);
    const at = nouns.map((noun) => instructionsWithoutCustomers.indexOf(noun));
    expect([
      instructionsWithoutCustomers.startsWith("admin-OS runs one small business: "),
      at.includes(-1),
      at,
      /customer/.test(instructionsWithoutCustomers),
    ]).toEqual([true, false, [...at].sort((a, b) => a - b), false]);
  });
});
