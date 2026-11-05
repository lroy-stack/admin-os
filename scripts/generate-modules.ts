/**
 * Writes the composition root's module lists (ADR 0017 §5) from the folders of `src/modules`, with static imports in
 * id order, formatted by Biome like the files lint-staged checks:
 * - `src/config/modules.generated.ts`: the manifests, the import graph between modules and the extension entities of
 *   their seeds;
 * - `src/config/modules.server.generated.ts`: the server halves (messages, mock answers and view loaders), server-only;
 * - `src/config/modules.client.generated.ts`: the view renderers of the modules that have a `ui.ts`, by view kind id;
 * - `src/config/modules.slots.generated.ts`: their route slot fills, by slot id, in a file of its own so a route that
 *   takes a fill does not bundle the view renderers (ADR 0017 §4).
 * Run it with `npm run generate:modules` after adding, removing or re-wiring a module; `scripts/generate-modules.test.ts`
 * fails while any file is stale. It exits 1, naming the module and the fix, when the folders cannot be composed.
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
export const MODULE_SERVERS_PATH = "src/config/modules.server.generated.ts";
export const MODULE_UIS_PATH = "src/config/modules.client.generated.ts";
export const MODULE_SLOTS_PATH = "src/config/modules.slots.generated.ts";
/** The paths modules own outside their folders, which `.dependency-cruiser.cjs` allows to import them (ADR 0017 §4). */
export const MODULE_OWNS_PATH = "src/config/modules.owns.generated.json";

const HEADER =
  "// Written by `npm run generate:modules` from the folders of src/modules; do not edit. A test fails when it is stale (ADR 0017 §5).";

