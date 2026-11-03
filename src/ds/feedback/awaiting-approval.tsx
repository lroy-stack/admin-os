"use client";

import { type ReactNode, useEffect } from "react";

import { ClockIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { feedbackMessageKey } from "./messages";

/**
 * A write held for approval, as a pending state and not a failure. It names the action and the role that decides and
 * takes no approval id: there is nothing to leak into the DOM.
 * - `inline`: a notice next to the control that was used.
 * - `record`: the record itself is read-only until decided; `children` (the record) are inert.
 * - `toast`: a transient confirmation right after the request; renders nothing.
 */
export function AwaitingApprovalNotice({
  variant,
  action,
  role,
  children,
}: {
  variant: "inline" | "record" | "toast";
  /** What is held, translated and capitalised as the start of a sentence ("Cancel reservation"). */
  action: string;
  /** The role that decides, translated ("manager"). */
  role: string;
  /** The record to show read-only (`record` variant only). */
  children?: ReactNode;
}) {
  const locale = useLocale();
  const text = useMessages(feedbackMessageKey).approval;
  const waiting = format(text.waiting, locale, { action, role });

  useEffect(() => {
    if (variant === "toast") toast.info(waiting, { id: `awaiting-approval:${action}:${role}` });
  }, [variant, waiting, action, role]);

  if (variant === "toast") return null;

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
      {children ? (
        <div inert aria-disabled="true" className="opacity-70">
          {children}
        </div>
      ) : null}
    </div>
  );
}
