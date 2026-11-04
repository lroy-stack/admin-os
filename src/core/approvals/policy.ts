import { z } from "zod";

import type { AnyCapability, ApprovalContext } from "@/core/capability";
import { ok } from "@/core/result";
import { defineSetting, type SettingsReader } from "@/core/settings";

/**
 * Which writes wait for a person when an assistant asks (spec 004, D7):
 * - `all`: every write an assistant asks for;
 * - `destructive_and_sensitive`: the default, see `holdsForApproval`;
 * - `none`: nothing waits. Allowed, and the reason the setting is owner-only.
 */
export const approvalPolicySchema = z.enum(["all", "destructive_and_sensitive", "none"]);

export type ApprovalPolicy = z.infer<typeof approvalPolicySchema>;

export const DEFAULT_APPROVAL_POLICY: ApprovalPolicy = "destructive_and_sensitive";

/**
 * The setting behind the policy. It is UI-only (no MCP tool changes it, and `settings.values.update` refuses it) and
 * its permission is elevated: only the owner holds `manage:approvals`. A visitor's choice lives in their session, out
 * of the data an assistant's writes change, and wins over the preset's value.
 */
export const approvalPolicy = defineSetting({
  key: "approvals.policy",
  schema: approvalPolicySchema,
  defaultValue: DEFAULT_APPROVAL_POLICY,
  section: "approvals",
  permission: "manage:approvals",
  writtenBy: "approvals.policy.set",
  labelKey: "approvals.settings.policy.label",
  descriptionKey: "approvals.settings.policy.description",
});

export const approvalsSettings = [approvalPolicy] as const;

type Described = Pick<AnyCapability, "effect" | "riskTier" | "change">;

/**
 * Whether a call waits for a person. Only an assistant's write can wait: the web app acts for a person already. Under
 * the default policy a write waits when the descriptor says it is hard to take back: its effect is `destructive`
 * (cancel, no-show), its change is `overwrite` or `remove` (block a customer, delete) or its tier is 3. These are the
 * descriptor's own facts, so a new capability is covered the day it declares them.
 */
export function holdsForApproval(policy: ApprovalPolicy, capability: Described, via: ApprovalContext["via"]): boolean {
  if (via !== "mcp" || capability.effect === "read" || policy === "none") return false;
  if (policy === "all") return true;
  return (
    capability.effect === "destructive" ||
    capability.riskTier === 3 ||
    capability.change === "overwrite" ||
    capability.change === "remove"
  );
}

/** The policy in effect; a registry without the setting falls back to the safe default, never to `none`. */
export function policyOf(settings: SettingsReader): ApprovalPolicy {
  const values = settings.values([approvalPolicy.key]);
  if (!values.ok) return DEFAULT_APPROVAL_POLICY;
  return approvalPolicySchema.catch(DEFAULT_APPROVAL_POLICY).parse(values.value[approvalPolicy.key]);
}

/** A reader that answers the session's own policy where the visitor chose one. */
export function withSessionPolicy(settings: SettingsReader, chosen: ApprovalPolicy | undefined): SettingsReader {
  if (chosen === undefined) return settings;
  return {
    get: ((setting) => (setting.key === approvalPolicy.key ? chosen : settings.get(setting))) as SettingsReader["get"],
    values: (keys) => {
      const base = settings.values(keys);
      if (!base.ok || !Object.hasOwn(base.value, approvalPolicy.key)) return base;
      return ok({ ...base.value, [approvalPolicy.key]: chosen });
    },
    over: (sessionValues) => withSessionPolicy(settings.over(sessionValues), chosen),
    accept: (values, permissions) => settings.accept(values, permissions),
  };
}
