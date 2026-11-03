/**
 * The page-wide registry behind `useGuardedExit`. Every dirty window or form registers one entry; the most recent one
 * asks. While at least one entry exists the browser-level guards are armed: `beforeunload` for reload and tab close,
 * and a history sentinel so Back and Forward can be answered (the History API cannot cancel a traversal, so the page
 * keeps one extra entry behind the current one and puts the person back on it when they choose to stay).
 */

/** An entry asks the person; it calls `proceed` on Leave and `cancel` on Stay. */
export interface ExitGuardEntry {
  readonly ask: (proceed: () => void, cancel: () => void) => void;
}

/** Marks the history entry the guard pushed. Merged into the current state so the router keeps its own keys. */
const SENTINEL = "__exitGuard";

const entries: ExitGuardEntry[] = [];
let disarm: (() => void) | null = null;

/** True when the current history entry is the one the guard pushed. */
export function isSentinel(state: unknown): boolean {
  return typeof state === "object" && state !== null && SENTINEL in state;
}

/**
 * Registers a dirty source; returns its unregister function. The browser guards arm with the first entry and
 * disarm with the last.
 */
export function registerExitGuard(entry: ExitGuardEntry): () => void {
  entries.push(entry);
  if (entries.length === 1) disarm = armBrowserGuards();
  return () => {
    const index = entries.indexOf(entry);
    if (index !== -1) entries.splice(index, 1);
    if (entries.length === 0) {
      disarm?.();
      disarm = null;
    }
  };
}

/**
 * Asks before an in-app navigation. Returns false when nothing is dirty (go ahead); otherwise true, and `proceed`
 * runs only if the person leaves. A history sentinel on top is unwound first so the new page does not sit behind a
 * duplicate of this one.
 */
export function askBeforeLeaving(proceed: () => void): boolean {
  const top = entries.at(-1);
  if (top === undefined) return false;
  top.ask(
    () => leaveInApp(proceed),
    () => undefined,
  );
  return true;
}

let afterUnwind: (() => void) | null = null;
let letNextPopThrough = false;
/** The person already chose Leave: the browser's own prompt would ask a second time. */
let confirmedLeave = false;

function leaveInApp(proceed: () => void) {
  if (isSentinel(window.history.state)) {
    afterUnwind = proceed;
    window.history.back();
    return;
  }
  proceed();
}

function armBrowserGuards(): () => void {
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!confirmedLeave) event.preventDefault();
  };

  const onPopState = (event: PopStateEvent) => {
    if (afterUnwind !== null) {
      // Our own unwind landed: the router must not see it, the pending navigation runs instead.
      event.stopImmediatePropagation();
      const next = afterUnwind;
      afterUnwind = null;
      next();
      return;
    }
    if (letNextPopThrough) {
      // The person chose Leave after a Back: this second step belongs to the router.
      letNextPopThrough = false;
      return;
    }
    event.stopImmediatePropagation();
    // Back onto the sentinel (Forward, or Stay putting the person back) changes nothing.
    if (isSentinel(window.history.state)) return;
    const top = entries.at(-1);
    if (top === undefined) return;
    top.ask(
      () => {
        letNextPopThrough = true;
        confirmedLeave = true;
        window.history.back();
      },
      () => window.history.go(1),
    );
  };

  if (!isSentinel(window.history.state)) {
    window.history.pushState({ [SENTINEL]: true }, "", window.location.href);
  }
  window.addEventListener("beforeunload", onBeforeUnload);
  // Capture, so it runs before the router's own listener on the same target and can stop it.
  window.addEventListener("popstate", onPopState, { capture: true });
  return () => {
    window.removeEventListener("beforeunload", onBeforeUnload);
    window.removeEventListener("popstate", onPopState, { capture: true });
    afterUnwind = null;
    letNextPopThrough = false;
    confirmedLeave = false;
  };
}
