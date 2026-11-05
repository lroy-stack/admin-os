import type { McpManifest, ToolManifest } from "@/core/mcp/server";
import { composeMcpManifest } from "@/core/module";

import type { CapabilityId, CatalogById, KernelCatalogById } from "./catalog";
import { MODULES } from "./modules.generated";

/**
 * The MCP manifest of the kit (spec 004 D5): every capability is either a tool, with the title clients show, or
 * UI-only, with the reason. A new capability does not compile until it is classified: here for the kernel, and in its
 * module's manifest otherwise (ADR 0017 §1). Inputs, outputs and effects stay the capability's own; `ids` names, per
 * id field, the tools that list valid values (spec 004 U3).
 *
 * Least data (spec 004 principle 7, AC8): a list tool returns `concise` rows, without the free text and the personal
 * data an agent does not need to pick a record; the full record stays one `get` away. The web app reads the
 * capability's own output, which is not changed. Free text that people or other agents wrote is `untrusted`: returned
 * as `{ untrusted: true, text }` wherever a tool returns it (ADR 0016, "Untrusted free text").
 * Names, tags and contact data of a record stay plain values, since an agent needs them to search and book, and the
 * server instructions tell it to treat every string as data; `contactName` is free text typed for a booking, so it
 * is marked. Notifications, resources, the catalogue and approvals carry no notes or contact data, so they stay as
 * they are.
 */
export const KERNEL_TOOLS = {
  "access.me.get": { expose: true, title: "Who am I" },
  "approvals.get": { expose: true, title: "Check a held write" },
  "approvals.list": {
    uiOnly:
      "The queue a person decides from; it returns the held input, which an assistant has no need to read (spec 004, D7)",
  },
  "approvals.approve": {
    uiOnly: "Approving is the human step the policy exists for; an assistant must never approve its own write (D7)",
  },
  "approvals.reject": {
    uiOnly: "Rejecting is a person's decision, taken in the web app (D7)",
  },
  "approvals.policy.set": {
    uiOnly: "The owner's control over what assistants may do without asking; elevated and never an MCP tool (D7)",
  },
  "clock.get": { expose: true, title: "Business clock" },
  "settings.values.get": { expose: true, title: "Read settings" },
  "settings.values.update": { expose: true, title: "Change settings" },
} as const satisfies ToolManifest<KernelCatalogById>;

/**
 * The kernel's entries, then the installed modules' in id order, with the id hints to absent modules dropped (ADR
 * 0017 §5). It is typed as a manifest of the whole catalogue: the guards below hold what that type asserts.
 */
export const MCP_MANIFEST = composeMcpManifest(KERNEL_TOOLS, MODULES) as McpManifest & ToolManifest<CatalogById>;

type ElementOf<L> = L extends readonly (infer E)[] ? E : never;
type KeysOf<T> = T extends unknown ? keyof T : never;
type ModuleOfId<Id> = Id extends `${infer M}.${string}` ? M : never;
type HintListsOf<T> = T extends unknown
  ? { [Id in keyof T]: T[Id] extends { readonly ids: infer I } ? I[keyof I] : never }[keyof T]
  : never;

/** The tools named in `Tools` that belong to an installed module (or the kernel) but that it does not declare. */
type StrayOf<Tools> = Exclude<Extract<Tools, `${ModuleOfId<CapabilityId>}.${string}`>, CapabilityId>;

/** The id hints in a set of tool entries that name a missing tool of an installed module; a hint to an absent module is not stray. */
export type StrayHintOf<Entries> = StrayOf<ElementOf<HintListsOf<Entries>>>;

type ModuleMcp = (typeof MODULES)[number]["mcp"];

/** `true` when `T` is `never`; otherwise `T` itself, so a failed guard names what is wrong. */
type NoneOr<T> = [T] extends [never] ? true : T;
type Holds<T extends true> = T;

/**
 * Compile-time guards for what `MCP_MANIFEST`'s type asserts that the parts do not check alone (each fails `tsc`
 * naming the culprit): every capability is classified, and every module's id hint names a tool that exists or belongs
 * to an absent module. The kernel's entries, the hints' fields and the id sources are checked where they are declared:
 * `satisfies ToolManifest<KernelCatalogById>` above, and `defineModule`.
 */
export type McpManifestGuards = [
  Holds<NoneOr<Exclude<CapabilityId, keyof typeof KERNEL_TOOLS | KeysOf<ModuleMcp["tools"]>>>>,
  Holds<NoneOr<StrayHintOf<ModuleMcp["tools"]>>>,
];
