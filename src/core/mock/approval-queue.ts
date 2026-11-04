import { type ApprovalRecord, effectiveStatus } from "@/core/approvals";

/** Records kept per session (ADR 0005); settled ones go first, a pending one is never dropped. */
export const MAX_APPROVALS = 50;

/** Drops settled records (decided or expired), oldest first, until at most `limit` remain or only pending ones are left. */
export function evictSettled(approvals: ApprovalRecord[], nowMs: number, limit: number): void {
  for (let index = 0; index < approvals.length && approvals.length > limit; ) {
    const record = approvals[index];
    if (record !== undefined && effectiveStatus(record, nowMs) !== "pending") approvals.splice(index, 1);
    else index += 1;
  }
}
