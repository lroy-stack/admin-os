import type { z } from "zod";

/** `<verb>:<resource>`, for example `read:customers` (ADR 0006). */
export type Permission = `${string}:${string}`;

export type Effect = "read" | "write" | "destructive";

export interface Capability<Id extends string, I extends z.ZodType, O extends z.ZodType> {
  /** `<module>.<entity>.<verb>`, for example `customers.profile.get`. */
  readonly id: Id;
  /** Short English description; the MCP projection reuses it as the tool description. */
  readonly summary: string;
  readonly input: I;
  readonly output: O;
  readonly permission: Permission;
  readonly effect: Effect;
  /** Reserved for owners: roles other than `owner` never hold the permission (ADR 0006). Absent means not elevated. */
  readonly elevated?: boolean;
  /** Mock HITL rule; absent means never. Method syntax keeps concrete capabilities assignable to `AnyCapability`. */
  approval?(input: z.output<I>): boolean;
}

export type AnyCapability = Capability<string, z.ZodType, z.ZodType>;

export type Catalog = Record<string, AnyCapability>;

/** Identity helper: it exists to keep the literal id and effect types that `client.call` relies on. */
export const defineCapability = <
  const Id extends string,
  I extends z.ZodType,
  O extends z.ZodType,
  const E extends Effect,
>(
  capability: Capability<Id, I, O> & { readonly effect: E },
): Capability<Id, I, O> & { readonly effect: E } => capability;

export const mergeCatalogs = (...catalogs: readonly Catalog[]): Catalog => {
  const merged: Catalog = {};
  for (const catalog of catalogs) {
    for (const [id, capability] of Object.entries(catalog)) {
      if (Object.hasOwn(merged, id)) throw new Error(`Duplicate capability id "${id}" while merging catalogs`);
      merged[id] = capability;
    }
  }
  return merged;
};
