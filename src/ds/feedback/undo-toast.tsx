"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { format, type Locale, useLocale, useMessages } from "@/core/i18n/client";

import {
  type Countdown,
  isExpired,
  pauseCountdown,
  remainingAt,
  resumeCountdown,
  secondsLeft,
  startCountdown,
} from "./countdown";
import { type FeedbackMessages, feedbackMessageKey } from "./messages";

export const UNDO_WINDOW_MS = 10_000;
const TICK_MS = 250;

export type UndoLabels = FeedbackMessages["undo"];

export interface UndoToastOptions {
  /** What just happened, already translated ("Reservation cancelled"). */
  message: string;
  /** The inverse of the action. A rejection shows the failure toast. */
  undo: () => void | Promise<void>;
  durationMs?: number;
  /** Texts of the toast: `useToastWithUndo()` fills them in a component. */
  labels: UndoLabels;
  locale: Locale;
}

/** The toast body: message, countdown text and bar, and the Undo button. Pauses while hovered or focused. */
export function UndoToastContent({
  message,
  durationMs = UNDO_WINDOW_MS,
  labels,
  locale,
  onUndo,
  onExpire,
}: {
  message: string;
  durationMs?: number;
  labels: UndoLabels;
  locale: Locale;
  onUndo: () => void;
  onExpire: () => void;
}) {
  const [countdown, setCountdown] = useState<Countdown>(() => startCountdown(durationMs, Date.now()));
  const [now, setNow] = useState(() => Date.now());
  const [holds, setHolds] = useState({ hover: false, focus: false });
  const paused = countdown.resumedAt === null;

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (isExpired(countdown, now)) onExpire();
  }, [countdown, now, onExpire]);

  const hold = (next: typeof holds) => {
    const at = Date.now();
    setHolds(next);
    setNow(at);
    setCountdown(next.hover || next.focus ? pauseCountdown(countdown, at) : resumeCountdown(countdown, at));
  };

  const remaining = remainingAt(countdown, now);
  const text = format(labels.countdown, locale, { count: secondsLeft(remaining) });

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-(--width) flex-col gap-2 overflow-hidden rounded-(--border-radius) border border-(--normal-border) bg-(--normal-bg) p-3 text-(--normal-text) shadow-lg"
      onPointerEnter={() => hold({ ...holds, hover: true })}
      onPointerLeave={() => hold({ ...holds, hover: false })}
      onFocus={() => hold({ ...holds, focus: true })}
      onBlur={() => hold({ ...holds, focus: false })}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">{message}</p>
        <Button type="button" size="sm" variant="outline" onClick={onUndo}>
          {labels.action}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs tabular-nums">{text}</p>
      <div className="bg-muted h-1 w-full rounded-full" aria-hidden="true">
        <div
          className="bg-primary h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-linear"
          style={{ width: `${(remaining / durationMs) * 100}%` }}
        />
      </div>
    </div>
  );
}

/** Shows the undo toast: the caller already did the action; Undo runs the inverse and confirms. Returns the toast id. */
export function toastWithUndo({ message, undo, durationMs, labels, locale }: UndoToastOptions): string | number {
  return toast.custom(
    (id) => (
      <UndoToastContent
        message={message}
        durationMs={durationMs}
        labels={labels}
        locale={locale}
        onExpire={() => toast.dismiss(id)}
        onUndo={() => {
          toast.dismiss(id);
          void Promise.resolve()
            .then(undo)
            .then(
              () => toast.success(labels.undone),
              () => toast.error(labels.failed),
            );
        }}
      />
    ),
    { duration: Number.POSITIVE_INFINITY, unstyled: true },
  );
}

/** `toastWithUndo` with the texts and locale of the active language filled in. */
export function useToastWithUndo(): (options: Omit<UndoToastOptions, "labels" | "locale">) => string | number {
  const locale = useLocale();
  const { undo: labels } = useMessages(feedbackMessageKey);
  return (options) => toastWithUndo({ ...options, labels, locale });
}
