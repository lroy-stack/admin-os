import { describe, expect, it } from "vitest";

import { mergeCatalogs } from "@/core/capability";
import { exposedCapabilities, type McpManifest, type ToolManifest } from "@/core/mcp/server";
import { composeMcpManifest } from "@/core/module";

import { CATALOG, type CatalogById, KERNEL_CATALOGS, type KernelCatalogById } from "./catalog";
import { instructionsFor } from "./mcp-instructions";
import { KERNEL_TOOLS, MCP_MANIFEST, type StrayHintOf } from "./mcp-manifest";
import { MODULES } from "./modules.generated";

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

  it("does not compile when an id hint names a field the capability has no input for", () => {
    const misnamed: ToolManifest<CatalogById> = {
      ...MCP_MANIFEST,
      // @ts-expect-error `bookingId` is not an input field of `bookings.cancel`.
      "bookings.cancel": { expose: true, title: "Cancel a booking", ids: { bookingId: ["bookings.list"] } },
    };
    expect(misnamed["bookings.cancel"]).toHaveProperty("ids");
  });

  it("does not compile when an id hint names no capability", () => {
    const misnamed: ToolManifest<CatalogById> = {
      ...MCP_MANIFEST,
      // @ts-expect-error `bookings.find` is not a capability of the catalogue.
      "bookings.cancel": { expose: true, title: "Cancel a booking", ids: { id: ["bookings.find"] } },
    };
    expect(misnamed["bookings.cancel"]).toHaveProperty("ids");
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

  // The paths are pinned so a field cannot leave the registry unnoticed (security review, 2026-11-04).
  it.each([
    ["bookings.get", ["guestNote", "staffNote", "cancelReason", "noShowReason", "contactName"]],
    ["bookings.create", ["guestNote", "staffNote", "cancelReason", "noShowReason", "contactName"]],
    ["bookings.walk_in.seat", ["guestNote", "staffNote", "cancelReason", "noShowReason", "contactName"]],
    ["bookings.list", ["items[].cancelReason", "items[].noShowReason", "items[].contactName"]],
    ["bookings.search", ["items[].contactName"]],
    ["customers.get", ["notes[].text", "blockReason"]],
    ["customers.notes.add", ["notes[].text", "blockReason"]],
  ] as const)("marks the free text of %s as untrusted: %j", (id, paths) => {
    expect(MCP_MANIFEST[id]).toMatchObject({ untrusted: paths });
  });

  it.each(["tags[]", "tags", "name", "phone", "email"])(
    "leaves %s plain in every booking and customer path, since an agent needs it unwrapped",
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
      readonly x: { readonly ids: { readonly id: readonly ["bookings.find", "gone.list", "bookings.list"] } };
    };
    const stray: StrayHintOf<Entries> = "bookings.find";
    // @ts-expect-error a tool of a module that is not installed is dropped by composition, not stray.
    const absent: StrayHintOf<Entries> = "gone.list";
    expect([stray, absent]).toEqual(["bookings.find", "gone.list"]);
  });
});

/**
 * The composition as it would be with the customers module removed (ADR 0017 §5, the amendment to ADR 0009). The
 * generator refuses that tree today, since bookings requires customers until M9 composes them by slot; this fixture
 * tests the composition functions on their own.
 */
const withoutCustomers = MODULES.filter(({ id }) => id !== "customers");
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

  it("leaves customers out of the instructions", () => {
    expect(instructionsWithoutCustomers).toMatch(
      /^admin-OS runs one small business: bookings, catalog items, notifications, resources \(tables, chairs or bays\) and staff\. /,
    );
    expect(instructionsWithoutCustomers).not.toMatch(/customer/);
  });
});

describe("the instructions of a composition (ADR 0017 §5)", () => {
  const ask = { toolIds: new Set<string>(), readOnly: false };
  const staffOnly = MODULES.filter(({ id }) => id === "staff");

  it("name no business words when no module is installed", () => {
    expect(instructionsFor([], CATALOG)(ask)).toMatch(/^admin-OS runs one small business\. An error names/);
  });

  it("name the one module installed alone", () => {
    expect(instructionsFor(staffOnly, CATALOG)(ask)).toMatch(/^admin-OS runs one small business: staff\. /);
  });
});
