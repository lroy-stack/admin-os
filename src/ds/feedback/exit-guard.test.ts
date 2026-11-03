import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isSentinel } from "./exit-guard";

/**
 * The guard runs in a browser, so these tests stand a small one up: a history stack that fires `popstate`
 * synchronously (capture listeners first, `stopImmediatePropagation` honoured), the Navigation API's entry keys and
 * `canGoBack` when asked for, and a router listener that records every pop it is allowed to see.
 */

interface HistoryEntry {
  key: string;
  state: unknown;
  url: string;
}

interface Listener {
  type: string;
  listener: (event: unknown) => void;
  capture: boolean;
}

function createBrowser(options: { navigation: boolean; entriesBefore?: number; foreignBefore?: number }) {
  let counter = 0;
  const nextKey = () => `entry-${counter++}`;
  const stack: HistoryEntry[] = [];
  for (let i = 0; i <= (options.entriesBefore ?? 1); i++)
    stack.push({ key: nextKey(), state: null, url: `/page-${i}` });
  let index = stack.length - 1;
  const listeners: Listener[] = [];
  const routerPops: number[] = [];

  const dispatch = (type: string, event: Record<string, unknown>) => {
    let stopped = false;
    const full = { ...event, stopImmediatePropagation: () => (stopped = true), preventDefault: () => undefined };
    const ordered = [...listeners.filter((l) => l.capture), ...listeners.filter((l) => !l.capture)];
    for (const entry of ordered.filter((l) => l.type === type)) {
      if (stopped) break;
      entry.listener(full);
    }
    return full;
  };

  const history = {
    get length() {
      return stack.length + (options.foreignBefore ?? 0);
    },
    get state() {
      return stack[index]?.state ?? null;
    },
    pushState(state: unknown, _unused: string, url?: string | URL | null) {
      stack.splice(index + 1);
      stack.push({ key: nextKey(), state, url: url ? String(url) : (stack[index]?.url ?? "") });
      index = stack.length - 1;
    },
    replaceState(state: unknown, _unused: string, url?: string | URL | null) {
      const current = stack[index];
      if (current) stack[index] = { key: current.key, state, url: url ? String(url) : current.url };
    },
    go(delta: number) {
      const target = index + delta;
      if (target < 0 || target >= stack.length) return;
      index = target;
      dispatch("popstate", {});
    },
    back() {
      history.go(-1);
    },
  };

  const win = {
    history,
    location: {
      get href() {
        return stack[index]?.url ?? "";
      },
    },
    addEventListener(type: string, listener: (event: unknown) => void, opts?: boolean | { capture?: boolean }) {
      listeners.push({ type, listener, capture: typeof opts === "object" ? Boolean(opts.capture) : Boolean(opts) });
    },
    removeEventListener(type: string, listener: (event: unknown) => void) {
      const at = listeners.findIndex((l) => l.type === type && l.listener === listener);
      if (at !== -1) listeners.splice(at, 1);
    },
  };

  // The router listens without capture, as Next does.
  win.addEventListener("popstate", () => routerPops.push(index));

  const navigation = {
    get currentEntry() {
      const entry = stack[index];
      return entry ? { key: entry.key, index } : null;
    },
    get canGoBack() {
      return index > 0;
    },
    entries: () => stack,
  };

  return {
    win,
    history,
    navigation: options.navigation ? navigation : undefined,
    routerPops,
    get index() {
      return index;
    },
    get length() {
      return stack.length;
    },
    /** What the router does on a Link push or a refresh: Next writes its own state, without our marker. */
    routerReplace: () => history.replaceState({ __NA: true }, "", undefined),
    routerPush: (url: string) => history.pushState({ __NA: true }, "", url),
    beforeUnload: () => {
      let prevented = false;
      const event = { preventDefault: () => (prevented = true), returnValue: "unset" };
      for (const l of listeners.filter((entry) => entry.type === "beforeunload")) l.listener(event);
      return { prevented, returnValue: event.returnValue };
    },
    pageShow: () => dispatch("pageshow", {}),
  };
}

let alertOpen = false;

