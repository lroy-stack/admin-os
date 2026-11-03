"use client";

import { useMessages } from "@/core/i18n/client";

import { ConfirmAction } from "./confirm-action";
import { overlaysMessageKey } from "./messages";

/** The unsaved-changes question every window asks before it closes dirty (ADR 0015); one level deep, never nested. */
export function DiscardChanges({
  open,
  onOpenChange,
  onDiscard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
}) {
  const text = useMessages(overlaysMessageKey);
  return (
    <ConfirmAction
      destructive
      open={open}
      onOpenChange={onOpenChange}
      verb={text.discard.discard}
      title={text.discard.title}
      consequence={text.discard.consequence}
      cancelLabel={text.discard.keep}
      onConfirm={async () => {
        onDiscard();
        return { status: "ok" };
      }}
    />
  );
}
