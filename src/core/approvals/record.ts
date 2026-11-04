import type { ApprovalContext } from "@/core/capability";

import type { ApprovalStatus } from "./index";

/** How long a held write waits for a person (spec 004, D7). */
export const APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * A write that waits for a person, with who asked, who decided and how it ended (ADR 0016, D7). The decision fields
 * are filled in place when the record leaves `pending`. Times are real ISO instants: the demo's business clock is
 * fixed, so a deadline on it would never arrive.
 */
export interface ApprovalRecord {
  readonly approvalId: string;
  readonly capabilityId: string;
  /** The parsed input as asked; never returned by `approvals.get`. */
  readonly input: unknown;
  /** Key-order independent fingerprint of `input`, to dedupe a retried hold. */
  readonly fingerprint: string;
  /** What the write would change when it was asked, so approving can tell that the state moved. */
  readonly expected: string;
  readonly requestedBy: {
    readonly actorId: string;
    /** The name the write is signed with once approved (a note's author), as the requester was shown. */
    readonly displayName?: string;
    readonly role: string;
    readonly via: ApprovalContext["via"];
    /** The grant or client an assistant acted through, once grants are per client (spec 004, A1). */
    readonly clientId?: string;
  };
  readonly requestedAt: string;
  readonly expiresAt: string;
  status: ApprovalStatus;
  decidedBy?: { readonly actorId: string; readonly role: string };
  decidedAt?: string;
  /** Why the approver rejected it. */
  reason?: string;
  /** The value the approved write returned. */
  result?: unknown;
  /** Why a held write could not run (`conflict`). */
  error?: { readonly code: string; readonly message: string };
}

/** A pending record past its deadline reads as `expired`; nothing runs on a timer, so the record is not rewritten here. */
export const effectiveStatus = (record: ApprovalRecord, nowMs: number): ApprovalStatus =>
  record.status === "pending" && Date.parse(record.expiresAt) <= nowMs ? "expired" : record.status;
