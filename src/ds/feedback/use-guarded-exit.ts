"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { askBeforeLeaving, registerExitGuard } from "./exit-guard";

export interface GuardedExit {
  /** True while the question is open. Render it with `DiscardChanges` from `@/ds/overlays`. */
  readonly asking: boolean;
  /** Stay: keeps everything where it is. Wire it to the question's `onOpenChange(false)`. */
  readonly stay: () => void;
  /** Leave: continues the navigation that was interrupted. Wire it to the question's `onDiscard`. */
  readonly leave: () => void;
}

/**
 * While `dirty`, leaving the page asks first (ADR 0015): a `next/link` click that carries `useGuardedLink`'s
 * handler, Back and Forward, and a reload or tab close (the browser's own prompt, which cannot be restyled). The
 * hook owns the question's state; the caller renders it, so the wording and the alert stay `DiscardChanges`.
 * Several dirty sources on one page share one question: the most recently mounted asks.
 */
export function useGuardedExit(dirty: boolean): GuardedExit {
  const [asking, setAsking] = useState(false);
  const pending = useRef<{ proceed: () => void; cancel: () => void } | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const unregister = registerExitGuard({
      ask: (proceed, cancel) => {
        pending.current = { proceed, cancel };
        setAsking(true);
      },
    });
    return () => {
      unregister();
      // No longer dirty (saved, or discarded elsewhere) while the question was open: drop it.
      pending.current = null;
      setAsking(false);
    };
  }, [dirty]);

  const settle = (outcome: "proceed" | "cancel") => {
    const current = pending.current;
    pending.current = null;
    setAsking(false);
    current?.[outcome]();
  };

  return { asking, stay: () => settle("cancel"), leave: () => settle("proceed") };
}

/**
 * Builds the `onNavigate` of a `next/link` for `href`: Next 16 runs it on client-side navigations only, and
 * `preventDefault()` cancels them. When a dirty source is registered it asks, and Leave pushes `href` itself.
 * Modified clicks and external links never reach it, so they are not guarded (the browser prompt covers a real unload).
 */
export function useGuardedLink(): (href: string) => (event: { preventDefault: () => void }) => void {
  const router = useRouter();
  return (href) => (event) => {
    if (askBeforeLeaving(() => router.push(href))) event.preventDefault();
  };
}
