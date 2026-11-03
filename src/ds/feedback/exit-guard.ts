/**
 * The page-wide registry behind `useGuardedExit`. Every dirty window or form registers one entry; the most recent one
 * asks. While at least one entry exists the browser-level guards are armed: `beforeunload` for reload and tab close,
 * and a history sentinel so Back and Forward can be answered.
 *
 * Why a sentinel and not the Navigation API's `navigate` event: a `traverse` navigation is cancelable only when the
 * destination is the same document, the page is top-level, and (for the browser's Back button) the page has history-
 * action activation; Chrome's guidance is that Back and Forward cannot be cancelled. A guard that works only
 * sometimes is not a guard. So the sentinel stays the mechanism, and the Navigation API serves only where it is
 * exact: `currentEntry.key` identifies the sentinel (it survives `replaceState`, which Next's router uses to rewrite
 * state and which drops our marker), and `entries()` against `history.length` says whether anything precedes the page.
 *
 * Sources: WHATWG HTML, "inner navigate event firing algorithm" (steps 8-9, `traverseCanBeCanceled`);
 * developer.chrome.com/docs/web-platform/navigation-api ("can't cancel a navigation ... if the user is pressing the
 * Back or Forward buttons"; support: Chrome 102, Firefox 147, Safari 26.2).
 */

/** An entry asks the person; it calls `proceed` on Leave and `cancel` on Stay. */
export interface ExitGuardEntry {
  readonly ask: (proceed: () => void, cancel: () => void) => void;
}

/** Marks the history entry the guard pushed. Merged into the current state so the router keeps its own keys. */
const SENTINEL = "__exitGuard";

/** How long a confirmed Leave keeps the browser prompt quiet; a page still alive after it was not left. */
const LEAVE_GRACE_MS = 3000;

interface NavigationEntryLike {
  readonly key: string;
  readonly index: number;
}

interface NavigationLike {
  readonly currentEntry: NavigationEntryLike | null;
  readonly canGoBack: boolean;
  readonly entries: () => readonly unknown[];
}

const navigationApi = (): NavigationLike | undefined => (globalThis as { navigation?: NavigationLike }).navigation;

/** True when a history state carries the guard's marker. */
export function isSentinel(state: unknown): boolean {
  return typeof state === "object" && state !== null && SENTINEL in state;
}

const entries: ExitGuardEntry[] = [];
let disarm: (() => void) | null = null;
let unwindTimer: ReturnType<typeof setTimeout> | null = null;

/** Key and index of the history entry the guard pushed; known only where the Navigation API exists. */
let sentinelKey: string | null = null;
let sentinelIndex = -1;

/** A question is open: nothing else may ask, and any other traversal returns to the guarded entry. */
let questionOpen = false;
/** The pop we caused ourselves and must keep from the router. */
let expected: "stay" | "unwind" | null = null;
let afterUnwind: (() => void) | null = null;
/** The person chose Leave after a Back: the next pop belongs to the router. */
let letNextPopThrough = false;
/** The person already chose Leave: the browser's own prompt would ask a second time. */
let confirmedLeave = false;
let graceTimer: ReturnType<typeof setTimeout> | null = null;

/** The guard's entry is the current one: by key where the API exists (it survives `replaceState`), else by marker. */
function onSentinel(): boolean {
  const current = navigationApi()?.currentEntry;
  if (current && sentinelKey !== null) return current.key === sentinelKey;
  return isSentinel(window.history.state);
}

function pushSentinel() {
  window.history.pushState({ [SENTINEL]: true }, "", window.location.href);
  const current = navigationApi()?.currentEntry;
  sentinelKey = current?.key ?? null;
  sentinelIndex = current?.index ?? -1;
}

/** Back to the guarded entry from wherever a traversal left the person. */
function returnToSentinel() {
  const current = navigationApi()?.currentEntry;
  const delta = current && sentinelKey !== null ? sentinelIndex - current.index : 1;
  if (delta === 0) return;
  expected = "stay";
  window.history.go(delta);
}

function confirmLeave() {
  confirmedLeave = true;
  if (graceTimer !== null) clearTimeout(graceTimer);
  graceTimer = setTimeout(forgetLeave, LEAVE_GRACE_MS);
}

function forgetLeave() {
  confirmedLeave = false;
  letNextPopThrough = false;
  if (graceTimer !== null) clearTimeout(graceTimer);
  graceTimer = null;
}

/** A confirmation of the page itself is open: asking over it would stack three layers (ADR 0015 allows two). */
const confirmationOpen = () =>
  typeof document !== "undefined" && document.querySelector('[role="alertdialog"]') !== null;

