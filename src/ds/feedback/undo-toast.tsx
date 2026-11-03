"use client";

import { useCallback, useEffect, useState } from "react";

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
  usableDuration,
} from "./countdown";
import { type FeedbackMessages, feedbackMessageKey } from "./messages";
import { createUndoGate } from "./undo-gate";

export const UNDO_WINDOW_MS = 10_000;
const TICK_MS = 250;

export type UndoLabels = FeedbackMessages["undo"];

export interface UndoToastOptions {
  /** What just happened, already translated ("Reservation cancelled"). */
  message: string;
  /** The inverse of the action. A rejection shows the failure toast. */
  undo: () => void | Promise<void>;
  /** Must be above zero; anything else falls back to `UNDO_WINDOW_MS`. */
  durationMs?: number;
  /** Called with the rejection when `undo` fails, besides the failure toast and the console report. */
  onUndoError?: (error: unknown) => void;
  /** Texts of the toast: `useToastWithUndo()` fills them in a component. */
  labels: UndoLabels;
  locale: Locale;
}

interface Holds {
  readonly hover: boolean;
  readonly focus: boolean;
}

interface CountdownState {
  readonly countdown: Countdown;
  readonly holds: Holds;
}

/**
 * The toast body: message, countdown text and bar, and the Undo button. Pauses while hovered or focused. Undo and
 * expiry go through one gate, so only the first of them acts, and the button is disabled once either has happened.
 * Sonner announces the arrival of the toast; the changing countdown text is hidden from assistive technology.
 */
export function UndoToastContent({
  message,
  durationMs,
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
  const duration = usableDuration(durationMs, UNDO_WINDOW_MS);
  const [gate] = useState(createUndoGate);
  const [settled, setSettled] = useState(false);
  const [{ countdown }, setState] = useState<CountdownState>(() => ({
    countdown: startCountdown(duration, performance.now()),
    holds: { hover: false, focus: false },
  }));
  const [now, setNow] = useState(() => performance.now());
  const paused = countdown.resumedAt === null;
  const expired = isExpired(countdown, now);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setNow(performance.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (expired && gate.settle("expired")) onExpire();
  }, [expired, gate, onExpire]);

  const hold = (change: Partial<Holds>) => {
    const at = performance.now();
    setNow(at);
    setState((state) => {
      const holds = { ...state.holds, ...change };
      const held = holds.hover || holds.focus;
      return { holds, countdown: held ? pauseCountdown(state.countdown, at) : resumeCountdown(state.countdown, at) };
    });
  };

  const undo = () => {
    // The clock decides, not the next tick: a click after the deadline is an expiry.
    if (isExpired(countdown, performance.now())) {
      if (gate.settle("expired")) onExpire();
      return;
    }
    if (!gate.settle("undone")) return;
    setSettled(true);
    onUndo();
  };

  const remaining = remainingAt(countdown, now);
  const text = format(labels.countdown, locale, { count: secondsLeft(remaining) });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover and focus only pause the countdown; Undo is the control
    <div
      className="flex w-(--width) flex-col gap-2 overflow-hidden rounded-(--border-radius) border border-(--normal-border) bg-(--normal-bg) p-3 text-(--normal-text) shadow-lg"
      onPointerEnter={() => hold({ hover: true })}
      onPointerLeave={() => hold({ hover: false })}
      onFocus={() => hold({ focus: true })}
      onBlur={() => hold({ focus: false })}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">{message}</p>
        <Button type="button" size="sm" variant="outline" disabled={settled || expired} onClick={undo}>
          {labels.action}
        </Button>
      </div>
      <p aria-hidden="true" className="text-muted-foreground text-xs tabular-nums">
        {text}
      </p>
      <div className="bg-muted h-1 w-full rounded-full" aria-hidden="true">
        <div
          className="bg-primary h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-linear"
          style={{ width: `${(remaining / duration) * 100}%` }}
        />
      </div>
    </div>
  );
}

/** Shows the undo toast: the caller already did the action; Undo runs the inverse and confirms. Returns the toast id. */
export function toastWithUndo({
  message,
  undo,
  durationMs,
  onUndoError,
  labels,
  locale,
}: UndoToastOptions): string | number {
  const run = async (): Promise<void> => {
    try {
      await undo();
    } catch (error) {
      // `console.error` survives the production build (next.config removeConsole keeps error and warn).
      console.error("[undo-toast] undo failed", { message }, error);
      onUndoError?.(error);
      toast.error(labels.failed);
      return;
    }
    toast.success(labels.undone);
  };

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
          void run();
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
  return useCallback((options) => toastWithUndo({ ...options, labels, locale }), [labels, locale]);
}
