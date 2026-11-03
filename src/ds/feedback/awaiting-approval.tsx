"use client";

import { type ReactNode, useCallback } from "react";

import { ClockIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, type Locale, useLocale, useMessages } from "@/core/i18n/client";

import { type FeedbackMessages, feedbackMessageKey } from "./messages";

export type ApprovalLabels = FeedbackMessages["approval"];

/**
 * A write held for approval, as a pending state and not a failure. It names the action and the role that decides and
 * takes no approval id: there is nothing to leak into the DOM.
 * - `inline`: a notice next to the control that was used.
 * - `record`: a notice above the record. The record stays readable (selectable, in the accessibility tree); the
 *   consumer renders `children` read-only.
 * The transient confirmation is an event, not a state: see `notifyAwaitingApproval`.
 */
export function AwaitingApprovalNotice({
  variant,
  action,
  role,
  children,
}: {
  variant: "inline" | "record";
  /** What is held, translated and capitalised as the start of a sentence ("Cancel reservation"). */
  action: string;
  /** The role that decides, translated ("manager"). */
  role: string;
  /** The record, already read-only (`record` variant only). */
  children?: ReactNode;
}) {
  const locale = useLocale();
  const text = useMessages(feedbackMessageKey).approval;
  const waiting = format(text.waiting, locale, { action, role });

  if (variant === "inline") {
    return (
      <p role="status" className="text-muted-foreground flex items-center gap-2 text-sm">
        <ClockIcon className="size-4 shrink-0" aria-hidden="true" />
        {waiting}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Alert role="status">
        <ClockIcon aria-hidden="true" />
        <AlertTitle>{text.title}</AlertTitle>
        <AlertDescription>
          {waiting} {text.readOnly}
        </AlertDescription>
      </Alert>
      {children}
    </div>
  );
}

export interface NotifyAwaitingApprovalOptions {
  action: string;
  role: string;
  labels: ApprovalLabels;
  locale: Locale;
}

/**
 * The transient "waiting for approval" toast. Call it from the handler once the response says `awaiting_approval`,
 * so it fires once per request and never on a remount. The same action and role replace each other.
 */
export function notifyAwaitingApproval({ action, role, labels, locale }: NotifyAwaitingApprovalOptions): void {
  toast.info(format(labels.waiting, locale, { action, role }), { id: `awaiting-approval:${action}:${role}` });
}

/** `notifyAwaitingApproval` with the texts and locale of the active language filled in. */
export function useNotifyAwaitingApproval(): (options: Pick<NotifyAwaitingApprovalOptions, "action" | "role">) => void {
  const locale = useLocale();
  const labels = useMessages(feedbackMessageKey).approval;
  return useCallback((options) => notifyAwaitingApproval({ ...options, labels, locale }), [labels, locale]);
}
