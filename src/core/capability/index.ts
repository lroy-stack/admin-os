import type { z } from "zod";

/** `<verb>:<resource>`, for example `read:customers` (ADR 0006). */
export type Permission = `${string}:${string}`;

export type Effect = "read" | "write" | "destructive";

/** 0 non-personal read · 1 personal read or self-scoped write · 2 business write · 3 irreversible, money or legal. */
export type RiskTier = 0 | 1 | 2 | 3;

/** Who is calling, for the approval rule: the same capability may be held for a person only when an assistant asks. */
export interface ApprovalContext {
  readonly via: "ui" | "mcp" | "system";
}

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
  readonly riskTier: RiskTier;
  /** The UI offers "Request approval" and MCP advertises `awaiting_approval`; true exactly when `approval` is defined. */
  readonly mayRequireApproval?: boolean;
  /** The client refuses the call without a key (payments, sends). */
  readonly requiresIdempotencyKey?: boolean;
  /** Mock HITL rule; absent means never. Method syntax keeps concrete capabilities assignable to `AnyCapability`. */
  approval?(input: z.output<I>, context: ApprovalContext): boolean;
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
