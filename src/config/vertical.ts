import { z } from "zod";

import type { RolePreset } from "@/core/access";
import type { ModuleId, NavManifest } from "@/core/nav";
import { hospitality } from "@/verticals/hospitality";
import { salon } from "@/verticals/salon";
import { workshop } from "@/verticals/workshop";

/** Entities whose `ext` slot a preset may type (ADR 0004). */
export type ExtensionEntity = "area" | "asset" | "booking" | "catalogItem" | "customer" | "resource" | "staff";

/** The isomorphic half of a preset (ADR 0004); `server.ts` of each preset holds the vocabulary and the seed. */
export interface VerticalPreset {
  readonly id: string;
  readonly modules: readonly ModuleId[];
  readonly nav: NavManifest;
  readonly roles: readonly RolePreset[];
  readonly extensions: Readonly<Partial<Record<ExtensionEntity, z.ZodType>>>;
  /** Words that must never appear in the generic layers (ADR 0008). */
  readonly leakTerms: readonly string[];
}

export const VERTICALS = { hospitality, salon, workshop } as const satisfies Record<string, VerticalPreset>;

export type VerticalId = keyof typeof VERTICALS;

export const DEFAULT_VERTICAL: VerticalId = "hospitality";

/** `VERTICAL` pins one preset per deployment; unset means the default and an unknown value fails loudly. */
const verticalIdSchema = z.enum(Object.keys(VERTICALS) as [VerticalId, ...VerticalId[]]).default(DEFAULT_VERTICAL);

export function resolveVertical(raw: string | undefined): (typeof VERTICALS)[VerticalId] {
  const parsed = verticalIdSchema.safeParse(raw === "" ? undefined : raw);
  if (!parsed.success) {
    throw new Error(
      `VERTICAL must be one of ${Object.keys(VERTICALS).join(", ")}; got "${String(raw)}". Set it in the environment or unset it for "${DEFAULT_VERTICAL}".`,
    );
  }
  return VERTICALS[parsed.data];
}