async function setup(options: { navigation: boolean; entriesBefore?: number; foreignBefore?: number }) {
  vi.resetModules();
  alertOpen = false;
  const browser = createBrowser(options);
  vi.stubGlobal("window", browser.win);
  vi.stubGlobal("navigation", browser.navigation);
  vi.stubGlobal("document", { querySelector: () => (alertOpen ? {} : null) });
  const guard = await import("./exit-guard");
  const asks: { proceed: () => void; cancel: () => void }[] = [];
  const source = { ask: (proceed: () => void, cancel: () => void) => asks.push({ proceed, cancel }) };
  return { browser, guard, asks, source };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("isSentinel", () => {
  it("recognises the entry the guard pushed, with the router's own keys beside it", () => {
    expect(isSentinel({ __exitGuard: true, __NA: true })).toBe(true);
  });

  it.each([null, undefined, "x", { __NA: true }])("rejects %j", (state) => {
    expect(isSentinel(state)).toBe(false);
  });
});

describe("askBeforeLeaving with nothing dirty", () => {
  it("lets the navigation go ahead without running anything", async () => {
    const { guard } = await setup({ navigation: true });
    const proceed = vi.fn();

    expect(guard.askBeforeLeaving(proceed)).toBe(false);
    expect(proceed).not.toHaveBeenCalled();
  });
});

describe.each([
  { label: "with the Navigation API", navigation: true },
  { label: "without the Navigation API", navigation: false },
])("the guard $label", ({ navigation }) => {
  const arm = async (entriesBefore = 1) => {
    const env = await setup({ navigation, entriesBefore });
    const unregister = env.guard.registerExitGuard(env.source);
    return { ...env, unregister };
  };

  it("pushes one sentinel entry on the same URL when the first source registers, and not a second", async () => {
    const { browser, guard, source } = await arm();
    guard.registerExitGuard(source);

    expect([browser.length, browser.index, browser.win.location.href]).toEqual([3, 2, "/page-1"]);
  });

  it("raises the browser prompt on unload", async () => {
    const { browser } = await arm();

    expect(browser.beforeUnload()).toEqual({ prevented: true, returnValue: "" });
  });

  it("asks on Back, keeps the router out of it, and Stay returns to the guarded entry", async () => {
    const { browser, asks } = await arm();

    browser.history.back();
    asks[0]?.cancel();

    expect([asks.length, browser.index, browser.routerPops.length]).toEqual([1, 2, 0]);
  });

  it("leaves with Leave after a Back: the second step belongs to the router and the prompt stays quiet", async () => {
    const { browser, asks } = await arm();

    browser.history.back();
    asks[0]?.proceed();

    expect([browser.index, browser.routerPops.length, browser.beforeUnload().prevented]).toEqual([0, 1, false]);
  });

  it("does not swallow a Back onto the sentinel that the guard did not cause (an unguarded push left it behind)", async () => {
    const { browser, asks } = await arm();
    browser.routerPush("/page-b");

    browser.history.back();

    expect([asks.length, browser.routerPops.length, browser.index]).toEqual([0, 1, 2]);
  });

  it("keeps recognising the sentinel after the router rewrites the state: Stay asks once", async () => {
    const { browser, asks } = await arm();
    browser.routerReplace();

    browser.history.back();
    asks[0]?.cancel();
    browser.history.back();

    expect([asks.length, browser.index, browser.routerPops.length]).toEqual([2, 1, 0]);
  });

  it("goes to the link's page with no duplicate of this one behind it, even after the router rewrote the state", async () => {
    const { browser, guard, asks } = await arm();
    browser.routerReplace();
    guard.askBeforeLeaving(() => browser.routerPush("/page-b"));

    asks[0]?.proceed();

    expect([browser.length, browser.index, browser.routerPops.length]).toEqual([3, 2, 0]);
  });

  it("holds a link click while a question is open instead of asking again", async () => {
    const { guard, asks } = await arm();
    guard.askBeforeLeaving(vi.fn());

    const second = guard.askBeforeLeaving(vi.fn());

    expect([second, asks.length]).toEqual([true, 1]);
  });

  it("does not ask over a confirmation of the page: Back returns to the guarded entry", async () => {
    const { browser, asks } = await arm();
    alertOpen = true;

    browser.history.back();

    expect([asks.length, browser.index]).toEqual([0, 2]);
  });

  it("holds a link click, without asking, while a confirmation of the page is open", async () => {
    const { guard, asks } = await arm();
    alertOpen = true;

    expect([guard.askBeforeLeaving(vi.fn()), asks.length]).toEqual([true, 0]);
  });

  it("keeps the browser prompt quiet for a confirmed in-app Leave only for a grace period", async () => {
    const { browser, guard, asks } = await arm();
    guard.askBeforeLeaving(() => browser.routerPush("/page-b"));
    asks[0]?.proceed();
    const quiet = browser.beforeUnload().prevented;

    vi.advanceTimersByTime(3000);

    expect([quiet, browser.beforeUnload().prevented]).toEqual([false, true]);
  });

  it("does not intercept a Back pressed right after a confirmed Leave, while the page is still unmounting", async () => {
    const { browser, guard, asks } = await arm();
    guard.askBeforeLeaving(() => browser.routerPush("/page-b"));
    asks[0]?.proceed();
    alertOpen = true;

    browser.history.back();

    expect([asks.length, browser.routerPops.length]).toEqual([1, 1]);
  });

  it("forgets a confirmed Leave when the page comes back from the back-forward cache", async () => {
    const { browser, asks } = await arm();
    browser.history.back();
    asks[0]?.proceed();

    browser.pageShow();

    expect(browser.beforeUnload().prevented).toBe(true);
  });

  it("stops guarding when the last source unregisters", async () => {
    const { browser, unregister } = await arm();

    unregister();

    expect(browser.beforeUnload().prevented).toBe(false);
  });

  it("registers again after an unregister without pushing a second sentinel while the first is current", async () => {
    const { browser, guard, source, unregister } = await arm();
    unregister();

    guard.registerExitGuard(source);

    expect(browser.length).toBe(3);
  });
});

describe("a second traversal while the question is open", () => {
  const setupArmed = async () => {
    const env = await setup({ navigation: true });
    env.guard.registerExitGuard(env.source);
    return env;
  };

  it("answers a second Back, while the question is open, by returning to the guarded entry without asking again", async () => {
    const { browser, asks } = await setupArmed();
    browser.history.back();

    browser.history.back();

    expect([asks.length, browser.index, browser.routerPops.length]).toEqual([1, 2, 0]);
  });
});

describe("a tab opened directly on the page", () => {
  it("cannot Leave by Back: it stays guarded and the browser prompt keeps asking (Navigation API)", async () => {
    const { browser, guard, asks, source } = await setup({ navigation: true, entriesBefore: 0 });
    guard.registerExitGuard(source);
    browser.history.back();

    asks[0]?.proceed();

    expect([browser.index, browser.beforeUnload().prevented]).toEqual([1, true]);
  });

  it("can Leave by Back when the previous entry is another document, which the Navigation API does not list", async () => {
    const { browser, guard, asks, source } = await setup({ navigation: true, entriesBefore: 0, foreignBefore: 1 });
    guard.registerExitGuard(source);
    browser.history.back();

    asks[0]?.proceed();

    expect(browser.beforeUnload().prevented).toBe(false);
  });

  it("resets the leave flags after the grace period when no pop ever comes (no Navigation API)", async () => {
    const { browser, guard, asks, source } = await setup({ navigation: false, entriesBefore: 0 });
    guard.registerExitGuard(source);
    browser.history.back();
    asks[0]?.proceed();
    const quiet = browser.beforeUnload().prevented;

    vi.advanceTimersByTime(3000);

    expect([quiet, browser.beforeUnload().prevented]).toEqual([false, true]);
  });
});

describe("a source that stops being dirty on its own page", () => {
  it("takes the dead sentinel off the history (Navigation API)", async () => {
    const { browser, guard, source } = await setup({ navigation: true });
    const unregister = guard.registerExitGuard(source);

    unregister();
    vi.advanceTimersByTime(0);

    expect([browser.index, browser.routerPops.length]).toEqual([1, 0]);
  });

  it("does not unwind when a redirect already moved the person on", async () => {
    const { browser, guard, source } = await setup({ navigation: true });
    const unregister = guard.registerExitGuard(source);

    unregister();
    browser.routerPush("/page-b");
    vi.advanceTimersByTime(0);

    expect([browser.index, browser.length]).toEqual([3, 4]);
  });

  it("does not unwind when it became dirty again before the unwind ran", async () => {
    const { browser, guard, source } = await setup({ navigation: true });
    guard.registerExitGuard(source)();

    guard.registerExitGuard(source);
    vi.advanceTimersByTime(0);

    expect([browser.index, browser.length]).toEqual([2, 3]);
  });

  it("leaves the sentinel alone where entries cannot be told apart (no Navigation API)", async () => {
    const { browser, guard, source } = await setup({ navigation: false });
    const unregister = guard.registerExitGuard(source);

    unregister();
    vi.advanceTimersByTime(0);

    expect(browser.index).toBe(2);
  });
});
