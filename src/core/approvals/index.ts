import { z } from "zod";

import { defineCapability } from "@/core/capability";
import { pageInput, pageOutput } from "@/core/pagination";

import { approvalPolicySchema } from "./policy";

export { approvalsErrors } from "./messages";
export {
  type ApprovalPolicy,
  approvalPolicy,
  approvalPolicySchema,
  approvalsSettings,
  DEFAULT_APPROVAL_POLICY,
  holdsForApproval,
  policyOf,
  withSessionPolicy,
} from "./policy";
export { APPROVAL_TTL_MS, type ApprovalRecord, effectiveStatus } from "./record";

/**
 * Where a held write stands (spec 004, D7): `pending` waits for a person; `approved`, `rejected` and `expired` are
 * final; `conflict` means it could not run when approved because the state moved or the requester lost the right.
 */
export const approvalStatusSchema = z.enum(["pending", "approved", "rejected", "expired", "conflict"]);

export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;

const failureSchema = z.object({ code: z.string().min(1), message: z.string().min(1) });

/**
 * What the requester or an approver needs to follow a held write: which capability it is for, where it stands and
 * how it ended. The held input is never part of it: it may hold another actor's data, and the person approving reads
 * it in the web app (`approvals.list`).
 */
export const approvalSchema = z.object({
  approvalId: z.string().min(1),
  capabilityId: z.string().min(1),
  status: approvalStatusSchema,
  /** Whether the acting user is the one who asked for the write; "you" is this actor, not this client. */
  requestedByYou: z.boolean(),
  /** When a person decided, or when the check that ended it ran. */
  decidedAt: z.string().optional(),
  /** `approved`: what the write returned. */
  result: z.unknown().optional(),
  /** `rejected`: why the approver said no, if they said. */
  reason: z.string().optional(),
  /** `conflict`: why the write could not run. */
  error: failureSchema.optional(),
});

const personSchema = z.object({ actorId: z.string().min(1), role: z.string().min(1) });

/** One held write as an approver sees it, with the input they are asked to approve. */
export const approvalEntrySchema = z.object({
  approvalId: z.string().min(1),
  capabilityId: z.string().min(1),
  status: approvalStatusSchema,
  requestedBy: personSchema.extend({
    via: z.enum(["ui", "mcp", "system"]),
    /** The OAuth client an assistant asked through, when it acted with a grant (spec 004, A1a). */
    clientId: z.string().optional(),
  }),
  requestedAt: z.string().min(1),
  expiresAt: z.string().min(1),
  input: z.unknown(),
  decidedBy: personSchema.optional(),
  decidedAt: z.string().optional(),
  reason: z.string().optional(),
  result: z.unknown().optional(),
  error: failureSchema.optional(),
});

const approvalIdInput = z.string().min(1).max(128);

export const approvalsGet = defineCapability({
  id: "approvals.get",
  summary:
    "Where a write that answered awaiting_approval stands: its capability and status (pending, approved with its result, rejected with the reason, expired after 24 hours, or conflict when the state moved), and whether you asked for it (you means the acting user, until grants are per client). Never returns the held input. Fails with approvals.not_found when there is no such approval in this session.",
  input: z.strictObject({ approvalId: approvalIdInput }),
  output: approvalSchema,
  permission: "read:approvals",
  effect: "read",
  riskTier: 1,
});

export const approvalsList = defineCapability({
  id: "approvals.list",
  summary:
    "The writes held for a person in this session, pending first and then newest first, one page at a time, with the input each one would run. For the person who decides.",
  input: pageInput({ defaultLimit: 20, maxLimit: 50 }),
  output: pageOutput(approvalEntrySchema),
  permission: "review:approvals",
  effect: "read",
  // The held inputs are what the deciders review; staff never hold it.
  restricted: true,
  riskTier: 1,
});

export const approvalsApprove = defineCapability({
  id: "approvals.approve",
  summary:
    "Approve a held write: it must still be pending and inside its 24 hours, it runs as the person who asked (refused with approvals.requester_forbidden when their role no longer holds the permission) and only if it can still run and the state still matches what it was when asked: a write that can no longer run fails with its own rule's code (bookings.start_passed when the start has passed), one that would change other records with approvals.conflict. Records the result.",
  input: z.strictObject({ approvalId: approvalIdInput }),
  output: z.object({ approvalId: z.string().min(1), status: z.literal("approved"), result: z.unknown() }),
  permission: "decide:approvals",
  effect: "destructive",
  riskTier: 3,
  change: "set",
  idempotency: "target-state",
});

export const approvalsReject = defineCapability({
  id: "approvals.reject",
  summary: "Reject a held write, with the reason the requester will see. The write never runs.",
  input: z.strictObject({ approvalId: approvalIdInput, reason: z.string().trim().min(1).max(500).optional() }),
  output: z.object({ approvalId: z.string().min(1), status: z.literal("rejected") }),
  permission: "decide:approvals",
  // Rejecting discards the request for good, so it is destructive like approving: staff hold neither.
  effect: "destructive",
  riskTier: 2,
  change: "set",
  idempotency: "target-state",
});

export const approvalsPolicySet = defineCapability({
  id: "approvals.policy.set",
  summary:
    "Choose which assistant writes wait for a person: all of them, the destructive and sensitive ones (the default) or none. Owner only.",
  input: z.strictObject({ policy: approvalPolicySchema }),
  output: z.object({ policy: approvalPolicySchema }),
  permission: "manage:approvals",
  elevated: true,
  effect: "write",
  riskTier: 2,
  change: "overwrite",
  idempotency: "target-state",
});

export const approvalsCapabilities = {
  "approvals.get": approvalsGet,
  "approvals.list": approvalsList,
  "approvals.approve": approvalsApprove,
  "approvals.reject": approvalsReject,
  "approvals.policy.set": approvalsPolicySet,
} as const;
