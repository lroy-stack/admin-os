"use client";

import { useCallback, useRef, useState } from "react";

interface Shown<Target> {
  readonly value: Target;
  readonly open: boolean;
  /** Changes at each opening, so a host can remount the window with `key` and start it from a clean state. */
  readonly opening: number;
}

export interface OpenWindow<Target> {
  /** What the window shows, or `null` before the first opening. Keep rendering it while `open` is false to let it animate out. */
  readonly shown: Shown<Target> | null;
  /** Opens the window; `opener` is the control that asked, where focus returns on close. */
  readonly show: (value: Target, opener: Element | null) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly returnFocus: () => Element | null;
}

/** The state every window host of a showcase screen repeats: the target, open or closed, and the control to refocus. */
export function useOpenWindow<Target>(): OpenWindow<Target> {
  const opener = useRef<Element | null>(null);
  const openings = useRef(0);
  const [shown, setShown] = useState<Shown<Target> | null>(null);

  const show = useCallback((value: Target, from: Element | null) => {
    opener.current = from;
    openings.current += 1;
    setShown({ value, open: true, opening: openings.current });
  }, []);
  const onOpenChange = useCallback((open: boolean) => {
    setShown((current) => (current ? { ...current, open } : current));
  }, []);
  const returnFocus = useCallback(() => opener.current, []);

  return { shown, show, onOpenChange, returnFocus };
}
