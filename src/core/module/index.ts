import { z } from "zod";

import { KERNEL_MODULES } from "@/core/access";
import type { AnyCapability, Catalog } from "@/core/capability";
import type { Locale } from "@/core/i18n";
// Types only: they are erased, so a client bundle that reads a manifest never reaches the server-only entry.
import type { InputField, ManifestEntry, McpManifest, ToolManifest } from "@/core/mcp/server";
import type { MockHandler } from "@/core/mock";
import type { ModuleId } from "@/core/nav";
import type { AnySetting } from "@/core/settings";

/**
 * A module's manifest (ADR 0017 §1): what the composition root needs from a module folder, as data and descriptors
 * only, since the Workers read it and must never reach web code. Each module exports `<module>Module` from its
 * `index.ts`; `moduleProblems` checks the installed manifests together.
 */

/**
 * A capability id as an MCP id hint names it. A hint may name another module's tool without importing that module,
 * not even as a type; the composition root type-checks it against the installed catalogue (ADR 0017).
 */
export type CapabilityRef = `${string}.${string}`;

/** A field of a seed collection that holds another module's ids, which no import shows (ADR 0017 §3). */
export interface ModuleReference {
  /** The seed collection whose rows hold the field; the installed module that seeds it gives the row schema. */
  readonly collection: string;
  /** The field's path in a row: `customerId`, `staffIds[]`, `lines[].catalogItemId`. */
  readonly field: string;
  /** The module whose records the ids name. */
  readonly module: ModuleId;
  /**
   * A required reference refuses the module without its target. An optional one reads an absent target's collection
   * as empty and an id that matches nothing as unknown, never as a throw.
   */
  readonly required: boolean;
}

/** One seed collection of the module: its row schema, and whether every preset that enables the module seeds rows. */
export interface SeedCollection {
  readonly schema: z.ZodType;
  readonly required: boolean;
  /** The entity whose `ext` slot a preset may type (ADR 0004); `optional` lets a row leave `ext` out even then. */
  readonly ext?: { readonly entity: string; readonly optional: boolean };
}

/**
 * Where an assistant finds a kind of id, as the MCP server's instructions name it: a label and the module's own tools
 * that list those ids (ADR 0017 §1). Modules that list the same kind are merged by label, so a removed module takes
 * only its own tools with it.
 */
export type IdSources = readonly (readonly [label: string, tools: readonly CapabilityRef[]])[];

export interface ModuleManifest<
  Id extends string = string,
  C extends Catalog = Catalog,
  T extends ToolManifest<C, CapabilityRef> = ToolManifest<C, CapabilityRef>,
  S extends IdSources = IdSources,
> {
  /** The folder's name, and the first segment of every capability id and setting key. */
  readonly id: Id;
  readonly capabilities: C;
  /** The settings it declares (ADR 0006). */
  readonly settings: readonly AnySetting[];
  readonly mcp: {
    /** What the module keeps, as the server's instructions name it ("catalog items"). */
    readonly noun: string;
    /** One entry per capability (spec 004 D5); an id hint names this module's tool or a referenced module's. */
    readonly tools: T;
    /** The kinds of id its own tools list, and those tools. */
    readonly idSources: S;
  };
  /** The seed collections it owns, by name. */
  readonly seed: Readonly<Record<string, SeedCollection>>;
  readonly references: readonly ModuleReference[];
  /** Repository paths outside the folder that go with it: its routes, config tests and e2e specs. One owner each. */
  readonly owns: readonly string[];
}

/** Keys that must not be there: each one is typed `never`, so a value under it does not compile. */
type Refused<K extends PropertyKey> = { readonly [P in K]: never };

/** Per exposed entry, the id-hint fields its capability has no input for. */
type UnknownHintFields<C extends Catalog, T> = {
  readonly [K in keyof T & keyof C]: T[K] extends { readonly ids: infer I }
    ? { readonly ids: Refused<Exclude<keyof I, C[K] extends AnyCapability ? InputField<C[K]> : never>> }
    : unknown;
};

/**
 * Identity helper that keeps the literal id, capability ids and hints the composition root type-checks. None of these
 * compile: a capability outside the module's prefix, an MCP entry for no capability, a capability without an entry,
 * an id hint for a field the capability has no input for, and an id source naming a tool the module does not declare.
 */
export const defineModule = <
  const Id extends string,
  const C extends Catalog,
  const T extends ToolManifest<C, CapabilityRef>,
  const S extends IdSources,
