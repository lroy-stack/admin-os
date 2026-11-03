"use client";

import { DialogWindow, type DialogWindowProps } from "./dialog-window";

export type FormDialogProps = DialogWindowProps;

/**
 * Create or edit a record that needs nothing from the page (ADR 0015). Centered and at most 640 px wide from 768 px, a
 * full-screen sheet below.
 */
export function FormDialog(props: FormDialogProps) {
  return <DialogWindow kind="form" {...props} />;
}
