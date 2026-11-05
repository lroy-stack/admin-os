import type { z } from "zod";

import type { AnyCapability, Catalog } from "@/core/capability";

/**
 * The MCP manifest (spec 004 D5): which capabilities are tools and how they are presented. It selects and presents,
 * never redefines: a tool's inputs, output and effect always come from its capability.
 */

/** A capability offered as a tool, with the short human name clients show for it. */
export interface ExposedEntry {
  readonly expose: true;
  readonly title: string;
  /**
   * Where an agent finds a valid value for an id field: input field → the capabilities that list them. The
   * description names those tools, and so does `schema.invalid_input` when that field is wrong.
   */
  readonly ids?: Readonly<Record<string, readonly string[]>>;
  /**
   * The result as an agent gets it (spec 004 D5, principle 7): the capability's output parsed through this schema, so
   * a field it leaves out is stripped from the result and from the advertised output schema. The capability's own
   * output, which the web app reads, does not change. Use an object schema that strips unknown keys.
   */
  readonly concise?: z.ZodType;
  /**
   * Paths to free text that people or other agents wrote (`guestNote`, `notes[].text`, `items[].cancelReason`): each
   * is returned as `{ untrusted: true, text }`, in the result and in the output schema. A path that reaches no string
   * field of the output throws when the tool is projected.
   */
  readonly untrusted?: readonly string[];
}

/** A capability only the web app calls, with the reason it is not a tool. */
export interface UiOnlyEntry {
  readonly uiOnly: string;
}

export type ManifestEntry = ExposedEntry | UiOnlyEntry;

/** The manifest as the projection reads it; `ToolManifest` is the typed form a composition root declares. */
export type McpManifest = Readonly<Record<string, ManifestEntry>>;

/** The input fields of a capability, which its id hints may name. */
export type InputField<C extends AnyCapability> = keyof z.input<C["input"]> & string;

/** An exposed entry whose id hints name the capability's own input fields and, as `Hint`, the tools that list them. */
type TypedExposedEntry<C extends AnyCapability, Hint extends string> = Omit<ExposedEntry, "ids"> & {
  readonly ids?: { readonly [F in InputField<C>]?: readonly Hint[] };
};

/**
 * One entry per capability of the catalogue `M`: a capability added to `M` does not compile until it is classified.
 * An id hint names a capability of `M` by default. A module's own manifest widens `Hint`, since a hint may name
 * another module's tool; the composition root checks those hints against the installed catalogue (ADR 0017).
 */
export type ToolManifest<M extends Catalog, Hint extends string = keyof M & string> = {
  readonly [Id in keyof M]: UiOnlyEntry | TypedExposedEntry<M[Id], Hint>;
};

export const isExposed = (entry: ManifestEntry): entry is ExposedEntry => "expose" in entry;

/** Manifest bugs the types cannot catch for a wide catalogue; each message names the entries to fix. */
const manifestProblems = (catalog: Catalog, manifest: McpManifest): readonly string[] => {
  const entries = Object.entries(manifest);
  const unclassified = Object.keys(catalog).filter((id) => !Object.hasOwn(manifest, id));
  const unknown = entries.filter(([id]) => !Object.hasOwn(catalog, id)).map(([id]) => id);
  const blank = entries
    .filter(([, entry]) => (isExposed(entry) ? entry.title : entry.uiOnly).trim() === "")
    .map(([id]) => id);
  const exposed = new Set(entries.filter(([, entry]) => isExposed(entry)).map(([id]) => id));
  const strayHints = entries
    .filter(
      ([, entry]) =>
        isExposed(entry) && Object.values(entry.ids ?? {}).some((ids) => ids.some((id) => !exposed.has(id))),
    )
    .map(([id]) => id);
  return [
    ...(unclassified.length > 0
      ? [`Capabilities without an MCP manifest entry: ${unclassified.join(", ")}; classify each one`]
      : []),
    ...(unknown.length > 0 ? [`MCP manifest entries for no capability: ${unknown.join(", ")}`] : []),
    ...(blank.length > 0 ? [`MCP manifest entries without a title or a reason: ${blank.join(", ")}`] : []),
    ...(strayHints.length > 0 ? [`MCP manifest id hints that name no exposed tool: ${strayHints.join(", ")}`] : []),
  ];
};

/**
 * The capabilities the manifest exposes, in catalogue order. A capability without an entry, an entry for no
 * capability, an entry without its title or reason, or an id hint naming no tool is a manifest bug and throws.
 */
export const exposedCapabilities = (catalog: Catalog, manifest: McpManifest): AnyCapability[] => {
  const problems = manifestProblems(catalog, manifest);
  if (problems.length > 0) throw new Error(problems.join("; "));
  return Object.values(catalog).filter((capability) => isExposed(manifest[capability.id] as ManifestEntry));
};