>(
  manifest: ModuleManifest<Id, C, T, S> & {
    readonly capabilities: Refused<Exclude<keyof C, `${Id}.${string}`>>;
    readonly mcp: {
      readonly tools: Refused<Exclude<keyof T, keyof C>> & UnknownHintFields<C, T>;
      readonly idSources: readonly (readonly [string, readonly (keyof C & string)[]])[];
    };
  },
): ModuleManifest<Id, C, T, S> => manifest;

/**
 * The server half of a module (ADR 0017 §1), exported from its `server.ts` as `<module>ModuleServer`: the messages of
 * its namespace and its mock answers. Declare it with `satisfies ModuleServer` and `id: <module>Module.id`, never with
 * a type annotation: `satisfies` keeps the literal id and each handler's own seed type, which the composition root
 * checks against every preset's seed. `MockHandler<never>` only bounds the handlers; read through it, they accept
 * nothing.
 */
export interface ModuleServer<Id extends string = string> {
  readonly id: Id;
  readonly messages: Readonly<Record<Locale, unknown>>;
  readonly mockHandlers: Readonly<Record<string, MockHandler<never>>>;
}

/**
 * The server halves a list of manifests needs, in its order, each pinned to its manifest's id. Generic so that it maps
 * a tuple to a tuple; the generated server list `satisfies` it.
 */
export type ServersOf<M extends readonly { readonly id: string }[]> = {
  readonly [I in keyof M]: ModuleServer<M[I] extends { readonly id: infer Id extends string } ? Id : never>;
};

/** A manifest as the module folder that exports it was found. */
export interface InstalledModule {
  readonly folder: string;
  readonly manifest: ModuleManifest;
}

/** Wrappers that parse their inner schema's value, each with `unwrap()`. */
const WRAPPERS = [
  z.ZodOptional,
  z.ZodNullable,
  z.ZodDefault,
  z.ZodPrefault,
  z.ZodNonOptional,
  z.ZodReadonly,
  z.ZodCatch,
  z.ZodLazy,
] as const;

const unwrap = (schema: z.ZodType): z.ZodType => {
  const wrapper = WRAPPERS.find((kind) => schema instanceof kind);
  if (wrapper !== undefined) return unwrap((schema as InstanceType<typeof wrapper>).unwrap() as z.ZodType);
  return schema instanceof z.ZodPipe ? unwrap(schema.in as z.ZodType) : schema;
};

/** The schema at a reference path (`lines[].catalogItemId`): `[]` steps into an array's element. */
const schemaAt = (schema: z.ZodType, path: readonly string[]): z.ZodType | undefined => {
  const [segment, ...rest] = path;
  if (segment === undefined) return unwrap(schema);
  const object = unwrap(schema);
  if (!(object instanceof z.ZodObject)) return undefined;
  const name = segment.endsWith("[]") ? segment.slice(0, -2) : segment;
  const field = (object.shape as Readonly<Record<string, z.ZodType | undefined>>)[name];
  if (field === undefined) return undefined;
  if (!segment.endsWith("[]")) return schemaAt(field, rest);
  const array = unwrap(field);
  return array instanceof z.ZodArray ? schemaAt(array.element as z.ZodType, rest) : undefined;
};

/**
 * Whether `path` reaches a string field of rows parsed by `schema`, as an id reference must. String formats
 * (`z.uuid()`, `z.email()`) and template literals are strings too.
 */
export const isStringField = (schema: z.ZodType, path: string): boolean => {
  const leaf = schemaAt(schema, path.split("."));
  return leaf instanceof z.core.$ZodString || leaf instanceof z.ZodTemplateLiteral;
};

/**
 * An owned path is written relative to the repository root, segment by segment: no leading or trailing `/`, no `.`
 * or `..`, no empty segment. Only then does the overlap check below compare like with like.
 */
const isCanonical = (path: string) =>
  path.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");

/** Whether one owned path contains the other, or is it: a path has one owner (ADR 0017 §7). */
const overlaps = (a: string, b: string) => a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);

const prefixOf = (id: string) => id.split(".")[0] ?? id;

/** The kernel is always installed (ADR 0004), so a hint may name its tools without a reference. */
const KERNEL: ReadonlySet<string> = new Set(KERNEL_MODULES);

/**
 * Names a module cannot take: the kernel's capability prefixes, plus the namespaces of its messages (`nav`) and
 * settings (`business`). The composition merges messages and settings by namespace, so a module named like one would
 * overwrite the kernel's silently.
 */
const KERNEL_NAMESPACES: ReadonlySet<string> = new Set([...KERNEL_MODULES, "nav", "business"]);

/** The tools an entry's id hints name; a UI-only entry has none. */
const hintsOf = (entry: ManifestEntry): string[] => Object.values("ids" in entry ? (entry.ids ?? {}) : {}).flat();

