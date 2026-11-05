import { accessCapabilities } from "@/core/access";
import { approvalsCapabilities } from "@/core/approvals";
import { mergeCatalogs } from "@/core/capability";
import { clockCapabilities } from "@/core/clock";
import { settingsCapabilities } from "@/core/settings";

import { MODULES } from "./modules.generated";

/** The kernel's catalogues, always installed (ADR 0004). */
export const KERNEL_CATALOGS = [
  accessCapabilities,
  approvalsCapabilities,
  clockCapabilities,
  settingsCapabilities,
] as const;

/**
 * The catalogues the kit merges, kept with their literal ids and effects (`mergeCatalogs` returns a wide `Catalog`):
 * the kernel's first, then the installed modules' in id order (ADR 0017 §5).
 */
export const SOURCE_CATALOGS = [...KERNEL_CATALOGS, ...MODULES.map(({ capabilities }) => capabilities)] as const;

/** Every capability the kit ships. A preset enables a subset of its modules; kernel modules are always on (ADR 0004). */
export const CATALOG = mergeCatalogs(...SOURCE_CATALOGS);

type SourceCatalog = (typeof SOURCE_CATALOGS)[number];
type IdsOf<C> = C extends unknown ? keyof C & string : never;
type ById<S> = { readonly [Id in IdsOf<S>]: Extract<S, Record<Id, unknown>>[Id] };

/** The literal id of every capability the kit ships. */
export type CapabilityId = IdsOf<SourceCatalog>;

/** `CATALOG` with its literal ids and capability types, for declarations that must cover every capability. */
export type CatalogById = ById<SourceCatalog>;

/** The kernel's capabilities by id, which the kernel's own MCP entries must cover. */
export type KernelCatalogById = ById<(typeof KERNEL_CATALOGS)[number]>;
