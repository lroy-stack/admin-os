import { beforeAll, describe, expect, it } from "vitest";

import { VIEW_RENDERERS } from "@/config/modules.client.generated";
import { MODULE_GRAPH, MODULES } from "@/config/modules.generated";
import { MODULE_SERVERS } from "@/config/modules.server.generated";
import { SLOT_FILLS } from "@/config/modules.slots.generated";
import { compositionProblems, type ModuleManifest, type ModuleServer } from "@/core/module";

import {
  type Generated,
  generate,
  MODULE_OWNS_PATH,
  MODULE_SERVERS_PATH,
  MODULE_SLOTS_PATH,
  MODULE_UIS_PATH,
  MODULES_PATH,
  manifestExportOf,
  ROOT,
  uiExportOf,
} from "./generate-modules";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let generated: Generated;

/**
 * What each installed module requires, pinned for every module (ADR 0017 §2, §5: every edge counts). The first six rows
 * are census C0's; inventory and parties joined with their ADRs (0018, 0019) and require nothing, since their
 * references are optional. A module added without a row fails the pin below, so its edges are written down with it.
 * A module that is not installed has no row, and a target that is not installed is dropped from the rows that name it,
 * so the pin still holds after a removal.
 */
const PINNED: Readonly<Record<string, readonly string[]>> = {
  // M9 (plan 006) changed this row: customers fills the bookings route's slots, so the route no longer imports it.
  bookings: ["resources"],
  catalog: [],
  customers: [],
  inventory: [],
  notifications: ["bookings"],
  parties: [],
  resources: [],
  staff: [],
};

const pinnedFor = (installed: readonly string[]) =>
  Object.fromEntries(
    Object.entries(PINNED)
      .filter(([id]) => installed.includes(id))
      .map(([id, targets]) => [id, targets.filter((target) => installed.includes(target))]),
  );

/** Each installed module, with the refusal that removing it must cause: one line per module that imports it. */
const removals = Object.keys(MODULE_GRAPH).map((removed) => ({
  removed,
  refusals: Object.entries(MODULE_GRAPH)
    .filter(([, targets]) => (targets as readonly string[]).includes(removed))
    .map(([id]) => `${id} requires ${removed}; restore src/modules/${removed} or remove ${id}`),
}));

beforeAll(async () => {
  generated = await generate(ROOT);
}, 20_000);

/**
 * A module left out of the installed list, as if its folder were deleted: its files' imports still resolve, which
 * gives the same edges as the unresolved aliases a real deletion leaves (`moduleEdges`' tests cover those). Deleting
 * folders in a copy of the tree is the removal walks' job (plan 006 M8).
 */
const without = (id: string) => () =>
  compositionProblems(
    generated.modules.filter(({ manifest }) => manifest.id !== id),
    generated.edges,
    (path) => existsSync(join(ROOT, path)),
  );

describe("the generated module list (ADR 0017 §5)", () => {
  it("composes today's tree without a problem", () => {
    expect(generated.problems).toEqual([]);
  });

  it.each([MODULES_PATH, MODULE_SERVERS_PATH, MODULE_UIS_PATH, MODULE_SLOTS_PATH, MODULE_OWNS_PATH])(
    "%s matches the module folders",
    (path) => {
      expect(readFileSync(join(ROOT, path), "utf8"), `${path} is stale: run npm run generate:modules`).toBe(
        generated.files?.[path],
      );
    },
  );

  it("requires what the import graph shows, for every installed module (ADR 0017's first test)", () => {
    const installed = Object.keys(generated.graph);
    expect(generated.graph).toEqual(pinnedFor(installed));
  });
});

describe("removing a module from the installed list (ADR 0017 §5, §9)", () => {
  it.each(removals)("refuses the modules that import $removed, and says nothing else", ({ removed, refusals }) => {
    expect(without(removed)()).toEqual(refusals);
  });

  it("composes without the catalog (walk W1)", () => {
    expect(without("catalog")()).toEqual([]);
  });
});

describe("the manifest export a folder names", () => {
  it.each([
    ["bookings", "bookingsModule"],
    ["file-manager", "fileManagerModule"],
    ["a2-b3", "a2B3Module"],
    ["a--b", undefined],
    ["File-manager", undefined],
    ["file_manager", undefined],
    ["-x", undefined],
  ])("%s → %s", (folder, name) => {
    expect(manifestExportOf(folder)).toBe(name);
  });
});