/**
 * A problem with the modules it is about, so a module that lacks a requirement can hide the rest of its own. A
 * problem between two modules stays while either of them is not refused.
 */
interface Problem {
  readonly modules: readonly string[];
  readonly message: string;
}

const about = (modules: string | readonly string[], messages: readonly string[]): Problem[] =>
  messages.map((message) => ({ modules: typeof modules === "string" ? [modules] : modules, message }));

function identityProblems({ folder, manifest }: InstalledModule): Problem[] {
  const { id } = manifest;
  const strayCapabilities = Object.entries(manifest.capabilities)
    .filter(([key, capability]) => !key.startsWith(`${id}.`) || capability.id !== key)
    .map(([key]) => key);
  const straySettings = manifest.settings.map(({ key }) => key).filter((key) => !key.startsWith(`${id}.`));
  return about(id, [
    ...(id === folder ? [] : [`src/modules/${folder}: the manifest's id is "${id}"; set it to "${folder}"`]),
    ...(KERNEL_NAMESPACES.has(id) ? [`src/modules/${folder}: "${id}" is a kernel namespace; rename the module`] : []),
    ...(strayCapabilities.length > 0
      ? [`${id}: capabilities ${strayCapabilities.join(", ")} must be keyed by their own id, under "${id}."`]
      : []),
    ...(straySettings.length > 0 ? [`${id}: settings ${straySettings.join(", ")} must start with "${id}."`] : []),
  ]);
}

function ownershipProblems(modules: readonly InstalledModule[], pathExists: (path: string) => boolean): Problem[] {
  const owned = modules.flatMap(({ manifest }) => manifest.owns.map((path) => ({ id: manifest.id, path })));
  const crooked = owned
    .filter(({ path }) => !isCanonical(path))
    .map(({ id, path }) =>
      about(id, [`${id} owns "${path}"; write it from the repository root, without ".", ".." or an edge "/"`]),
    );
  const canonical = owned.filter(({ path }) => isCanonical(path));
  const missing = canonical
    .filter(({ path }) => !pathExists(path))
    .map(({ id, path }) =>
      about(id, [`${id} owns ${path}, which does not exist; fix the path or remove it from owns`]),
    );
  const twice = canonical.flatMap((a, index) =>
    canonical
      .slice(index + 1)
      .filter((b) => overlaps(a.path, b.path))
      .map((b) => about([a.id, b.id], [`${a.path} (${a.id}) and ${b.path} (${b.id}) overlap; a path has one owner`])),
  );
  return [...crooked, ...missing, ...twice].flat();
}

function seedProblems(modules: readonly InstalledModule[]): Problem[] {
  const collections = modules.flatMap(({ manifest }) =>
    Object.entries(manifest.seed).map(([name, collection]) => ({
      id: manifest.id,
      name,
      entity: collection.ext?.entity,
    })),
  );
  const seededTwice = collections.flatMap((a, index) =>
    collections
      .slice(index + 1)
      .filter((b) => b.name === a.name)
      .map((b) =>
        about([a.id, b.id], [`the seed collection ${a.name} is declared by ${a.id} and ${b.id}; one module owns it`]),
      ),
  );
  const typedTwice = collections.flatMap((a, index) =>
    collections
      .slice(index + 1)
      .filter((b) => a.entity !== undefined && b.entity === a.entity)
      .map((b) =>
        about([a.id, b.id], [`the ext entity ${a.entity} is declared by ${a.id} (${a.name}) and ${b.id} (${b.name})`]),
      ),
  );
  return [...seededTwice, ...typedTwice].flat();
}

function referenceProblems(modules: readonly InstalledModule[]): Problem[] {
  const seeds = new Map(
    modules.flatMap(({ manifest }) => Object.entries(manifest.seed).map(([name, { schema }]) => [name, schema])),
  );
  return modules.flatMap(({ manifest: { id, references } }) =>
    references.flatMap(({ collection, field, module }) => {
      const where = `${id}'s reference ${collection}.${field} → ${module}`;
      const schema = seeds.get(collection);
      if (schema === undefined) return about(id, [`${where}: no installed module seeds the collection ${collection}`]);
      return about(
        id,
        isStringField(schema, field) ? [] : [`${where}: ${field} is not a string field of ${collection}'s rows`],
      );
    }),
  );
}

