import type { z } from "zod";

import { format, type Locale } from "@/core/i18n";
// Type only: the module manifest imports the kernel, and a type import is erased.
import type { BellRow } from "@/core/module";

import type { approvalEntrySchema } from "./index";
import type { ApprovalsMessages } from "./server";

/** The id the kernel's own bell rows carry in `BellRow.feed`; no module declares a feed with it. */
export const APPROVALS_FEED = "approvals";

type ApprovalEntry = z.infer<typeof approvalEntrySchema>;

/**
 * One bell row per write an assistant asked for that still waits for a person (ADR 0016, D7), oldest first. It lasts
 * as long as the request is pending: deciding or expiring it removes it, and nobody can mark it read. `target` is the
 * record the input names, when it names one, so the text can say "cancel booking R-1043". `sentences` are the words
 * of the modules that own the capabilities, by capability id and in `locale`; a capability none of them words reads
 * as a change to the record. `entries` are the answer of `approvals.list`, which has already judged expiry.
 */
export function approvalRows(
  entries: readonly ApprovalEntry[],
  text: ApprovalsMessages["bell"],
  locale: Locale,
  sentences: Readonly<Record<string, string>>,
): BellRow[] {
  return entries
    .filter((entry) => entry.status === "pending")
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))
    .map((entry) => {
      const target = (entry.input as { id?: unknown } | null)?.id;
      const params = { target: typeof target === "string" ? target : "" };
      return {
        feed: APPROVALS_FEED,
        id: `approval.requested:${entry.approvalId}`,
        kind: "approval.requested",
        title: text.title,
        body: format(sentences[entry.capabilityId] ?? text.generic, locale, params),
        unread: true,
        approvalId: entry.approvalId,
      };
    });
}
