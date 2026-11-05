import { beforeAll, describe, expect, it } from "vitest";

import { MODULE_GRAPH } from "@/config/modules.generated";
import { compositionProblems } from "@/core/module";

import {
  type Generated,
  generate,
  MODULE_SERVERS_PATH,
  MODULES_PATH,
  manifestExportOf,
  ROOT,
} from "./generate-modules";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let generated: Generated;

/**
 * Census C0 (ADR 0017): what each of the first six modules required when the import graph was first counted. A module
 * that is not installed has no row, and a target that is not installed is dropped from the rows that name it, so the
 * census still holds after a removal.
 */
const C0: Readonly<Record<string, readonly string[]>> = {
  bookings: ["customers", "resources"],
  catalog: [],
  customers: [],
  notifications: ["bookings"],
  resources: [],
  staff: [],
};

const c0Of = (installed: readonly string[]) =>
  Object.fromEntries(
    Object.entries(C0)
      .filter(([id]) => installed.includes(id))
      .map(([id, targets]) => [id, targets.filter((target) => installed.includes(target))]),
  );

/** The graph's rows for the modules the census knows. */
const censusOf = (graph: Readonly<Record<string, readonly string[]>>) =>
  Object.fromEntries(Object.entries(graph).filter(([id]) => id in C0));

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

  it.each([MODULES_PATH, MODULE_SERVERS_PATH])("%s matches the module folders", (path) => {
    expect(readFileSync(join(ROOT, path), "utf8"), `${path} is stale: run npm run generate:modules`).toBe(
      generated.files?.[path],
    );
  });

  it("requires what the import graph shows (ADR 0017's first test, against census C0)", () => {
    const installed = Object.keys(generated.graph);
    expect(censusOf(generated.graph)).toEqual(c0Of(installed));
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
