import { beforeAll, describe, expect, it } from "vitest";

import { VIEW_RENDERERS } from "@/config/modules.client.generated";
import { MODULES } from "@/config/modules.generated";
import { MODULE_SERVERS } from "@/config/modules.server.generated";
import { compositionProblems, type ModuleServer } from "@/core/module";

import {
  type Generated,
  generate,
  MODULE_SERVERS_PATH,
  MODULE_UIS_PATH,
  MODULES_PATH,
  manifestExportOf,
  ROOT,
  uiExportOf,
} from "./generate-modules";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let generated: Generated;

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

  it.each([MODULES_PATH, MODULE_SERVERS_PATH, MODULE_UIS_PATH])("%s matches the module folders", (path) => {
    expect(readFileSync(join(ROOT, path), "utf8"), `${path} is stale: run npm run generate:modules`).toBe(
      generated.files?.[path],
    );
  });

  it("requires what the import graph shows (ADR 0017's first test, against census C0)", () => {
    expect(generated.graph).toEqual({
      bookings: ["customers", "resources"],
      catalog: [],
      customers: [],
      inventory: [],
      notifications: ["bookings"],
      parties: [],
      resources: [],
      staff: [],
    });
  });
});

describe("removing a module from the installed list (ADR 0017 §5, §9)", () => {
  it("refuses a module that imports the one removed, and says nothing else", () => {
    expect(without("bookings")()).toEqual([
      "notifications requires bookings; restore src/modules/bookings or remove notifications",
    ]);
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
  const text = () => generated.files?.[MODULE_UIS_PATH] ?? "";

  it("imports the ui.ts of the modules that have one", () => {
    expect(text()).toContain('import { catalogModuleUi } from "@/modules/catalog/ui";');
    expect(text()).toContain('import { inventoryModuleUi } from "@/modules/inventory/ui";');
  });

  it("leaves out a module whose ui is a folder of shared components, not a ui.ts (customers)", () => {
    expect(existsSync(join(ROOT, "src/modules/customers/ui"))).toBe(true);
    expect(text()).not.toContain("customers");
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