/** A module's id sources name its own tools only, so removing a module never leaves a source naming its tools. */
function idSourceProblems(modules: readonly InstalledModule[]): Problem[] {
  return modules.flatMap(({ manifest: { id, capabilities, mcp } }) =>
    mcp.idSources.flatMap(([label, tools]) =>
      about(
        id,
        tools
          .filter((tool) => !Object.hasOwn(capabilities, tool))
          .map((tool) => `${id}'s source of ${label} names ${tool}, which ${id} does not declare; list its own tools`),
      ),
    ),
  );
}

function hintProblems(modules: readonly InstalledModule[]): Problem[] {
  const catalogs = new Map(modules.map(({ manifest }) => [manifest.id, manifest.capabilities]));
  return modules.flatMap(({ manifest: { id, capabilities, references, mcp } }) => {
    const referenced = new Set(references.map(({ module }) => module));
    const entries = Object.entries(mcp.tools as Readonly<Record<string, ManifestEntry>>);
    return entries.flatMap(([tool, entry]) =>
      hintsOf(entry).flatMap((hint) => {
        const owner = prefixOf(hint);
        if (owner === id) {
          return about(
            id,
            Object.hasOwn(capabilities, hint) ? [] : [`${tool} hints ${hint}, which ${id} does not declare`],
          );
        }
        // A kernel tool exists in every composition; the composition root's guards check its name.
        if (KERNEL.has(owner)) return [];
        if (!referenced.has(owner)) {
          return about(id, [`${tool} hints ${hint}, but ${id} declares no reference to ${owner}; add the reference`]);
        }
        const target = catalogs.get(owner);
        return about(
          id,
          target === undefined || Object.hasOwn(target, hint)
            ? []
            : [`${tool} hints ${hint}, which ${owner} does not declare`],
        );
      }),
    );
  });
}

const byCode = (a: string, b: string): number => Number(a > b) - Number(a < b);

/** An import of one module's code or owned paths by another's: `from` needs `to` installed (ADR 0017 §2). */
export interface ModuleEdge {
  readonly from: string;
  readonly to: string;
  /** The importing file, as a repository path. */
  readonly file: string;
}

/** One import as the scanner saw it. `resolved` is a repository path, absent when the import did not resolve. */
export interface ImportRecord {
  readonly file: string;
  readonly specifier: string;
  readonly resolved?: string;
}

/** A module and the repository paths outside its folder that go with it. */
export interface ModuleOwner {
  readonly id: string;
  readonly owns: readonly string[];
}

const FOLDER = /^src\/modules\/([^/]+)(?:\/|$)/;
const ALIAS = /^@\/modules\/([^/]+)(?:\/|$)/;

/** `a/b/../c` → `a/c`; a path that climbs out of the repository keeps its leading `..`. */
const normalize = (path: string): string => {
  const kept: string[] = [];
  for (const segment of path.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === ".." && kept.length > 0 && kept.at(-1) !== "..") kept.pop();
    else kept.push(segment);
  }
  return kept.join("/");
};

const dirnameOf = (file: string): string => file.slice(0, Math.max(0, file.lastIndexOf("/")));

/**
 * The module-to-module import edges (ADR 0017 §2), from every import in the module folders and owned paths: runtime,
 * type-only and test imports alike, since the record carries no type. A folder that was deleted still names its
 * module, through the alias or the relative path of an import that no longer resolves. A deleted module's owned paths
 * outside its folder cannot be named that way, since its manifest is gone with it: `tsc` reports those imports.
 */
export function moduleEdges(imports: readonly ImportRecord[], owners: readonly ModuleOwner[]): ModuleEdge[] {
  const ownerOf = (path: string): string | undefined =>
    FOLDER.exec(path)?.[1] ??
    owners.find(({ owns }) => owns.some((owned) => path === owned || path.startsWith(`${owned}/`)))?.id;
  const targetOf = ({ file, specifier, resolved }: ImportRecord): string | undefined => {
    if (resolved !== undefined) return ownerOf(resolved);
    const alias = ALIAS.exec(specifier)?.[1];
    if (alias !== undefined) return alias;
    return specifier.startsWith(".") ? ownerOf(normalize(`${dirnameOf(file)}/${specifier}`)) : undefined;
  };
  const seen = new Set<string>();
  return imports.flatMap((record) => {
    const from = ownerOf(record.file);
    const to = targetOf(record);
    const key = `${from}\0${to}\0${record.file}`;
    if (from === undefined || to === undefined || from === to || seen.has(key)) return [];
    seen.add(key);
    return [{ from, to, file: record.file }];
  });
}

/** What each installed module requires (`MODULE_GRAPH`): the sorted, distinct ids its code imports from. */
export function requiresOf(edges: readonly ModuleEdge[], installedIds: readonly string[]): Record<string, string[]> {
  return Object.fromEntries(
    installedIds.map((id) => [
      id,
      [...new Set(edges.filter(({ from, to }) => from === id && to !== id).map(({ to }) => to))].sort(byCode),
    ]),
  );
}

