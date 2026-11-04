"use client";

import { useEffect, useState, useTransition } from "react";

import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { useCan } from "@/core/access/client";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { useCapabilityAction } from "@/ds/forms";
import { ConfirmAction, type ConfirmOutcome } from "@/ds/overlays";

import { dashboardMessageKey } from "./messages";
import {
  approveHeldWrite,
  loadNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  rejectHeldWrite,
} from "./notification-actions";
import type { NotificationsAnswer, NotificationView } from "./notification-view";

/** The longest reason `approvals.reject` accepts. */
const REASON_MAX = 500;

type PanelState = NotificationsAnswer | { readonly status: "loading" };
type Deciding = { readonly kind: "approve" | "reject"; readonly approvalId: string } | null;

/**
 * The bell's panel (003 H1b, 004 H1b): the notifications read when it opens, newest first. An unread row marks itself
 * read; a write an assistant is waiting on offers approve and reject to whoever may decide, each from a
 * `ConfirmAction` (a destructive effect is never one tap).
 */
export function NotificationsPanel() {
  const text = useMessages(dashboardMessageKey).notifications;
  const locale = useLocale();
  const can = useCan();
  const [state, setState] = useState<PanelState>({ status: "loading" });
  const [, startLoading] = useTransition();
  const [deciding, setDeciding] = useState<Deciding>(null);
  const markRead = useCapabilityAction(markNotificationsRead);
  const markAll = useCapabilityAction(markAllNotificationsRead);
  const approve = useCapabilityAction(approveHeldWrite);
  const reject = useCapabilityAction(rejectHeldWrite);
  const busy: ConfirmOutcome = { status: "error", text: text.failed, code: "client.busy" };

  const load = () =>
    startLoading(async () => {
      setState(await loadNotifications());
    });

  // The panel reads its rows once, when it opens.
  useEffect(load, []);

  if (state.status === "loading") {
    return <p className="text-muted-foreground px-4 py-6 text-sm">{text.loading}</p>;
  }
  if (state.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3 px-4 py-6">
        <p role="alert" className="text-sm">
          {state.text}
        </p>
        <Button size="sm" variant="outline" onClick={load}>
          {text.retry}
        </Button>
      </div>
    );
  }
  if (state.items.length === 0) {
    return <p className="text-muted-foreground px-4 py-6 text-sm">{text.empty}</p>;
  }

  const newest = state.items[0];
  const anyUnread = state.items.some((item) => item.unread);
  const mayDecide = can("decide:approvals");

  const readOne = async (item: NotificationView) => {
    const outcome = await markRead.run({ ids: [item.id] });
    if (outcome?.status === "ok") load();
  };

  return (
    <div className="flex flex-col">
      {anyUnread && newest ? (
        <div className="flex justify-end px-3 pt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              const outcome = await markAll.run({ upTo: newest.id });
              if (outcome?.status === "ok") load();
            }}
          >
            {text.markAllRead}
          </Button>
        </div>
      ) : null}
      <ul className="flex max-h-96 flex-col overflow-y-auto">
        {state.items.map((item) => (
          <li key={item.id} className="border-border/60 border-b last:border-b-0">
            {item.unread ? (
              <button
                type="button"
                aria-label={format(text.markRead, locale, { title: item.title })}
                onClick={() => readOne(item)}
                className="hover:bg-foreground/5 focus-visible:ring-ring flex w-full items-start gap-3 px-4 py-3 text-left focus-visible:ring-2 focus-visible:outline-none"
              >
                <span aria-hidden className="bg-brand mt-1.5 size-2 shrink-0 rounded-full" />
                <NotificationText item={item} unreadLabel={text.unread} />
              </button>
            ) : (
              <div className="flex items-start gap-3 px-4 py-3">
                <span aria-hidden className="mt-1.5 size-2 shrink-0" />
                <NotificationText item={item} />
              </div>
            )}
            {item.approvalId && mayDecide ? (
              <div className="flex gap-2 px-4 pb-3 pl-9">
                <Button
                  size="sm"
                  onClick={() => setDeciding({ kind: "approve", approvalId: item.approvalId as string })}
                >
                  {text.approve.verb}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeciding({ kind: "reject", approvalId: item.approvalId as string })}
                >
                  {text.reject.verb}
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <ConfirmAction
        open={deciding?.kind === "approve"}
        onOpenChange={(open) => {
          if (!open) setDeciding(null);
        }}
        verb={text.approve.verb}
        title={text.approve.title}
        consequence={text.approve.consequence}
        onConfirm={async () => {
          if (deciding === null) return busy;
          const outcome = await approve.run({ approvalId: deciding.approvalId });
          if (outcome?.status === "ok") {
            toast.success(text.toast.approved);
            load();
          }
          return outcome ?? busy;
        }}
      />
      <ConfirmAction
        open={deciding?.kind === "reject"}
        onOpenChange={(open) => {
          if (!open) setDeciding(null);
        }}
        verb={text.reject.verb}
        title={text.reject.title}
        consequence={text.reject.consequence}
        destructive
        reason={{ label: text.reject.reasonLabel, schema: z.string().trim().max(REASON_MAX) }}
        onConfirm={async (reason) => {
          if (deciding === null) return busy;
          const outcome = await reject.run({ approvalId: deciding.approvalId, ...(reason ? { reason } : {}) });
          if (outcome?.status === "ok") {
            toast.success(text.toast.rejected);
            load();
          }
          return outcome ?? busy;
        }}
      />
    </div>
  );
}

function NotificationText({ item, unreadLabel }: { item: NotificationView; unreadLabel?: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm font-medium">
        {item.title}
        {unreadLabel ? <span className="sr-only">{`, ${unreadLabel}`}</span> : null}
      </span>
      <span className="text-muted-foreground text-xs">{item.body}</span>
    </span>
  );
}
