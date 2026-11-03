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
  /** Declares that `approval` is defined; the descriptor invariants check the two agree (`descriptorViolations`). */
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

export type DescriptorRule =
  | "read-tier"
  | "read-approval"
  | "tier3-destructive"
  | "destructive-tier"
  | "approval-flag"
  | "key-on-read";

type DescribedCapability = Pick<
  AnyCapability,
  "effect" | "riskTier" | "approval" | "mayRequireApproval" | "requiresIdempotencyKey"
>;

/** The descriptor rules a capability breaks (ADR 0005, descriptor v2); the catalogue contract test expects `[]`. */
export const descriptorViolations = (capability: DescribedCapability): readonly DescriptorRule[] => {
  const isRead = capability.effect === "read";
  const rules: readonly (readonly [DescriptorRule, boolean])[] = [
    ["read-tier", isRead && capability.riskTier > 1],
    ["read-approval", isRead && capability.approval !== undefined],
    ["tier3-destructive", capability.riskTier === 3 && capability.effect !== "destructive"],
    ["destructive-tier", capability.effect === "destructive" && capability.riskTier < 2],
    ["approval-flag", (capability.approval !== undefined) !== (capability.mayRequireApproval === true)],
    ["key-on-read", isRead && capability.requiresIdempotencyKey === true],
  ];
  return rules.filter(([, broken]) => broken).map(([rule]) => rule);
};
