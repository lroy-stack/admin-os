import { z } from "zod";

import type { RolePreset } from "@/core/access";
import type { NavManifest } from "@/core/nav";
import type { ViewEntry } from "@/core/views";
import { hospitality } from "@/verticals/hospitality";
import { salon } from "@/verticals/salon";
import { workshop } from "@/verticals/workshop";

import type { ExtensionEntity, InstalledModuleId, MODULES } from "./modules.generated";

export type { ExtensionEntity } from "./modules.generated";

/** The product view kinds the installed modules declare (ADR 0018 §3); a preset entry of another kind does not compile. */
export type ProductViewKindId = NonNullable<(typeof MODULES)[number]["views"]>[number]["id"];

/** The isomorphic half of a preset (ADR 0004); `server.ts` of each preset holds the vocabulary and the seed. */
export interface VerticalPreset {
  readonly id: string;
  readonly modules: readonly InstalledModuleId[];
  readonly nav: NavManifest;
  readonly roles: readonly RolePreset[];
  readonly extensions: Readonly<Partial<Record<ExtensionEntity, z.ZodType>>>;
  /** The product views it offers, in order (ADR 0018 §3); checked by the contract test. */
  readonly productViews: readonly ViewEntry<ProductViewKindId>[];
  /** Overrides of the setting defaults where this business really differs; keys and values are checked by the contract test. */
  readonly settingsDefaults: Readonly<Record<string, unknown>>;
  /** Words that must never appear in the generic layers (ADR 0008). */
  readonly leakTerms: readonly string[];
}

export const VERTICALS = { hospitality, salon, workshop } as const satisfies Record<string, VerticalPreset>;

export type VerticalId = keyof typeof VERTICALS;

export const DEFAULT_VERTICAL: VerticalId = "hospitality";

/** A preset id as the demo cookie and the environment spell it. */
export const verticalIdSchema = z.enum(Object.keys(VERTICALS) as [VerticalId, ...VerticalId[]]);

/**
 * The preset of a request: the demo cookie wins when it names a known preset (an invalid one is ignored), then
 * `VERTICAL` pins one per deployment, then the default. An unknown `VERTICAL` fails loudly.
 */
export function resolveVertical(raw: string | undefined, preferred?: string): (typeof VERTICALS)[VerticalId] {
  const fromCookie = verticalIdSchema.safeParse(preferred);
  if (fromCookie.success) {
    return VERTICALS[fromCookie.data];
  }
  const parsed = verticalIdSchema.default(DEFAULT_VERTICAL).safeParse(raw === "" ? undefined : raw);
  if (!parsed.success) {
    throw new Error(
      `VERTICAL must be one of ${Object.keys(VERTICALS).join(", ")}; got "${String(raw)}". Set it in the environment or unset it for "${DEFAULT_VERTICAL}".`,
    );
  }
  return VERTICALS[parsed.data];
}
