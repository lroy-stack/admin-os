import { z } from "zod";

import { defineCapability } from "@/core/capability";

/** Where a held write stands. Only `pending` exists until approvals can be resolved (spec 004, phase 5). */
export const approvalStatusSchema = z.enum(["pending"]);

/**
 * What the requester or an approver needs to follow a held write: which capability it is for and whether it still
 * waits. The held input is never part of it: it may hold another actor's data, and the person approving reads it
 * in the web app.
 */
export const approvalSchema = z.object({
  approvalId: z.string().min(1),
  capabilityId: z.string().min(1),
  status: approvalStatusSchema,
  /** Whether the acting user is the one who asked for the write. */
  requestedByYou: z.boolean(),
});

export const approvalsGet = defineCapability({
  id: "approvals.get",
  summary:
    "Where a write that answered awaiting_approval stands: its capability and status, and whether you asked for it. Never returns the held input. Fails with approvals.not_found when there is no such approval in this session.",
  input: z.strictObject({ approvalId: z.string().min(1).max(128) }),
  output: approvalSchema,
  permission: "read:approvals",
  effect: "read",
  riskTier: 1,
});

export const approvalsCapabilities = { "approvals.get": approvalsGet } as const;
