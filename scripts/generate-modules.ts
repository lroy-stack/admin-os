/**
 * Writes the composition root's module list (ADR 0017 §5) from the folders of `src/modules`:
 * `src/config/modules.generated.ts`, with static imports in id order, the import graph between modules and the
 * extension entities of their seeds, formatted by Biome like the files lint-staged checks. Run it with
 * `npm run generate:modules` after adding, removing or re-wiring a module; `scripts/generate-modules.test.ts` fails
 * while the file is stale. It exits 1, naming the module and the fix, when the folders cannot be composed.
 */

import {
  compositionProblems,
  type ImportRecord,
  type InstalledModule,
  type ModuleEdge,
  type ModuleManifest,
  moduleEdges,
  requiresOf,
  type UnloadedModule,
} from "@/core/module";

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));

export const MODULES_PATH = "src/config/modules.generated.ts";

const HEADER =
  "// Written by `npm run generate:modules` from the folders of src/modules; do not edit. A test fails when it is stale (ADR 0017 §5).";

/** What `generate` found: the problems that refuse the composition, or the file's text when there are none. */
export interface Generated {
  readonly problems: readonly string[];
  /** The file as `npm run generate:modules` writes it; absent while there are problems. */
  readonly text?: string;
  readonly modules: readonly InstalledModule[];
  readonly edges: readonly ModuleEdge[];
  /** What each module requires, whether or not it is installed. */
  readonly graph: Readonly<Record<string, readonly string[]>>;
}

const byCode = (a: string, b: string): number => Number(a > b) - Number(a < b);

/** A module folder is named in kebab-case, so its `<name>Module` export is a valid identifier. */
const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/** `file-manager` → `fileManagerModule`, the folder's manifest export; none for a folder not named in kebab-case. */
export const manifestExportOf = (folder: string): string | undefined =>
  KEBAB.test(folder)
    ? `${folder.replace(/-([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase())}Module`
    : undefined;

