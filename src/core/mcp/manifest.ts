import type { AnyCapability, Catalog } from "@/core/capability";

/**
 * The MCP manifest (spec 004 D5): which capabilities are tools and how they are presented. It selects and presents,
 * never redefines: a tool's inputs, output and effect always come from its capability.
 */

/** A capability offered as a tool, with the short human name clients show for it. */
export interface ExposedEntry {
  readonly expose: true;
  readonly title: string;
}

/** A capability only the web app calls, with the reason it is not a tool. */
export interface UiOnlyEntry {
  readonly uiOnly: string;
}

export type ManifestEntry = ExposedEntry | UiOnlyEntry;

/** The manifest as the projection reads it; `ToolManifest` is the typed form a composition root declares. */
export type McpManifest = Readonly<Record<string, ManifestEntry>>;

/** One entry per capability of the catalogue `M`: a capability added to `M` does not compile until it is classified. */
export type ToolManifest<M extends Catalog> = { readonly [Id in keyof M]: ManifestEntry };

export const isExposed = (entry: ManifestEntry): entry is ExposedEntry => "expose" in entry;

/**
 * The capabilities the manifest exposes, in catalogue order. A capability without an entry, an entry for no
 * capability, or an entry without its title or reason is a manifest bug and throws.
 */
export const exposedCapabilities = (catalog: Catalog, manifest: McpManifest): AnyCapability[] => {
  const unclassified = Object.keys(catalog).filter((id) => !Object.hasOwn(manifest, id));
  if (unclassified.length > 0) {
    throw new Error(`Capabilities without an MCP manifest entry: ${unclassified.join(", ")}; classify each one`);
  }
  const unknown = Object.keys(manifest).filter((id) => !Object.hasOwn(catalog, id));
  if (unknown.length > 0) throw new Error(`MCP manifest entries for no capability: ${unknown.join(", ")}`);
  const blank = Object.entries(manifest)
    .filter(([, entry]) => (isExposed(entry) ? entry.title : entry.uiOnly).trim() === "")
    .map(([id]) => id);
  if (blank.length > 0) throw new Error(`MCP manifest entries without a title or a reason: ${blank.join(", ")}`);
  return Object.values(catalog).filter((capability) => isExposed(manifest[capability.id] as ManifestEntry));
};
