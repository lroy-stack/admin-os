import { describe, expect, it } from "vitest";

import { type InstalledModule, type ModuleManifest, moduleProblems } from "@/core/module";

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const modulesDir = __dirname;
const repoRoot = join(modulesDir, "..", "..");

/** Every folder under `src/modules` is a module, as the generator will find it (ADR 0017 §5). */
const folders = readdirSync(modulesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

/** `<module>Module` from the folder's `index.ts`, the export ADR 0017 §1 names; a kebab folder names it in camel case. */
const exportName = (folder: string) =>
  `${folder.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())}Module`;

/** A folder whose `index.ts` is missing or throws still gets its own failing case, with the reason. */
const load = async (folder: string) => {
  const why = `src/modules/${folder}/index.ts must export ${exportName(folder)}`;
  try {
    const exports = (await import(join(modulesDir, folder, "index.ts"))) as Readonly<Record<string, unknown>>;
    return { folder, why, manifest: exports[exportName(folder)] as ModuleManifest | undefined };
  } catch (error) {
    return { folder, why: `${why}; it failed to load: ${String(error)}`, manifest: undefined };
  }
};

const found = await Promise.all(folders.map(load));
const installed = found.flatMap(({ folder, manifest }): InstalledModule[] => (manifest ? [{ folder, manifest }] : []));

describe("module manifests (ADR 0017 §1)", () => {
  it("finds the module folders", () => {
    expect(folders).not.toHaveLength(0);
  });

  it.each(found)("$folder exports its manifest from index.ts", ({ why, manifest }) => {
    expect(manifest, why).toBeDefined();
  });

  it("are consistent with each other and with the repository", () => {
    expect(moduleProblems(installed, (path) => existsSync(join(repoRoot, path)))).toEqual([]);
  });
});
