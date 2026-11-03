"use client";

import type { ReactNode } from "react";

import { CircleAlertIcon, InboxIcon, LockIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useMessages } from "@/core/i18n/client";
import type { ReadStatus } from "@/core/result";

import { feedbackMessageKey } from "./messages";

/**
 * Renders a read's state (`readStateOf`). Four distinct, labelled renders plus the children when ready:
 * loading (skeleton), error (reason and Retry), forbidden (reason), empty (title and optional action).
 * `reason` is the already-translated `errorText` for the status code.
 */
export function ReadState({
  state,
  reason,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}: {
  state: ReadStatus;
  /** `errorText(error, dictionary, locale)` of the failed read; used by the error and forbidden renders. */
  reason?: string;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  children: ReactNode;
}) {
  const text = useMessages(feedbackMessageKey).readState;

  switch (state.status) {
    case "loading":
      return (
        <div role="status" aria-busy="true" className="flex w-full flex-col gap-3">
          <span className="sr-only">{text.loading}</span>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    case "error":
      return (
        <Empty role="alert" data-state="error">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleAlertIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{text.errorTitle}</EmptyTitle>
            {reason ? <EmptyDescription>{reason}</EmptyDescription> : null}
          </EmptyHeader>
          {onRetry ? (
            <EmptyContent>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                {text.retry}
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      );
    case "forbidden":
      return (
        <Empty role="status" data-state="forbidden">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LockIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{text.forbiddenTitle}</EmptyTitle>
            {reason ? <EmptyDescription>{reason}</EmptyDescription> : null}
          </EmptyHeader>
        </Empty>
      );
    case "empty":
      return (
        <Empty data-state="empty">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            {emptyDescription ? <EmptyDescription>{emptyDescription}</EmptyDescription> : null}
          </EmptyHeader>
          {emptyAction ? <EmptyContent>{emptyAction}</EmptyContent> : null}
        </Empty>
      );
    case "ready":
      return children;
  }
}