/** A module folder whose manifest could not be read, with the problem that says why. */
export interface UnloadedModule {
  readonly folder: string;
  readonly problem: string;
}

/**
 * Why the module folders cannot be composed (ADR 0017 §1–§3, §5, §7), in this order:
 * 1. a module that needs one whose folder is gone, by an import or a required reference: refused alone, since its
 *    other problems, and a manifest that fails to load on that import, would only echo the missing module;
 * 2. a folder whose manifest cannot be read; a module that needs it waits for that fix rather than being told to
 *    restore a folder that is there;
 * 3. every other problem of the modules not refused.
 * Each message names the module and the fix; `pathExists` answers for a repository path.
 */
export const compositionProblems = (
  modules: readonly InstalledModule[],
  edges: readonly ModuleEdge[],
  pathExists: (path: string) => boolean,
  unloaded: readonly UnloadedModule[] = [],
): readonly string[] => {
  const broken = new Set(unloaded.map(({ folder }) => folder));
  const present = new Set([...modules.map(({ manifest }) => manifest.id), ...broken]);
  const needs = [
    ...modules.map(({ manifest: { id, references } }) => ({
      id,
      required: references.filter(({ required }) => required).map(({ module }) => module),
    })),
    ...unloaded.map(({ folder }) => ({ id: folder, required: [] as string[] })),
  ].map(({ id, required }) => ({
    id,
    targets: [...new Set([...edges.filter(({ from }) => from === id).map(({ to }) => to), ...required])]
      .filter((target) => target !== id)
      .sort(byCode),
  }));
  const requirements = needs.flatMap(({ id, targets }) =>
    targets.filter((target) => !present.has(target)).map((target) => ({ module: id, target })),
  );
  const refused = new Set(requirements.map(({ module }) => module));
  const waiting = new Set(
    needs.filter(({ targets }) => targets.some((target) => broken.has(target))).map(({ id }) => id),
  );
  const quiet = (id: string) => refused.has(id) || waiting.has(id);
  const rest = [
    ...modules.flatMap(identityProblems),
    ...ownershipProblems(modules, pathExists),
    ...seedProblems(modules),
    ...referenceProblems(modules),
    ...hintProblems(modules),
    ...idSourceProblems(modules),
  ].filter(({ modules: about }) => about.some((id) => !quiet(id)));
  return [
    ...requirements.map(
      ({ module, target }) => `${module} requires ${target}; restore src/modules/${target} or remove ${module}`,
    ),
    ...unloaded.filter(({ folder }) => !refused.has(folder)).map(({ problem }) => problem),
    ...rest.map(({ message }) => message),
  ];
};

/**
 * The entry without the id hints that name a tool of a module that is not installed. A field that loses all its hints
 * goes, and so does `ids` when no field is left; an entry that loses nothing is returned as it is.
 */
const withoutAbsentHints = (entry: ManifestEntry, installed: ReadonlySet<string>): ManifestEntry => {
  if (!("ids" in entry) || entry.ids === undefined) return entry;
  const fields = Object.entries(entry.ids).map(
    ([field, hints]) => [field, hints, hints.filter((hint) => installed.has(prefixOf(hint)))] as const,
  );
  if (fields.every(([, hints, kept]) => kept.length === hints.length)) return entry;
  const kept = fields
    .filter(([, hints, installedHints]) => installedHints.length > 0 || hints.length === 0)
    .map(([field, , installedHints]) => [field, installedHints] as const);
  const { ids: _dropped, ...rest } = entry;
  return kept.length === 0 ? rest : { ...rest, ids: Object.fromEntries(kept) };
};

/**
 * The MCP manifest of a composition (ADR 0017 §5, the amendment to ADR 0009 and 0016): the kernel's entries, then each
 * installed module's in the order given, with the id hints that name a tool of a module that is not installed dropped.
 * Compose it once, at module level: the server caches its tool list per manifest object.
 */
export const composeMcpManifest = (
  kernel: McpManifest,
  modules: readonly { readonly id: string; readonly mcp: { readonly tools: McpManifest } }[],
): McpManifest => {
  const installed = new Set([...Object.keys(kernel).map(prefixOf), ...modules.map(({ id }) => id)]);
  return Object.fromEntries(
    [kernel, ...modules.map(({ mcp }) => mcp.tools)]
      .flatMap((tools) => Object.entries(tools))
      .map(([id, entry]) => [id, withoutAbsentHints(entry, installed)]),
  );
};
