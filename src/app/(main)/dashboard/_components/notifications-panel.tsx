"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { type BellPanel, type BellRequest, bellErrorsKey } from "@/config/bell";
import { useCan } from "@/core/access/client";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import type { BellRow } from "@/core/module";
import { type CapabilityActionOptions, useCapabilityAction } from "@/ds/forms";
import { ConfirmAction, type ConfirmOutcome } from "@/ds/overlays";

import { dashboardMessageKey } from "./messages";
import { bellAction } from "./notification-actions";

/** The longest reason `approvals.reject` accepts. */
const REASON_MAX = 500;

/** What the panel shows: the rows, or the worded reason they could not be read (a failure is never an empty list). */
type PanelState =
  | { readonly status: "loading" }
  | { readonly status: "ok"; readonly items: readonly BellRow[]; readonly failures: readonly string[] }
  | { readonly status: "error"; readonly text: string };
type Deciding = { readonly kind: "approve" | "reject"; readonly approvalId: string } | null;

/**
 * The bell's panel (003 H1b, 004 H1b): the rows of the kernel's approvals and of each module's feed, read when it opens. An unread row marks itself
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
  const texts = useMessages(bellErrorsKey);
  const errors = useMemo<NonNullable<CapabilityActionOptions["errors"]>>(
    () => ({ en: texts, es: texts, de: texts, fr: texts }),
    [texts],
  );
  const reader = useCapabilityAction<BellRequest>(bellAction, { errors });
  const markRead = useCapabilityAction<BellRequest>(bellAction, { errors });
  const markAll = useCapabilityAction<BellRequest>(bellAction, { errors });
  const approve = useCapabilityAction<BellRequest>(bellAction, { errors });
  const reject = useCapabilityAction<BellRequest>(bellAction, { errors });
  const busy: ConfirmOutcome = { status: "error", text: text.failed, code: "client.busy" };

  const { run: readRows } = reader;
  const failedText = text.failed;
  const load = useCallback(
    () =>
      startLoading(async () => {
        const outcome = await readRows({ op: "load" });
        if (outcome === null) return;
        // The action answers a load with a `BellPanel`, which only the bell's own server code builds.
        if (outcome.status === "ok") setState({ status: "ok", ...(outcome.value as BellPanel) });
        else setState({ status: "error", text: outcome.status === "error" ? outcome.text : failedText });
      }),
    [readRows, failedText],
  );

  // The panel reads its rows when it opens.
  useEffect(load, [load]);

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
  const failures = state.failures.map((failure, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: two feeds can fail with the same worded text, so the text is no key
    <p key={`failure-${index}`} role="alert" className="px-4 py-3 text-sm">
      {failure}
    </p>
  ));
  if (state.items.length === 0 && failures.length > 0) {
    return (
      <div className="flex flex-col">
        {failures}
        <div className="px-4 pb-3">
          <Button size="sm" variant="outline" onClick={load}>
            {text.retry}
          </Button>
        </div>
      </div>
    );
  }
  if (state.items.length === 0) {
    return <p className="text-muted-foreground px-4 py-6 text-sm">{text.empty}</p>;
  }

  const anyUnread = state.items.some((item) => item.unread);
  const mayDecide = can("decide:approvals");

  const readOne = async (item: BellRow) => {
    // A waiting write stays unread until a person decides it: there is nothing to mark.
    if (item.approvalId !== undefined) return;
    const outcome = await markRead.run({ op: "read", feed: item.feed, input: { ids: [item.id] } });
    if (outcome?.status === "ok") load();
  };

  // Each feed marks up to the newest of its own rows that the person saw.
  const readAll = async () => {
    const feeds = new Set(
      state.items.filter((item) => item.approvalId === undefined && item.unread).map((i) => i.feed),
    );
    for (const feed of feeds) {
      const upTo = state.items.find((item) => item.feed === feed)?.id;
      const outcome = await markAll.run({ op: "readAll", feed, input: { upTo } });
      if (outcome?.status !== "ok") return;
    }
    load();
  };

  return (
    <div className="flex flex-col">
      {failures}
      {anyUnread ? (
        <div className="flex justify-end px-3 pt-2">
          <Button size="sm" variant="ghost" onClick={readAll}>
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
          const outcome = await approve.run({ op: "approve", input: { approvalId: deciding.approvalId } });
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
          const outcome = await reject.run({
            op: "reject",
            input: { approvalId: deciding.approvalId, ...(reason ? { reason } : {}) },
          });
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

function NotificationText({ item, unreadLabel }: { item: BellRow; unreadLabel?: string }) {
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
