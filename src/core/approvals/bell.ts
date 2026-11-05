import type { z } from "zod";

import { format, type Locale } from "@/core/i18n";
// Type only: the module manifest imports the kernel, and a type import is erased.
import type { BellRow } from "@/core/module";

import type { approvalEntrySchema } from "./index";
import type { ApprovalsMessages } from "./server";

/** The id the kernel's own bell rows carry in `BellRow.feed`; no module declares a feed with it. */
export const APPROVALS_FEED = "approvals";

/** The message of what an assistant asks for, by capability; any other write reads as a change to the record. */
const APPROVAL_ACTIONS: Readonly<Record<string, keyof ApprovalsMessages["bell"]["body"]>> = {
  "bookings.cancel": "bookingsCancel",
  "bookings.no_show.mark": "bookingsNoShowMark",
  "bookings.reschedule": "bookingsReschedule",
  "bookings.table.assign": "bookingsTableAssign",
  "customers.block": "customersBlock",
  "customers.unblock": "customersUnblock",
  "customers.contact.update": "customersContactUpdate",
};

type ApprovalEntry = z.infer<typeof approvalEntrySchema>;

/**
 * One bell row per write an assistant asked for that still waits for a person (ADR 0016, D7), oldest first. It lasts
 * as long as the request is pending: deciding or expiring it removes it, and nobody can mark it read. `target` is the
 * record the input names, when it names one, so the text can say "cancel booking R-1043". `entries` are the answer of
 * `approvals.list`, which has already judged expiry.
 */
export function approvalRows(
  entries: readonly ApprovalEntry[],
  text: ApprovalsMessages["bell"],
  locale: Locale,
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
        body: format(text.body[APPROVAL_ACTIONS[entry.capabilityId] ?? "generic"], locale, params),
        unread: true,
        approvalId: entry.approvalId,
      };
    });
}