const moduleFolders = (root: string): string[] =>
  readdirSync(join(root, "src/modules"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(byCode);

type Loaded = InstalledModule | UnloadedModule;

/** The folder's manifest, or the problem that names the folder and the export it lacks. */
async function loadManifest(root: string, folder: string): Promise<Loaded> {
  const name = manifestExportOf(folder);
  if (name === undefined) {
    return { folder, problem: `src/modules/${folder}: name a module folder in kebab-case, such as "file-manager"` };
  }
  const refusal = `src/modules/${folder} has no manifest: export ${name} = defineModule({ id: "${folder}", ... }) from its index.ts`;
  try {
    const entry: Record<string, unknown> = await import(
      pathToFileURL(join(root, "src/modules", folder, "index.ts")).href
    );
    const manifest = entry[name] as ModuleManifest | undefined;
    return manifest === undefined ? { folder, problem: refusal } : { folder, manifest };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { folder, problem: `${refusal}; it failed to load: ${reason}` };
  }
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Every import in the module folders and their owned paths, runtime, type-only and test alike. The options are the
 * ones that keep the answer whole: no `includeOnly` (it drops unresolved imports, which name a deleted folder), no
 * `maxDepth` (it drops real edges) and no `.dependency-cruiser.cjs`; `node_modules` is excluded, which also keeps
 * the run under a second.
 */
async function importsOf(root: string, cruiseRoots: readonly string[]): Promise<ImportRecord[]> {
  const outside = `^(?!(?:${cruiseRoots.map(escapeRegExp).join("|")})(?:/|$))`;
  // Loaded here because the package is ESM only, and tsx runs this file as CommonJS: a static import is a `require`.
  const { cruise } = await import("dependency-cruiser");
  const { output } = await cruise(
    [...cruiseRoots],
    {
      baseDir: root,
      tsPreCompilationDeps: true,
      tsConfig: { fileName: join(root, "tsconfig.json") },
      exclude: "^node_modules/",
      doNotFollow: { path: outside },
    },
    undefined,
    undefined,
  );
  if (typeof output === "string") throw new Error("dependency-cruiser did not return its result as data");
  return output.modules.flatMap(({ source, dependencies }) =>
    dependencies.map(({ module, resolved, couldNotResolve }) => ({
      file: source,
      specifier: module,
      ...(couldNotResolve ? {} : { resolved }),
    })),
  );
}

const extensionEntities = (modules: readonly InstalledModule[]): string[] =>
  [
    ...new Set(
      modules.flatMap(({ manifest }) =>
        Object.values(manifest.seed).flatMap((collection) => (collection.ext ? [collection.ext.entity] : [])),
      ),
    ),
  ].sort(byCode);

/** The file before Biome formats it. */
function render(modules: readonly InstalledModule[], graph: Readonly<Record<string, readonly string[]>>): string {
  const names = modules.map(({ folder }) => [folder, manifestExportOf(folder)] as const);
  const entities = extensionEntities(modules);
  const requires = (id: string) => `[${(graph[id] ?? []).map((target) => JSON.stringify(target)).join(", ")}]`;
  return [
    HEADER,
    "",
    ...names.map(([folder, name]) => `import { ${name} } from "@/modules/${folder}";`),
    "",
    "/** The installed modules: the composition root reads their manifests from here. */",
    `export const MODULES = [${names.map(([, name]) => name).join(", ")}] as const;`,
    "",
    'export type InstalledModuleId = (typeof MODULES)[number]["id"];',
    "",
    "/** What each installed module requires, from every import between module folders (ADR 0017 §2). */",
    `export const MODULE_GRAPH = {${modules.map(({ folder }) => `${JSON.stringify(folder)}: ${requires(folder)}`).join(", ")}} as const satisfies Readonly<Record<InstalledModuleId, readonly InstalledModuleId[]>>;`,
    "",
    "/** Entities whose `ext` slot a preset may type (ADR 0004): the `ext` entities of the modules' seed collections. */",
    `export type ExtensionEntity = ${entities.length === 0 ? "never" : entities.map((entity) => JSON.stringify(entity)).join(" | ")};`,
    "",
  ].join("\n");
}

/** The text as Biome's `check --write` leaves it at `path`: the same layout and import order lint-staged enforces. */
function formatted(root: string, path: string, text: string): string {
  const biomeBin = createRequire(import.meta.url).resolve("@biomejs/biome/bin/biome");
  return execFileSync(process.execPath, [biomeBin, "check", "--write", "--stdin-file-path", join(root, path)], {
    cwd: root,
    input: text,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  });
}

/** Cruises the module folders, loads their manifests and checks them together; the file's text when nothing refuses. */
export async function generate(root: string = ROOT): Promise<Generated> {
  const folders = moduleFolders(root);
  const loaded = await Promise.all(folders.map((folder) => loadManifest(root, folder)));
  const modules = loaded.flatMap((entry) => ("manifest" in entry ? [entry] : []));
  const unloaded = loaded.flatMap((entry) => ("problem" in entry ? [entry] : []));
  const owners = modules.map(({ manifest }) => ({ id: manifest.id, owns: manifest.owns }));
  const cruiseRoots = [
    ...folders.map((folder) => `src/modules/${folder}`),
    ...owners.flatMap(({ owns }) => owns),
  ].filter((path) => existsSync(join(root, path)));
  const edges = moduleEdges(await importsOf(root, cruiseRoots), owners);
  const graph = requiresOf(
    edges,
    modules.map(({ manifest }) => manifest.id),
  );
  const problems = compositionProblems(modules, edges, (path) => existsSync(join(root, path)), unloaded);
  return {
    problems,
    ...(problems.length === 0 ? { text: formatted(root, MODULES_PATH, render(modules, graph)) } : {}),
    modules,
    edges,
    graph,
  };
}

async function main(): Promise<void> {
  const { problems, text } = await generate();
  if (text === undefined) {
    process.stderr.write(`${problems.join("\n")}\n`);
    process.exit(1);
  }
  const target = join(ROOT, MODULES_PATH);
  if (existsSync(target) && readFileSync(target, "utf8") === text) {
    process.stderr.write(`No changes in ${MODULES_PATH}\n`);
  } else {
    writeFileSync(target, text);
    process.stderr.write(`Wrote ${MODULES_PATH}\n`);
  }
}

// Resolved, so a path through a symlink (macOS's /tmp) still runs the CLI instead of exiting 0 having done nothing.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exit(1);
  });
}