function openQuestion(entry: ExitGuardEntry, proceed: () => void, cancel: () => void) {
  questionOpen = true;
  entry.ask(
    () => {
      questionOpen = false;
      proceed();
    },
    () => {
      questionOpen = false;
      cancel();
    },
  );
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
 * runs only if the person leaves. While a question or a confirmation is already open the navigation is held without
 * asking again. A sentinel on top is unwound first so the new page does not sit behind a duplicate of this one.
 */
export function askBeforeLeaving(proceed: () => void): boolean {
  const top = entries.at(-1);
  if (top === undefined) return false;
  if (questionOpen || confirmationOpen()) return true;
  openQuestion(
    top,
    () => leaveInApp(proceed),
    () => undefined,
  );
  return true;
}

function leaveInApp(proceed: () => void) {
  // A route Next resolves as a full page load (another root layout) must not raise the browser prompt as well.
  confirmLeave();
  if (onSentinel()) {
    expected = "unwind";
    afterUnwind = proceed;
    window.history.back();
    return;
  }
  proceed();
}

/**
 * Something precedes this page. `canGoBack` alone is false when the previous entry is another document, yet Back works
 * then, so entries outside the Navigation API's list (`history.length` counts all of them) count too. Unknown without
 * the API: assume yes, the grace period undoes the flags if no pop comes.
 */
function somethingBefore(): boolean {
  const api = navigationApi();
  if (!api) return true;
  return api.canGoBack || window.history.length > api.entries().length;
}

function leaveByBack() {
  if (!somethingBefore()) {
    // Nothing before this page (a tab opened on it): Leave cannot go anywhere, so stay and keep guarding.
    returnToSentinel();
    return;
  }
  letNextPopThrough = true;
  confirmLeave();
  window.history.back();
}

function armBrowserGuards(): () => void {
  if (unwindTimer !== null) {
    clearTimeout(unwindTimer);
    unwindTimer = null;
  }
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (confirmedLeave) return;
    event.preventDefault();
    event.returnValue = "";
  };

  const onPopState = (event: PopStateEvent) => {
    if (expected !== null) {
      // The pop the guard itself caused: the router must not see it.
      event.stopImmediatePropagation();
      const kind = expected;
      expected = null;
      if (kind === "unwind") {
        const next = afterUnwind;
        afterUnwind = null;
        next?.();
      }
      return;
    }
    if (letNextPopThrough || confirmedLeave) {
      // The person already chose Leave (a Back that is the second step, or a Back pressed while the page they left is
      // still unmounting): the question has been answered and must not ask, or pull them back, again.
      letNextPopThrough = false;
      return;
    }
    // Landing on the sentinel from elsewhere (Back from a page pushed without the guard) is an ordinary traversal.
    if (onSentinel()) return;
    event.stopImmediatePropagation();
    const top = entries.at(-1);
    if (top === undefined) return;
    if (questionOpen || confirmationOpen()) {
      returnToSentinel();
      return;
    }
    openQuestion(top, leaveByBack, returnToSentinel);
  };

  // Without the Navigation API the entry is known by its marker, and the router rewrites state with replaceState
  // (refresh, revalidation, a search-param change) without it. Carry the marker across those rewrites.
  const previousReplace = window.history.replaceState;
  const reseal: History["replaceState"] = function replaceState(data, unused, url) {
    const carry = onSentinel() && !isSentinel(data);
    const next = carry ? { ...(typeof data === "object" && data !== null ? data : {}), [SENTINEL]: true } : data;
    return previousReplace.call(window.history, next, unused, url);
  };
  if (!navigationApi()) window.history.replaceState = reseal;

  const onPageShow = () => forgetLeave();

  if (!onSentinel()) pushSentinel();
  window.addEventListener("beforeunload", onBeforeUnload);
  window.addEventListener("pageshow", onPageShow);
  // Capture, so it runs before the router's own listener on the same target and can stop it.
  window.addEventListener("popstate", onPopState, { capture: true });
  return () => {
    window.removeEventListener("beforeunload", onBeforeUnload);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("popstate", onPopState, { capture: true });
    if (window.history.replaceState === reseal) window.history.replaceState = previousReplace;
    forgetLeave();
    expected = null;
    afterUnwind = null;
    questionOpen = false;
    unwindIdleSentinel();
  };
}

/**
 * The page stopped being dirty on its own page (saved): the sentinel is a dead Back press, so take it off. It is
 * unwound only when it is provably the current entry, in a task after the one that cleaned up. A redirect after the
 * save pushes its page in a later commit, and by then the sentinel is no longer current, so the check skips it; the
 * guard is by key and URL, never by "one step back". Needs the Navigation API (the key); elsewhere it is left alone.
 */
function unwindIdleSentinel() {
  if (!navigationApi() || sentinelKey === null) return;
  const href = window.location.href;
  const key = sentinelKey;
  unwindTimer = setTimeout(() => {
    unwindTimer = null;
    const current = navigationApi();
    if (entries.length > 0) return;
    if (current?.currentEntry?.key !== key || window.location.href !== href) return;
    const swallow = (event: Event) => {
      event.stopImmediatePropagation();
      window.removeEventListener("popstate", swallow, { capture: true });
    };
    window.addEventListener("popstate", swallow, { capture: true });
    window.history.back();
  }, 0);
}