describe("the UI export a folder names", () => {
  it.each([
    ["catalog", "catalogModuleUi"],
    ["file-manager", "fileManagerModuleUi"],
    ["File-manager", undefined],
  ])("%s → %s", (folder, name) => {
    expect(uiExportOf(folder)).toBe(name);
  });
});

describe("the generated client map (ADR 0017 §5)", () => {
  const text = () => `${generated.files?.[MODULE_UIS_PATH]}${generated.files?.[MODULE_SLOTS_PATH]}`;

  // From the installed modules' folders, so removing one leaves these cases standing (ADR 0017 §7).
  const withUiFile = MODULES.map(({ id }) => id).filter((id) => existsSync(join(ROOT, "src/modules", id, "ui.ts")));
  const withUiFolder = MODULES.map(({ id }) => id).filter(
    (id) => existsSync(join(ROOT, "src/modules", id, "ui")) && !withUiFile.includes(id),
  );

  it.each(withUiFile)("imports the ui.ts of %s", (id) => {
    expect(text()).toContain(`import { ${uiExportOf(id)} } from "@/modules/${id}/ui";`);
  });

  it.each(withUiFolder)("leaves out %s, whose ui is a folder of shared components, not a ui.ts", (id) => {
    expect(text()).not.toContain(`@/modules/${id}`);
  });

  const declared = MODULES.flatMap((module) => (module.views ?? []).map(({ id }) => id)).sort();
  const servers: readonly ModuleServer[] = MODULE_SERVERS;

  it("holds a renderer for every view kind a module declares, and no other", () => {
    expect(Object.keys(VIEW_RENDERERS).sort()).toEqual(declared);
  });

  it.each(declared)("%s has a loader and a dictionary in its module's server half", (kind) => {
    expect(servers.filter(({ viewLoaders }) => viewLoaders !== undefined && kind in viewLoaders)).toHaveLength(1);
    expect(servers.filter(({ viewBundles }) => viewBundles !== undefined && kind in viewBundles)).toHaveLength(1);
  });
});

describe("the route slots modules fill (ADR 0017 §4)", () => {
  const servers: readonly ModuleServer[] = MODULE_SERVERS;
  const manifests: readonly ModuleManifest[] = MODULES;
  const filled = manifests.flatMap((module) => (module.slots ?? []).map((fill) => ({ module: module.id, ...fill })));
  const slotsOfServerHalf = (id: string) => {
    const half = servers.find((server) => server.id === id);
    return [...Object.keys(half?.slotLoaders ?? {}), ...Object.keys(half?.slotBundles ?? {})];
  };

  it.each(filled)("$slot, filled by $module, has a loader or a dictionary in its module's server half", (fill) => {
    expect(slotsOfServerHalf(fill.module)).toContain(fill.slot);
  });

  it("holds a client fill for each slot whose server half has a dictionary, and no other", () => {
    const withBundle = servers.flatMap(({ slotBundles }) => Object.keys(slotBundles ?? {})).sort();
    expect(Object.keys(SLOT_FILLS).sort()).toEqual(withBundle);
  });

  const fillers = [...new Set(filled.map(({ module }) => module))];

  it.each(fillers)("generates the slot fills of %s from its ui.ts, apart from the view renderers", (id) => {
    expect(generated.files?.[MODULE_SLOTS_PATH]).toContain(`...${uiExportOf(id)}.slots`);
  });
});

describe("the bell's feeds (ADR 0017 'The bell')", () => {
  const servers: readonly ModuleServer[] = MODULE_SERVERS;
  const feeds = (MODULES as readonly ModuleManifest[]).flatMap((module) =>
    (module.feeds ?? []).map((feed) => ({ module: module.id, ...feed })),
  );

  it.each(feeds)("$feed, declared by $module, has a server half that words its rows", ({ module, feed }) => {
    expect(typeof servers.find((server) => server.id === module)?.feeds?.[feed]?.rows).toBe("function");
  });

  it("holds a server half for each feed a module declares, and no other", () => {
    const withHalf = servers.flatMap(({ feeds: halves }) => Object.keys(halves ?? {})).sort();
    expect(withHalf).toEqual(feeds.map(({ feed }) => feed).sort());
  });
});