/** What `generate` found: the problems that refuse the composition, or the files' text when there are none. */
export interface Generated {
  readonly problems: readonly string[];
  /** Each file, by path, as `npm run generate:modules` writes it; absent while there are problems. */
  readonly files?: Readonly<Record<string, string>>;
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

/**
 * `file-manager` → `fileManagerModuleUi`, the export of the folder's `ui.ts` (ADR 0017 §1). A folder joins the client
 * list only when it has a file named `ui.ts`: a folder named `ui/` of shared components is not a module UI, so it stays out without a special case.
 */
export const uiExportOf = (folder: string): string | undefined => {
  const manifest = manifestExportOf(folder);
  return manifest === undefined ? undefined : `${manifest}Ui`;
};

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
    if (manifest === undefined) return { folder, problem: refusal };
    // `server.ts` is server-only, so it is not imported here: a missing export fails `tsc` in the generated list.
    if (!existsSync(join(root, "src/modules", folder, "server.ts"))) {
      const server = `${name}Server`;
      return {
        folder,
        problem: `src/modules/${folder} has no server half: export ${server} = { id: ${name}.id, messages, mockHandlers } satisfies ModuleServer<typeof ${name}.id> from its server.ts`,
      };
    }
    return { folder, manifest };
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

/** The server halves' list before Biome formats it; `satisfies` pins each half to its manifest's id, in order. */
function renderServers(modules: readonly InstalledModule[]): string {
  const names = modules.map(({ folder }) => [folder, `${manifestExportOf(folder)}Server`] as const);
  return [
    HEADER,
    'import "server-only";',
    "",
    'import type { ServersOf } from "@/core/module";',
    ...names.map(([folder, name]) => `import { ${name} } from "@/modules/${folder}/server";`),
    "",
    'import type { MODULES } from "./modules.generated";',
    "",
    "/** The server halves of the installed modules, in the order of `MODULES`: their messages and mock answers. */",
    `export const MODULE_SERVERS = [${names.map(([, name]) => name).join(", ")}] as const satisfies ServersOf<typeof MODULES>;`,
    "",
  ].join("\n");
}

/** The folders of the modules that have a `ui.ts`, in id order. */
const uiFolders = (root: string, modules: readonly InstalledModule[]): string[] =>
  modules.map(({ folder }) => folder).filter((folder) => existsSync(join(root, "src/modules", folder, "ui.ts")));

/**
 * The client list before Biome formats it: a map from view kind id to renderer, from the `ui.ts` of the modules whose
 * manifest declares views. `satisfies` makes a kind with no renderer fail `tsc`, naming it, and a renderer for an
 * undeclared kind fail too.
 */
function renderClient(modules: readonly InstalledModule[], folders: readonly string[]): string {
  const names = declaring(modules, folders, "views");
  return [
    HEADER,
    "",
    'import type { ViewRenderer } from "@/core/views/ui";',
    ...names.map(([folder, name]) => `import { ${name} } from "@/modules/${folder}/ui";`),
    "",
    'import type { ProductViewKindId } from "./vertical";',
    "",
    "/** The renderer of each product view kind, from the `ui.ts` of the modules that declare it (ADR 0018 §3). */",
    `export const VIEW_RENDERERS = {${names.map(([, name]) => `...${name}.views`).join(", ")}} as const satisfies Readonly<Record<ProductViewKindId, ViewRenderer>>;`,
    "",
  ].join("\n");
}

/**
 * The slot list before Biome formats it: a map from slot id to fill, from the `ui.ts` of the modules whose manifest
 * declares slots. A route checks the fills it takes by assignment (ADR 0017 §4).
 */
function renderSlots(modules: readonly InstalledModule[], folders: readonly string[]): string {
  const names = declaring(modules, folders, "slots");
  return [
    HEADER,
    "",
    ...names.map(([folder, name]) => `import { ${name} } from "@/modules/${folder}/ui";`),
    "",
    "/** The fill of each route slot, from the `ui.ts` of the modules that fill it; a route takes the ones it declares. */",
    `export const SLOT_FILLS = {${names.map(([, name]) => `...${name}.slots`).join(", ")}} as const;`,
    "",
  ].join("\n");
}

/** The `ui.ts` exports of the folders whose manifest declares `key`, in id order. */
function declaring(modules: readonly InstalledModule[], folders: readonly string[], key: "views" | "slots") {
  return folders
    .filter((folder) => modules.some(({ folder: own, manifest }) => own === folder && (manifest[key]?.length ?? 0) > 0))
    .map((folder) => [folder, uiExportOf(folder)] as const);
}

/** The owned paths before Biome formats them: sorted, so the file changes only when an `owns` list does. */
function renderOwns(modules: readonly InstalledModule[]): string {
  const owned = [...new Set(modules.flatMap(({ manifest }) => manifest.owns))].sort(byCode);
  return `${JSON.stringify({ $comment: "Written by npm run generate:modules from the modules' owns; do not edit.", owned })}\n`;
}

/** The module list before Biome formats it. */
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

/** Cruises the module folders, loads their manifests and checks them together; each file's text when nothing refuses. */
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
    ...(problems.length === 0
      ? {
          files: {
            [MODULES_PATH]: formatted(root, MODULES_PATH, render(modules, graph)),
            [MODULE_SERVERS_PATH]: formatted(root, MODULE_SERVERS_PATH, renderServers(modules)),
            [MODULE_UIS_PATH]: formatted(root, MODULE_UIS_PATH, renderClient(modules, uiFolders(root, modules))),
            [MODULE_SLOTS_PATH]: formatted(root, MODULE_SLOTS_PATH, renderSlots(modules, uiFolders(root, modules))),
            [MODULE_OWNS_PATH]: formatted(root, MODULE_OWNS_PATH, renderOwns(modules)),
          },
        }
      : {}),
    modules,
    edges,
    graph,
  };
}

async function main(): Promise<void> {
  const { problems, files } = await generate();
  if (files === undefined) {
    process.stderr.write(`${problems.join("\n")}\n`);
    process.exit(1);
  }
  for (const [path, text] of Object.entries(files)) {
    const target = join(ROOT, path);
    if (existsSync(target) && readFileSync(target, "utf8") === text) {
      process.stderr.write(`No changes in ${path}\n`);
    } else {
      writeFileSync(target, text);
      process.stderr.write(`Wrote ${path}\n`);
    }
  }
}

// Resolved, so a path through a symlink (macOS's /tmp) still runs the CLI instead of exiting 0 having done nothing.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exit(1);
  });
}
