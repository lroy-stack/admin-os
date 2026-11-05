"use client";

import { LockOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { useToastWithUndo } from "@/ds/feedback";
import { type CapabilityActionOptions, failureMessage, useCapabilityAction } from "@/ds/forms";

import { blockCustomer, unblockCustomer } from "../actions";
import { BLOCK_TOGGLE } from "./block-toggle";
import { customerRecordMessageKey } from "./messages";
import { planUnblockToast, restorableReason, toBlockInput } from "./record-writes";

/**
 * Unblock acts at once (ADR 0015: a reversible action offers undo, not a question). The toast names the reason and
 * its Undo blocks again with it (customers.block); like `takeBack` in the bookings writes, the undo throws when the
 * write did not go through, so the toast shows the failure.
 */
export function UnblockButton({
  customerId,
  customerName,
  reason,
  errors,
}: {
  customerId: string;
  customerName: string;
  /** The reason the block has now (absent when it had none); the unblock clears it, so it is kept here for Undo. */
  reason: string | undefined;
  errors: CapabilityActionOptions["errors"];
}) {
  const text = useMessages(customerRecordMessageKey).unblock;
  const locale = useLocale();
  const toastWithUndo = useToastWithUndo();
  const unblock = useCapabilityAction(unblockCustomer, errors === undefined ? {} : { errors });
  const reblock = useCapabilityAction(blockCustomer, errors === undefined ? {} : { errors });

  const restorable = restorableReason(reason);

  const takeBack = async (restore: string) => {
    const outcome = await reblock.run(toBlockInput(customerId, restore));
    if (outcome?.status !== "ok") throw new Error(outcome === null ? "busy" : failureMessage(outcome, "undo failed"));
  };

  const run = async () => {
    const outcome = await unblock.run({ id: customerId });
    const plan = planUnblockToast(outcome, restorable);
    switch (plan.kind) {
      case "none":
        return;
      case "undo":
        toastWithUndo({
          message: format(text.done, locale, { name: customerName, reason: plan.reason }),
          undo: () => takeBack(plan.reason),
        });
        return;
      case "final":
        toast.success(format(text.doneFinal, locale, { name: customerName }));
        return;
      case "error":
        toast.error(outcome === null ? text.failed : failureMessage(outcome, text.failed));
        return;
    }
  };

  return (
    <Button variant="outline" size="sm" disabled={unblock.pending} onClick={run} {...BLOCK_TOGGLE}>
      <LockOpen data-icon="inline-start" />
      {text.verb}
    </Button>
  );
}
