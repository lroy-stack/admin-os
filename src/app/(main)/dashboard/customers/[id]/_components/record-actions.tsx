"use client";

import { type ReactNode, useEffect, useRef } from "react";

import type { CapabilityActionOptions } from "@/ds/forms";

import { AddNoteDialog } from "./add-note-dialog";
import { BlockDialog } from "./block-dialog";
import { findBlockToggle } from "./block-toggle";
import { EditContactDialog } from "./edit-contact-dialog";
import type { RecordAbilities } from "./record-writes";
import { UnblockButton } from "./unblock-button";

interface RecordActionsProps {
  customerId: string;
  customerName: string;
  contact: { name: string; phone: string; email: string };
  blocked: boolean;
  blockReason: string | undefined;
  can: RecordAbilities;
  errors: CapabilityActionOptions["errors"];
  /** The contact links, which sit in the same wrapping row so the icons are beside the buttons on a narrow screen. */
  children: ReactNode;
}

/** The header's actions. Each is rendered only when the actor's role holds its permission (ADR 0006). */
export function RecordActions({
  customerId,
  customerName,
  contact,
  blocked,
  blockReason,
  can,
  errors,
  children,
}: RecordActionsProps) {
  // The refresh after a block or an unblock swaps one control for the other; if focus was lost with the old one, it
  // goes to the new one (ADR 0015). A window's own return handles the same swap when its focus comes back first.
  const shown = useRef(blocked);
  useEffect(() => {
    if (shown.current === blocked) return;
    shown.current = blocked;
    const lost = document.activeElement === null || document.activeElement === document.body;
    if (lost) findBlockToggle()?.focus();
  }, [blocked]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {can.edit && <EditContactDialog customerId={customerId} initial={contact} errors={errors} />}
      {can.edit && <AddNoteDialog customerId={customerId} errors={errors} />}
      {can.block &&
        (blocked ? (
          <UnblockButton customerId={customerId} customerName={customerName} reason={blockReason} errors={errors} />
        ) : (
          <BlockDialog customerId={customerId} customerName={customerName} errors={errors} />
        ))}
      {children}
    </div>
  );
}
