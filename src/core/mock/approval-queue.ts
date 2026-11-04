import type { ApprovalStatus } from "@/core/approvals";

import type { ApprovalRecord } from "./session-store";

/** Records kept per session (ADR 0005); settled ones go first, a pending one is never dropped. */
export const MAX_APPROVALS = 50;
/** How long a held write waits for a person (spec 004, D7). */
export const APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

/** A pending record past its deadline reads as `expired`; nothing runs on a timer, so the record is not rewritten here. */
export const effectiveStatus = (record: ApprovalRecord, nowMs: number): ApprovalStatus =>
  record.status === "pending" && Date.parse(record.expiresAt) <= nowMs ? "expired" : record.status;

/** Drops settled records (decided or expired), oldest first, until at most `limit` remain or only pending ones are left. */
export function evictSettled(approvals: ApprovalRecord[], nowMs: number, limit: number): void {
  for (let index = 0; index < approvals.length && approvals.length > limit; ) {
    const record = approvals[index];
    if (record !== undefined && effectiveStatus(record, nowMs) !== "pending") approvals.splice(index, 1);
    else index += 1;
  }
}
