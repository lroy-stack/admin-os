"use client";

import { DialogWindow, type DialogWindowProps } from "./dialog-window";

export type QuickDialogProps = DialogWindowProps;

/**
 * A short task: one decision or up to four fields (ADR 0015). Centered and at most 480 px wide from 768 px, a bottom
 * sheet below.
 */
export function QuickDialog(props: QuickDialogProps) {
  return <DialogWindow kind="quick" {...props} />;
}
