"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** What a panel is given to ask the page for a value (a table on the floor). `null` means the person gave up. */
export interface DockedPanelPick<T> {
  readonly request: (kind: string) => Promise<T | null>;
}

/** The pick state machine, free of React so it is tested without a DOM. At most one request is pending. */
export interface PickBroker<T> extends DockedPanelPick<T> {
  /** The page answers the pending request. False when none is pending: the click was an ordinary click. */
  readonly answer: (value: T) => boolean;
  /** Leaves pick mode: the pending request resolves `null`. */
  readonly cancel: () => void;
  /** The `kind` of the pending request, or `null` when the page is not being asked. */
  readonly current: () => string | null;
  readonly subscribe: (listener: () => void) => () => void;
}

export function createPickBroker<T>(): PickBroker<T> {
  let pending: { kind: string; resolve: (value: T | null) => void } | null = null;
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const listener of listeners) listener();
  };
  const settle = (value: T | null) => {
    const request = pending;
    pending = null;
    request?.resolve(value);
  };

  return {
    // A new request supersedes the pending one, which resolves `null`: the panel never waits on two answers.
    request: (kind) =>
      new Promise<T | null>((resolve) => {
        settle(null);
        pending = { kind, resolve };
        emit();
      }),
    answer: (value) => {
      if (pending === null) return false;
      settle(value);
      emit();
      return true;
    },
    cancel: () => {
      if (pending === null) return;
      settle(null);
      emit();
    },
    current: () => pending?.kind ?? null,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** What the panel reads from the page's pick: whether it is waiting and how to stop. */
export interface PanelPickControl {
  readonly picking: string | null;
  readonly cancel: () => void;
}

export interface PanelPick<T> extends PanelPickControl {
  /** Give it to the panel's children (it is `DockedPanelPick<T>`). */
  readonly request: DockedPanelPick<T>["request"];
  /** Call it from the page's click handler; false means no request was pending. */
  readonly answer: (value: T) => boolean;
}

/**
 * Pick mode for a page that hosts a `DockedPanel`: pass the result as the panel's `pick`, hand `request` to the form
 * inside it and call `answer` where the page receives the click. `picking` is the pending kind, for highlighting what
 * can be picked. Unmounting the page ends a pending request.
 */
export function usePanelPick<T>(): PanelPick<T> {
  const [broker] = useState(() => createPickBroker<T>());
  const picking = useSyncExternalStore(broker.subscribe, broker.current, () => null);
  useEffect(() => broker.cancel, [broker]);
  return { picking, request: broker.request, answer: broker.answer, cancel: broker.cancel };
}
