import { expect, type Page, test } from "@playwright/test";

import { PAGE_ROUTES } from "./routes";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Dead-click detector (plan 003, T0.2). For every page route of the demo at 1440 and 375 px it activates each visible,
 * enabled control of the page and records whether anything observable followed within a short window: a URL change,
 * a newly opened dialog, menu, listbox, popover or drawer, a change of `aria-pressed` / `aria-expanded` /
 * `aria-checked` / `aria-selected` on the control, a toast, a network request, a DOM change in the page content
 * (tooltips aside), a scroll, a focus move, a popup, an alert, a copy or a download. A link with a real `href`
 * to an existing route counts as working without being clicked. Controls under `data-inert-reason` are skipped.
 *
 * The gate (plan 003, G1): by default each route fails while it has a dead control, so a new dead control fails the
 * build. Report mode (`DEAD_CLICKS=report`, `npm run test:dead-clicks`) passes and writes
 * `test-results/dead-clicks.json`, one entry per dead control, plus a per-route count on stdout.
 *
 * Scope notes: the shell (header, sidebar, quick access) is the same on every dashboard page, so it is scanned once,
 * on `/dashboard/default`; the other dashboard routes scan what is outside it. Controls that are already selected
 * (a checked radio, the current tab) do nothing by design and are not activated. Items inside closed menus are not
 * first-level and are not reached by the control pass; a second pass opens every menu trigger of the route and activates
 * each item of the menu (and of its submenus), which must lead somewhere (spec 009, V3-AC4). A menu that closes on
 * selection is not a reaction by itself; a menu with the same items as one already swept (one row menu per table
 * row) is swept once, its links are still checked. A menu or an item the sweep cannot open or press, even on a fresh
 * copy of the page, is a finding (`not-swept`), not a skip.
 */

const ENFORCE = process.env.DEAD_CLICKS !== "report";
const SHELL_ROUTE = "/dashboard/default";
/** How long a click has to show a reaction; dead controls are retried once with the longer window. */
const OBSERVE_MS = 450;
const RECHECK_MS = 1500;
/** The settle wait ends after this long even if the page never goes quiet (a ticking clock, an animation). */
const SETTLE_MAX_MS = 6000;
const SETTLE_QUIET_MS = 500;
const RESULTS_DIR = path.join(process.cwd(), "test-results");
const PARTS_DIR = path.join(RESULTS_DIR, "dead-clicks");

type Reason =
  | "url"
  | "overlay"
  | "aria"
  | "toast"
  | "network"
  | "dom"
  | "scroll"
  | "focus"
  | "popup"
  | "alert"
  | "clipboard"
  | "download";

type Control = { id: number; key: string; role: string; name: string; locator: string; menu: boolean };
type LinkRef = { href: string; role: "link"; name: string; locator: string };
type Collected = { controls: Control[]; links: LinkRef[] };
type MenuItem = { id: number; key: string; role: string; name: string; locator: string; sub: boolean };
type MenuContents = { items: MenuItem[]; links: LinkRef[] };
type Prepared = { status: "ok"; x: number; y: number } | { status: "gone" | "hidden" | "covered" | "offscreen" };

/** What the page-side probe offers. It is serialised into the page, so it must not use anything from this file. */
type Probe = {
  collect(scanShell: boolean, idByKey: Record<string, number> | null): Collected;
  prepare(id: number): Prepared;
  arm(id: number, trigger?: number): void;
  collectMenu(): MenuContents;
  menuDepth(): number;
  reacted(): boolean;
  reasons(): Reason[];
  samples(): string[];
  modalCount(): number;
  settle(quietMs?: number, maxMs?: number): Promise<void>;
};

/**
 * The page-side probe, installed before any script of the page runs. It watches mutations, requests, alerts, copies
 * and window.open, and answers the questions the Node side asks. Noise (a ticking clock, an entrance animation) is
 * learned during the settle wait and ignored afterwards.
 */
function createProbe(quietMs: number, maxMs: number): Probe {
  const TOOLTIP = "[role=tooltip],[data-slot=tooltip-content]";
  const MODAL = "[role=dialog],[role=alertdialog],[role=menu],[role=listbox]";
  const OVERLAY = `${MODAL},[data-state=open]`;
  const MENU = "[role=menu]";
  const OPEN_MENU = "[role=menu][data-state=open]";
  const MENU_ITEMS = "[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio]";
  /** Radix keeps these two spans in the body while any menu is mounted and removes them with the last one. */
  const FOCUS_GUARD = "[data-radix-focus-guard]";
  /** The attributes the trigger flips when its menu closes. */
  const TRIGGER_CLOSING = ["aria-expanded", "aria-controls", "data-state"];
  const CONTROLS =
    "button,[role=button],[role=tab],[role=radio],[role=checkbox],[role=switch],a,input[type=submit],input[type=button],input[type=checkbox],input[type=radio],summary";
  const TOOLTIP_STATES = ["delayed-open", "instant-open"];
  const IGNORED_ATTRIBUTES = [
    "data-dc-id",
    "data-moving",
    "aria-describedby",
    "data-highlighted",
    "data-focus",
    "data-focus-visible",
    "data-hover",
    "data-aria-hidden",
    "data-scroll-locked",
    "tabindex",
  ];

  const ids = new WeakMap<Node, number>();
  let nextNodeId = 1;
  const nodeId = (node: Node) => {
    let id = ids.get(node);
    if (id === undefined) {
      id = nextNodeId++;
      ids.set(node, id);
    }
    return id;
  };

  type Snapshot = {
    url: string;
    overlays: number;
    toasts: number;
    scroll: string;
    aria: string;
    active: Element | null;
    id: number;
  };
  const state = {
    net: 0,
    popups: 0,
    alerts: 0,
    clipboard: 0,
    downloads: 0,
    dom: 0,
    samples: [] as string[],
    mode: "off" as "off" | "noise" | "count",
    noise: new Set<number>(),
    recent: [] as { at: number; key: number }[],
    lastChange: 0,
    snapshot: null as Snapshot | null,
    /** True while a menu item is under test: the menu closing on selection is then not a reaction. */
    menuItem: false as boolean,
    /** Menu items count down from -1, controls up from 1: the two never share an id. */
    menuItems: 0,
    menuTrigger: null as Element | null,
    armed: { net: 0, popups: 0, alerts: 0, clipboard: 0, downloads: 0 },
  };

  const patch = (target: object, name: string, wrapper: (original: (...args: unknown[]) => unknown) => unknown) => {
    const holder = target as Record<string, unknown>;
    const original = holder[name];
    if (typeof original === "function")
      holder[name] = wrapper(original.bind(target) as (...args: unknown[]) => unknown);
  };

  // Requests: Next's link prefetches fire when a link scrolls into view; they are not a reaction to a click.
  patch(window, "fetch", (original) => (input: unknown, init?: { headers?: HeadersInit }) => {
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (!headers.has("next-router-prefetch")) state.net++;
    return original(input, init);
  });
  patch(XMLHttpRequest.prototype, "send", (original) => (...args: unknown[]) => {
    state.net++;
    return original(...args);
  });
  patch(window, "open", () => () => {
    state.popups++;
    return null;
  });
  for (const name of ["alert", "confirm", "prompt"]) {
    patch(window, name, () => () => {
      state.alerts++;
      return name === "confirm";
    });
  }
  if (navigator.clipboard) {
    patch(navigator.clipboard, "writeText", () => () => {
      state.clipboard++;
      return Promise.resolve();
    });
  }
  patch(URL, "createObjectURL", (original) => (...args: unknown[]) => {
    state.downloads++;
    return original(...args);
  });

  const stripCustomProperties = (style: string | null) =>
    (style ?? "")
      .split(";")
      .map((declaration) => declaration.trim())
      .filter((declaration) => declaration && !declaration.startsWith("--"))
      .join(";");

  const elementOf = (node: Node | null) => (node instanceof Element ? node : (node?.parentElement ?? null));

  const isNoiseNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) return true;
    const element = elementOf(node);
    if (!element) return true;
    if (element.closest("head,script,style,link,template,next-route-announcer")) return true;
    if (element.closest(TOOLTIP)) return true;
    // The portal of the menu being closed by the selection, and the focus guards that leave the body with it.
    if (
      state.menuItem &&
      node instanceof Element &&
      (node.matches(`${MENU},${FOCUS_GUARD}`) || node.querySelector(MENU))
    )
      return true;
    // A portal wrapper that only carries a tooltip.
    return (
      node instanceof Element &&
      Boolean(node.querySelector(TOOLTIP)) &&
      !node.querySelector(`${MODAL},[data-slot=popover-content]`)
    );
  };

  // Live charts and waveforms redraw on their own; only an SVG inside the clicked control (an icon swap) counts.
  const isChartNoise = (record: MutationRecord) => {
    const target = elementOf(record.target);
    const clicked = state.snapshot ? document.querySelector(`[data-dc-id="${state.snapshot.id}"]`) : null;
    return Boolean(target?.closest("svg")) && !clicked?.contains(target);
  };

  const withoutPointerLock = (style: string | null) =>
    (style ?? "")
      .split(";")
      .map((declaration) => declaration.trim())
      .filter((declaration) => declaration && !declaration.startsWith("pointer-events"))
      .join(";");

  // What closing a menu on selection does by itself, and nothing wider: the menu's own markup, the trigger's expanded
  // state, and the modal layer's bookkeeping on the rest of the page (`aria-hidden` set together with the
  // `data-aria-hidden` marker of the aria-hidden library, the body's pointer lock). `marked` holds the elements whose
  // marker changed in the same batch of records.
  const isMenuClosing = (record: MutationRecord, marked: Set<Node>) => {
    const target = elementOf(record.target);
    if (!target) return false;
    if (target.closest(MENU)) return true;
    if (record.type !== "attributes") return false;
    const name = record.attributeName ?? "";
    if (target === state.menuTrigger) return TRIGGER_CLOSING.includes(name);
    if (name === "aria-hidden") return marked.has(record.target);
    if (name === "style" && (target === document.body || target === document.documentElement))
      return withoutPointerLock(record.oldValue) === withoutPointerLock(target.getAttribute(name));
    return target.matches("[data-radix-popper-content-wrapper]") && Boolean(target.querySelector(MENU));
  };

  const matters = (record: MutationRecord, marked: Set<Node>) => {
    if (isChartNoise(record)) return false;
    if (state.menuItem && isMenuClosing(record, marked)) return false;
    if (record.type === "characterData")
      return !record.target.parentElement?.closest(`${TOOLTIP},next-route-announcer`);
    if (record.type === "childList") {
      const changed = [...record.addedNodes, ...record.removedNodes];
      return changed.some((node) => !isNoiseNode(node)) && !elementOf(record.target)?.closest(`${TOOLTIP},head`);
    }
    const target = record.target as Element;
    const name = record.attributeName ?? "";
    if (
      IGNORED_ATTRIBUTES.includes(name) ||
      name.startsWith("data-radix-popper-") ||
      target.closest(TOOLTIP) ||
      target.closest("head")
    )
      return false;
    if (name === "data-state") {
      return !(
        TOOLTIP_STATES.includes(target.getAttribute(name) ?? "") || TOOLTIP_STATES.includes(record.oldValue ?? "")
      );
    }
    // Pointer-following effects write CSS custom properties; only a real style change counts.
    if (name === "style")
      return stripCustomProperties(record.oldValue) !== stripCustomProperties(target.getAttribute(name));
    return true;
  };

  const observer = new MutationObserver((records) => {
    const marked = new Set(
      records.filter((record) => record.attributeName === "data-aria-hidden").map((record) => record.target),
    );
    for (const record of records) {
      if (state.mode === "off" || !matters(record, marked)) continue;
      const key = nodeId(record.target);
      const now = performance.now();
      state.lastChange = now;
      if (state.mode === "noise") state.recent.push({ at: now, key });
      else if (!state.noise.has(key)) {
        state.dom++;
        if (state.samples.length < 4) {
          const target = elementOf(record.target);
          state.samples.push(
            `${record.type}:${record.attributeName ?? ""} <${target?.tagName.toLowerCase()} ${target?.getAttribute("data-slot") ?? target?.className?.toString().slice(0, 40)}>`,
          );
        }
      }
    }
  });
  const start = () => {
    observer.observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true,
    });
  };
  start();

  const overlayCount = () =>
    [...document.querySelectorAll(OVERLAY)].filter(
      (element) =>
        !element.matches(TOOLTIP) && !(state.menuItem && (element === state.menuTrigger || element.closest(MENU))),
    ).length;
  const toastCount = () => document.querySelectorAll("[data-sonner-toast]").length;
  const scrollSignature = () => `${window.scrollX},${window.scrollY}`;
  const find = (id: number) => document.querySelector<HTMLElement>(`[data-dc-id="${id}"]`);
  const ariaSignature = (element: HTMLElement | null) =>
    element
      ? [
          element.getAttribute("aria-pressed"),
          element.getAttribute("aria-expanded"),
          element.getAttribute("aria-checked"),
          element.getAttribute("aria-selected"),
          TOOLTIP_STATES.includes(element.getAttribute("data-state") ?? "")
            ? "closed"
            : element.getAttribute("data-state"),
          element instanceof HTMLInputElement ? String(element.checked) : "",
        ].join("|")
      : "removed";

  const visible = (element: HTMLElement) => {
    if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.right > 0 && box.left < window.innerWidth;
  };

  const roleOf = (element: HTMLElement) => {
    const explicit = element.getAttribute("role");
    if (explicit) return explicit;
    if (element instanceof HTMLAnchorElement) return "link";
    if (element instanceof HTMLInputElement) {
      return element.type === "checkbox" || element.type === "radio" ? element.type : "button";
    }
    return element.tagName === "SUMMARY" ? "button" : "button";
  };

  const nameOf = (element: HTMLElement) => {
    const clean = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
    const label = clean(element.getAttribute("aria-label"));
    if (label) return label;
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const text = clean(
        labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent)
          .join(" "),
      );
      if (text) return text;
    }
    if (
      element instanceof HTMLInputElement &&
      element.type !== "checkbox" &&
      element.type !== "radio" &&
      element.value
    ) {
      return clean(element.value);
    }
    // innerText keeps the spaces between blocks that textContent runs together ("2unassigned").
    // biome-ignore lint/performance/useDomNodeTextContent: the layout-aware text is what a person reads on the control
    const text = clean(element.innerText || element.textContent);
    if (text) return text;
    const image = element.querySelector("img[alt],svg title");
    return clean(element.getAttribute("title") ?? image?.getAttribute("alt") ?? image?.textContent);
  };

  const chromeOf = (element: HTMLElement) => {
    const chrome = element.closest("header,aside,nav[aria-label=Sections]");
    return chrome && !chrome.closest("main") ? chrome : null;
  };

  return {
    collect(scanShell, idByKey) {
      for (const stale of document.querySelectorAll("[data-dc-id]")) stale.removeAttribute("data-dc-id");
      const hasShell = Boolean(document.querySelector("nav[aria-label=Sections]"));
      const seen = new Map<string, number>();
      const controls: Control[] = [];
      const links: LinkRef[] = [];
      let next = 1;
      for (const element of document.querySelectorAll<HTMLElement>(CONTROLS)) {
        if (element.closest("[data-inert-reason],[inert]") || !visible(element)) continue;
        if (hasShell && !scanShell && chromeOf(element)) continue;
        const role = roleOf(element);
        const disabled =
          element.matches(":disabled") ||
          element.getAttribute("aria-disabled") === "true" ||
          element.hasAttribute("data-disabled") ||
          getComputedStyle(element).pointerEvents === "none";
        const selected =
          (role === "radio" &&
            (element.getAttribute("aria-checked") === "true" || (element as HTMLInputElement).checked)) ||
          (role === "tab" && element.getAttribute("aria-selected") === "true") ||
          // The current page or step of a pagination or a stepper is already where it points.
          !["false", null].includes(element.getAttribute("aria-current"));
        if (disabled || selected) continue;

        const name = nameOf(element);
        const slot = element.getAttribute("data-slot");
        const count = seen.get(`${role}|${name}`) ?? 0;
        seen.set(`${role}|${name}`, count + 1);
        const target = name
          ? `getByRole("${role}", { name: ${JSON.stringify(name)} })${count > 0 ? `.nth(${count})` : ""}`
          : `${element.tagName.toLowerCase()}${slot ? `[data-slot="${slot}"]` : ""}${element.id ? `#${element.id}` : ""} (unnamed #${count})`;

        const href = element instanceof HTMLAnchorElement ? element.getAttribute("href") : null;
        const isRealHref =
          href !== null && href !== "" && href !== "#" && !href.toLowerCase().startsWith("javascript:");
        if (isRealHref && element instanceof HTMLAnchorElement) {
          links.push({ href: element.href, role: "link", name, locator: target });
          continue;
        }

        const key = `${role}|${name}|${count}`;
        const id = idByKey ? idByKey[key] : next++;
        if (id === undefined) continue;
        element.setAttribute("data-dc-id", String(id));
        controls.push({ id, key, role, name, locator: target, menu: element.getAttribute("aria-haspopup") === "menu" });
      }
      return { controls, links };
    },

    prepare(id) {
      const element = find(id);
      if (!element?.isConnected) return { status: "gone" };
      if (!visible(element)) return { status: "hidden" };
      element.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
      const box = element.getBoundingClientRect();
      const x = Math.min(Math.max(box.left + box.width / 2, 1), window.innerWidth - 1);
      const y = Math.min(Math.max(box.top + box.height / 2, 1), window.innerHeight - 1);
      if (box.bottom < 0 || box.top > window.innerHeight) return { status: "offscreen" };
      const hit = document.elementFromPoint(x, y);
      if (!hit || !(hit === element || element.contains(hit))) return { status: "covered" };
      return { status: "ok", x, y };
    },

    collectMenu() {
      const menu = [...document.querySelectorAll<HTMLElement>(OPEN_MENU)].at(-1);
      const items: MenuItem[] = [];
      const links: LinkRef[] = [];
      if (!menu) return { items, links };
      const seen = new Map<string, number>();
      for (const element of menu.querySelectorAll<HTMLElement>(MENU_ITEMS)) {
        if (element.closest(MENU) !== menu || element.closest("[data-inert-reason],[inert]") || !visible(element))
          continue;
        const role = roleOf(element);
        const disabled = element.getAttribute("aria-disabled") === "true" || element.hasAttribute("data-disabled");
        // The chosen option of a radio group is already where it points.
        const chosen = role === "menuitemradio" && element.getAttribute("aria-checked") === "true";
        if (disabled || chosen) continue;
        const name = nameOf(element);
        const count = seen.get(`${role}|${name}`) ?? 0;
        seen.set(`${role}|${name}`, count + 1);
        const locator = `getByRole("${role}", { name: ${JSON.stringify(name)} })${count > 0 ? `.nth(${count})` : ""}`;
        const href = element instanceof HTMLAnchorElement ? element.getAttribute("href") : null;
        if (href && href !== "#" && !href.toLowerCase().startsWith("javascript:")) {
          links.push({ href: (element as HTMLAnchorElement).href, role: "link", name, locator });
          continue;
        }
        const id = -++state.menuItems;
        element.setAttribute("data-dc-id", String(id));
        items.push({
          id,
          key: `${role}|${name}|${count}`,
          role,
          name,
          locator,
          sub: element.getAttribute("aria-haspopup") === "menu",
        });
      }
      return { items, links };
    },

    menuDepth() {
      return document.querySelectorAll(OPEN_MENU).length;
    },

    arm(id, trigger) {
      state.menuItem = trigger !== undefined;
      state.menuTrigger = trigger === undefined ? null : find(trigger);
      state.snapshot = {
        url: location.href,
        overlays: overlayCount(),
        toasts: toastCount(),
        scroll: scrollSignature(),
        aria: ariaSignature(find(id)),
        active: document.activeElement,
        id,
      };
      state.armed = {
        net: state.net,
        popups: state.popups,
        alerts: state.alerts,
        clipboard: state.clipboard,
        downloads: state.downloads,
      };
      state.dom = 0;
      state.samples.length = 0;
      state.mode = "count";
    },

    samples() {
      return [...state.samples];
    },

    reasons() {
      const before = state.snapshot;
      if (!before) return [];
      const element = find(before.id);
      const found: Reason[] = [];
      if (location.href !== before.url) found.push("url");
      if (overlayCount() !== before.overlays) found.push("overlay");
      // A menu item leaves the page with its menu; only an item that stays can have changed its own state.
      if ((!state.menuItem || element?.isConnected) && ariaSignature(element) !== before.aria) found.push("aria");
      if (toastCount() !== before.toasts) found.push("toast");
      if (state.net !== state.armed.net) found.push("network");
      if (state.dom > 0) found.push("dom");
      if (scrollSignature() !== before.scroll) found.push("scroll");
      const active = document.activeElement;
      if (
        active &&
        active !== document.body &&
        active !== before.active &&
        active !== element &&
        active !== state.menuTrigger
      )
        found.push("focus");
      if (state.popups !== state.armed.popups) found.push("popup");
      if (state.alerts !== state.armed.alerts) found.push("alert");
      if (state.clipboard !== state.armed.clipboard) found.push("clipboard");
      if (state.downloads !== state.armed.downloads) found.push("download");
      return found;
    },

    reacted() {
      return this.reasons().length > 0;
    },

    modalCount() {
      return [...document.querySelectorAll(MODAL)].filter((element) => !element.matches(TOOLTIP)).length;
    },

    /** Resolves once the page has been quiet for a moment; learns what keeps changing on its own. */
    settle(quietFor = quietMs, giveUpAfter = maxMs) {
      state.mode = "noise";
      state.recent.length = 0;
      state.noise.clear();
      state.lastChange = performance.now();
      const began = performance.now();
      return new Promise<void>((resolve) => {
        const tick = () => {
          const now = performance.now();
          const quiet = now - state.lastChange >= quietFor;
          if (quiet || now - began >= giveUpAfter) {
            // A page that never went quiet has tickers: remember the elements that changed in the last second.
            if (!quiet) for (const { at, key } of state.recent) if (now - at < 1500) state.noise.add(key);
            state.mode = "count";
            resolve();
            return;
          }
          setTimeout(tick, 50);
        };
        tick();
      });
    },
  };
}

const probeSource = `window.__dc = (${createProbe})(${SETTLE_QUIET_MS}, ${SETTLE_MAX_MS});`;

declare global {
  interface Window {
    __dc: Probe;
  }
}

type Finding = {
  route: string;
  viewport: string;
  name: string;
  role: string;
  locator: string;
  /** `not-swept`: a menu or a menu item that could not be reached, so nothing is known about it. */
  reason: "no-reaction" | "broken-link" | "not-swept";
};

type RouteReport = {
  route: string;
  viewport: string;
  scanned: number;
  menuItems: number;
  linksChecked: number;
  skipped: Record<string, number>;
  reactions: Partial<Record<Reason, number>>;
  dead: Finding[];
  note?: string;
};

const linkStatus = new Map<string, boolean>();

async function linkWorks(page: Page, href: string) {
  const url = new URL(href);
  if (url.origin !== new URL(page.url()).origin) return true;
  if (PAGE_ROUTES.includes(url.pathname.replace(/\/$/, "") || "/")) return true;
  const known = linkStatus.get(url.pathname);
  if (known !== undefined) return known;
  const works = await page.request
    .get(url.href, { failOnStatusCode: false })
    .then((response) => response.status() < 400)
    .catch(() => false);
  linkStatus.set(url.pathname, works);
  return works;
}

async function scanRoute(page: Page, route: string, viewport: string): Promise<RouteReport> {
  const scanShell = route === SHELL_ROUTE;
  const report: RouteReport = {
    route,
    viewport,
    scanned: 0,
    menuItems: 0,
    linksChecked: 0,
    skipped: {},
    reactions: {},
    dead: [],
  };
  let nodeEvents = 0;
  page.on("popup", (popup) => {
    nodeEvents++;
    void popup.close();
  });
  page.on("download", () => nodeEvents++);
  page.on("filechooser", () => nodeEvents++);
  page.on("dialog", (dialog) => void dialog.dismiss());
  if (process.env.DEAD_CLICKS_DEBUG)
    page.on("pageerror", (error) => console.log(`pageerror on ${route}: ${error.message}`));

  const open = async () => {
    await page.goto(route);
    await page.waitForLoadState("load");
    await page.evaluate(() => window.__dc.settle());
  };
  const collect = (idByKey: Record<string, number> | null) =>
    page.evaluate(([shell, ids]) => window.__dc.collect(shell, ids), [scanShell, idByKey] as const);
  const modals = () => page.evaluate(() => window.__dc.modalCount());

  await open();
  if (new URL(page.url()).pathname !== route) {
    report.note = `redirects to ${new URL(page.url()).pathname}`;
    return report;
  }
  const first = await collect(null);
  const controls = first.controls;
  const idByKey = Object.fromEntries(controls.map((control) => [control.key, control.id]));
  let baselineModals = await modals();

  for (const link of first.links) {
    report.linksChecked++;
    if (!(await linkWorks(page, link.href))) {
      report.dead.push({
        route,
        viewport,
        name: link.name,
        role: link.role,
        locator: link.locator,
        reason: "broken-link",
      });
    }
  }

  /** Back to a clean copy of the page; every control keeps the id it had. */
  const reload = async () => {
    // A click may have saved a preference (a folded rail): the fresh copy starts from the defaults again.
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await open();
    await collect(idByKey);
    baselineModals = await modals();
  };

  /** Undoes what a click left behind: a navigation, an open dialog or menu. Other changes stay (see `drifted`). */
  const restore = async (navigated: boolean) => {
    if (navigated || new URL(page.url()).pathname !== route) return reload();
    for (let attempt = 0; attempt < 2 && (await modals()) > baselineModals; attempt++) {
      await page.keyboard.press("Escape");
      await page
        .waitForFunction((limit) => window.__dc.modalCount() <= limit, baselineModals, { timeout: 700 })
        .catch(() => undefined);
    }
    if ((await modals()) > baselineModals) await reload();
  };

  type Outcome = { kind: "skipped"; why: string } | { kind: "done"; reasons: Reason[] };

  /** Activates one control the way a pointer does, and reports what followed within the window. */
  const activate = async (control: Pick<Control, "id">, windowMs: number, trigger?: Control): Promise<Outcome> => {
    const prepared = await page.evaluate((id) => window.__dc.prepare(id), control.id);
    if (prepared.status !== "ok") return { kind: "skipped", why: prepared.status };
    await page.mouse.move(prepared.x, prepared.y);
    await page.evaluate(([id, owner]) => window.__dc.arm(id, owner), [control.id, trigger?.id] as const);
    const eventsBefore = nodeEvents;
    const urlBefore = page.url();
    await page.mouse.down();
    await page.mouse.up();
    await page
      .waitForFunction(() => window.__dc.reacted(), undefined, { timeout: windowMs, polling: 40 })
      .catch(() => undefined); // No reaction in the window, or the page navigated under us: both are read below.
    if (page.url() !== urlBefore) return { kind: "done", reasons: ["url"] };
    const reasons = await page.evaluate(() => window.__dc.reasons()).catch((): Reason[] => ["url"]);
    if (nodeEvents !== eventsBefore) reasons.push("popup");
    return { kind: "done", reasons };
  };

  const dead: Control[] = [];
  let drifted = false;
  for (const control of controls) {
    let outcome = await activate(control, OBSERVE_MS);
    if (outcome.kind === "skipped" && drifted) {
      // Earlier clicks changed the page and may have hidden or moved this control: look again on a fresh copy.
      await reload();
      drifted = false;
      outcome = await activate(control, OBSERVE_MS);
    }
    if (outcome.kind === "skipped") {
      report.skipped[outcome.why] = (report.skipped[outcome.why] ?? 0) + 1;
      continue;
    }
    report.scanned++;
    if (process.env.DEAD_CLICKS_DEBUG) {
      console.log(
        `${viewport} ${route} ${control.role} "${control.name}": ${outcome.reasons.join(",") || "DEAD"} ${outcome.reasons.includes("dom") ? await page.evaluate(() => window.__dc.samples().join(" | ")) : ""}`,
      );
    }
    if (outcome.reasons.length === 0) dead.push(control);
    else drifted = true;
    for (const reason of outcome.reasons) report.reactions[reason] = (report.reactions[reason] ?? 0) + 1;
    await restore(outcome.reasons.includes("url"));
    // What a reaction set going (a sliding thumb, a fade) must end before the next control is measured.
    if (outcome.reasons.length > 0) await page.evaluate(() => window.__dc.settle(200, 1000));
  }

  // A slow machine can miss a reaction inside the short window: each dead control gets one longer try on a fresh page.
  if (dead.length > 0) await reload();
  for (const control of dead) {
    const outcome = await activate(control, RECHECK_MS);
    const confirmed = outcome.kind === "done" && outcome.reasons.length === 0;
    if (confirmed) {
      report.dead.push({
        route,
        viewport,
        name: control.name,
        role: control.role,
        locator: control.locator,
        reason: "no-reaction",
      });
    }
    await restore(outcome.kind === "done" && outcome.reasons.includes("url"));
  }

  // Menu items (spec 009, V3-AC4): each one has to lead somewhere, or the menu is not finished.
  type Step = { trigger: Control; path: string[] };
  const clickAt = async (id: number) => {
    const prepared = await page.evaluate((target) => window.__dc.prepare(target), id);
    if (prepared.status !== "ok") return false;
    await page.mouse.move(prepared.x, prepared.y);
    await page.mouse.down();
    await page.mouse.up();
    return true;
  };
  /** Opens the trigger's menu, then each submenu of the path; returns what the last menu offers, or null. */
  const openMenu = async ({ trigger, path }: Step): Promise<MenuContents | null> => {
    let menu: MenuContents | null = null;
    for (let level = 0; level <= path.length; level++) {
      const target = menu ? menu.items.find((item) => item.sub && item.name === path[level - 1])?.id : trigger.id;
      if (target === undefined || !(await clickAt(target))) return null;
      const opened = await page
        .waitForFunction((depth) => window.__dc.menuDepth() >= depth, level + 1, { timeout: 1500 })
        .then(
          () => true,
          () => false,
        );
      if (!opened) return null;
      await page.evaluate(() => window.__dc.settle(200, 1000));
      menu = await page.evaluate(() => window.__dc.collectMenu());
    }
    return menu;
  };
  /** Opens the menu of the step again and presses one item; null when the menu or the item is not there. */
  const sweepItem = async (step: Step, item: MenuItem, windowMs: number) => {
    const again = await openMenu(step);
    const live = again?.items.find((candidate) => candidate.key === item.key);
    return live ? activate(live, windowMs, step.trigger) : null;
  };
  const menuOf = (step: Step) =>
    `the menu of ${step.trigger.locator}${step.path.length ? ` > ${step.path.join(" > ")}` : ""}`;
  const where = (step: Step, item: { locator: string }) => `${item.locator} in ${menuOf(step)}`;

  const queue: Step[] = controls.filter((control) => control.menu).map((trigger) => ({ trigger, path: [] }));
  const swept = new Set<string>();
  const deadItems: { step: Step; item: MenuItem }[] = [];
  let stale = queue.length > 0;
  for (let at = 0; at < queue.length; at++) {
    const step = queue[at];
    if (stale) await reload();
    stale = false;
    let menu = await openMenu(step);
    if (!menu) {
      await reload();
      menu = await openMenu(step);
    }
    if (!menu) {
      report.dead.push({
        route,
        viewport,
        name: step.path.at(-1) ?? step.trigger.name,
        role: step.path.length ? "menuitem" : "button",
        locator: menuOf(step),
        reason: "not-swept",
      });
      await restore(false);
      continue;
    }
    for (const link of menu.links) {
      report.linksChecked++;
      if (!(await linkWorks(page, link.href))) {
        report.dead.push({
          route,
          viewport,
          name: link.name,
          role: link.role,
          locator: where(step, link),
          reason: "broken-link",
        });
      }
    }
    const signature = [step.path.join(">"), ...menu.items.map((item) => item.key)].join("\n");
    await restore(false);
    // Another trigger of the same kind (a row menu) offers the same items: they are swept once.
    if (swept.has(signature)) continue;
    swept.add(signature);
    for (const item of menu.items) if (item.sub) queue.push({ trigger: step.trigger, path: [...step.path, item.name] });

    for (const item of menu.items) {
      if (stale) await reload();
      stale = false;
      let outcome = await sweepItem(step, item, OBSERVE_MS);
      if (outcome?.kind !== "done") {
        // An item that cannot be pressed is not a pass: look again on a fresh page, then report it.
        await reload();
        outcome = await sweepItem(step, item, OBSERVE_MS);
      }
      if (outcome?.kind !== "done") {
        report.dead.push({
          route,
          viewport,
          name: item.name,
          role: item.role,
          locator: where(step, item),
          reason: "not-swept",
        });
        await restore(false);
        continue;
      }
      report.menuItems++;
      if (process.env.DEAD_CLICKS_DEBUG)
        console.log(
          `${viewport} ${route} ${where(step, item)}: ${outcome.reasons.join(",") || "DEAD"} ${outcome.reasons.includes("dom") ? await page.evaluate(() => window.__dc.samples().join(" | ")) : ""}`,
        );
      if (outcome.reasons.length === 0) deadItems.push({ step, item });
      else stale = true;
      for (const reason of outcome.reasons) report.reactions[reason] = (report.reactions[reason] ?? 0) + 1;
      await restore(outcome.reasons.includes("url"));
      if (outcome.reasons.length > 0) await page.evaluate(() => window.__dc.settle(200, 1000));
    }
  }

  // The same longer second look as the controls get, on a fresh copy of the page.
  if (deadItems.length > 0) await reload();
  for (const { step, item } of deadItems) {
    const outcome = await sweepItem(step, item, RECHECK_MS);
    // An item the first look found dead and the second cannot press is reported, never dropped.
    if (outcome?.kind !== "done" || outcome.reasons.length === 0) {
      report.dead.push({
        route,
        viewport,
        name: item.name,
        role: item.role,
        locator: where(step, item),
        reason: outcome?.kind === "done" ? "no-reaction" : "not-swept",
      });
    }
    await restore(outcome?.kind === "done" && outcome.reasons.includes("url"));
  }
  return report;
}

/** Waits for the lock directory; the merge of per-route files must not interleave between workers. */
function withLock(run: () => void) {
  const lock = path.join(RESULTS_DIR, "dead-clicks.lock");
  const wait = new Int32Array(new SharedArrayBuffer(4));
  for (let attempt = 0; ; attempt++) {
    try {
      mkdirSync(lock);
      break;
    } catch (error) {
      if (attempt > 500) throw error;
      Atomics.wait(wait, 0, 0, 20);
    }
  }
  try {
    run();
  } finally {
    rmdirSync(lock);
  }
}

/** Writes this route's report, rebuilds `test-results/dead-clicks.json` from all of them and prints the table. */
function publish(report: RouteReport, expected: number) {
  mkdirSync(PARTS_DIR, { recursive: true });
  const file = path.join(PARTS_DIR, `${report.viewport}${report.route.replaceAll("/", "_") || "_"}.json`);
  writeFileSync(file, JSON.stringify(report));
  withLock(() => {
    const parts = readdirSync(PARTS_DIR)
      .filter((name) => name.endsWith(".json"))
      .map((name) => JSON.parse(readFileSync(path.join(PARTS_DIR, name), "utf8")) as RouteReport)
      .sort((a, b) => a.route.localeCompare(b.route) || Number(b.viewport) - Number(a.viewport));
    const findings = parts.flatMap((part) => part.dead);
    const temporary = path.join(RESULTS_DIR, "dead-clicks.json.tmp");
    writeFileSync(temporary, `${JSON.stringify(findings, null, 2)}\n`);
    renameSync(temporary, path.join(RESULTS_DIR, "dead-clicks.json"));
    if (parts.length >= expected) {
      const lines = parts.map(
        (part) =>
          `${part.viewport.padStart(5)}  ${part.route.padEnd(48)} dead ${String(part.dead.length).padStart(2)} of ${String(part.scanned).padStart(3)} controls` +
          `, ${part.menuItems ?? 0} menu items, ${part.linksChecked} links${part.note ? ` (${part.note})` : ""}`,
      );
      console.log(
        `\nDead clicks per route (${findings.length} in total), details in test-results/dead-clicks.json\n${lines.join("\n")}\n`,
      );
    }
  });
}

test.describe.configure({ mode: "parallel" });

const total = PAGE_ROUTES.length * 2;

for (const route of PAGE_ROUTES) {
  test(`dead clicks on ${route}`, async ({ page, context, baseURL }, testInfo) => {
    test.setTimeout(300_000);
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    await context.addInitScript({ content: probeSource });

    const report = await scanRoute(page, route, testInfo.project.name);
    publish(report, total);
    await testInfo.attach("dead-clicks", { body: JSON.stringify(report, null, 2), contentType: "application/json" });

    // The gate turns every dead control into a failure; report mode only measures.
    const fails = ENFORCE ? report.dead : [];
    expect(fails.map((finding) => `${finding.role} "${finding.name}" (${finding.locator})`)).toEqual([]);
  });
}

/**
 * A menu that behaves like the app's Radix dropdowns, close sequence included: the portal and its popper wrapper, the
 * focus guards on the body, the page locked behind it (`aria-hidden` with the `data-aria-hidden` marker, the body's
 * pointer lock). Selecting an item flips the trigger and the menu to closed at once; the Presence exit then keeps the
 * closed menu for a moment, and only when it unmounts do the guards, the page lock and the trigger focus go.
 * Items: one that works, a link, a submenu (its own portal, as in Radix) and two items that do nothing, one in the
 * menu and one in the submenu. Three items whose only effect is easy to mask by mistake: relabelling the trigger,
 * hiding a node with `aria-hidden` on its own, and a style change on the body. The sweep must name the dead items
 * and only them; the page is served by the test, it is not a route of the app. Under a path ending in `-covered`
 * something sits over the Archive item for as long as the menu is open.
 */
const MENU_FIXTURE = `<!doctype html><html><body>
<main id="app"><h1 id="title">Report</h1><p id="note">Note</p>
<button id="trigger" aria-haspopup="menu" aria-expanded="false" data-state="closed">Actions</button></main>
<script>
  const trigger = document.getElementById("trigger");
  const app = document.getElementById("app");
  let portals = [];
  let guards = [];
  const guard = () => {
    const element = document.createElement("span");
    element.setAttribute("data-radix-focus-guard", "");
    element.tabIndex = 0;
    return element;
  };
  const portal = (menu, top) => {
    const outer = document.createElement("div");
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-radix-popper-content-wrapper", "");
    wrapper.style.cssText = "position: fixed; left: 0; top: 0; transform: translate(8px, " + top + "px); z-index: 50;";
    wrapper.append(menu);
    outer.append(wrapper);
    document.body.append(outer);
    portals.push(outer);
  };
  const unmount = () => {
    for (const outer of portals) outer.remove();
    portals = [];
    for (const element of guards) element.remove();
    guards = [];
    app.removeAttribute("aria-hidden"); app.removeAttribute("data-aria-hidden");
    document.body.style.pointerEvents = "";
    trigger.focus();
  };
  const close = () => {
    trigger.setAttribute("aria-expanded", "false"); trigger.setAttribute("data-state", "closed");
    trigger.removeAttribute("aria-controls");
    for (const outer of portals) for (const menu of outer.querySelectorAll("[role=menu]")) menu.setAttribute("data-state", "closed");
    setTimeout(unmount, 120);
  };
  const item = (label, onSelect) => {
    const element = document.createElement("div");
    element.setAttribute("role", "menuitem"); element.tabIndex = -1; element.textContent = label;
    element.addEventListener("click", () => { close(); onSelect(); });
    return element;
  };
  const menuElement = () => {
    const menu = document.createElement("div");
    menu.setAttribute("role", "menu"); menu.setAttribute("data-state", "open"); menu.style.pointerEvents = "auto";
    return menu;
  };
  trigger.addEventListener("click", () => {
    if (portals.length) return;
    const menu = menuElement();
    menu.append(
      item("Rename", () => { document.getElementById("title").textContent = "Renamed"; }),
      item("Archive", () => {}),
      item("Relabel", () => { trigger.firstChild.data = "Actions (relabelled)"; }),
      item("Hide note", () => { document.getElementById("note").setAttribute("aria-hidden", "true"); }),
      item("Dim page", () => { document.body.style.background = "#ccc"; }),
    );
    const more = document.createElement("div");
    more.setAttribute("role", "menuitem"); more.setAttribute("aria-haspopup", "menu");
    more.setAttribute("aria-expanded", "false"); more.tabIndex = -1; more.textContent = "Move to";
    more.addEventListener("click", () => {
      if (more.getAttribute("aria-expanded") === "true") return;
      const sub = menuElement();
      sub.append(
        item("Trash", () => {}),
        item("Inbox", () => { document.getElementById("title").textContent = "Moved"; }),
      );
      portal(sub, 220);
      more.setAttribute("aria-expanded", "true"); more.setAttribute("data-state", "open");
    });
    menu.append(more);
    const link = document.createElement("a");
    link.setAttribute("role", "menuitem"); link.href = "/dashboard/default"; link.textContent = "Open dashboard";
    menu.append(link);
    guards = [guard(), guard()];
    document.body.insertAdjacentElement("afterbegin", guards[0]);
    document.body.insertAdjacentElement("beforeend", guards[1]);
    portal(menu, 60);
    if (location.pathname.endsWith("-covered")) {
      const archive = [...menu.children].find((child) => child.textContent === "Archive");
      const cover = document.createElement("div");
      cover.style.cssText = "position: absolute; z-index: 100; pointer-events: auto; left: " + archive.offsetLeft + "px; top: " + archive.offsetTop + "px; width: " + archive.offsetWidth + "px; height: " + archive.offsetHeight + "px;";
      menu.parentElement.append(cover);
    }
    trigger.setAttribute("aria-expanded", "true"); trigger.setAttribute("data-state", "open");
    trigger.setAttribute("aria-controls", "menu");
    app.setAttribute("data-aria-hidden", "true"); app.setAttribute("aria-hidden", "true");
    document.body.style.pointerEvents = "none";
  });
</script></body></html>`;

const serveMenuFixture = (page: Page, pathname: string) =>
  page.route(`**${pathname}`, (route) => route.fulfill({ contentType: "text/html", body: MENU_FIXTURE }));

test("the sweep names a menu item that leads nowhere and passes one that does", async ({ page, context }, testInfo) => {
  await context.addInitScript({ content: probeSource });
  await serveMenuFixture(page, "/dead-click-menu-fixture");

  const report = await scanRoute(page, "/dead-click-menu-fixture", testInfo.project.name);

  expect(report.dead.map((finding) => `${finding.role} "${finding.name}"`)).toEqual([
    'menuitem "Archive"',
    'menuitem "Trash"',
  ]);
  expect(report.menuItems).toBe(8);
  expect(report.linksChecked).toBe(1);
});

test("the sweep reports a menu item it cannot press instead of skipping it", async ({ page, context }, testInfo) => {
  await context.addInitScript({ content: probeSource });
  await serveMenuFixture(page, "/dead-click-menu-fixture-covered");

  const report = await scanRoute(page, "/dead-click-menu-fixture-covered", testInfo.project.name);

  expect(report.dead.map((finding) => `${finding.role} "${finding.name}" ${finding.reason}`)).toEqual([
    'menuitem "Archive" not-swept',
    'menuitem "Trash" no-reaction',
  ]);
  expect(report.menuItems).toBe(7);
});

/**
 * The only controls the sweep may skip, each with the reason it cannot be observed (plan 003, G1). A new
 * `data-inert-reason` fails here until it is reviewed and listed. An exception whose file is gone, because its
 * module is not installed, is not expected in the source.
 */
const LISTED_EXCEPTIONS = [
  [
    "src/app/(main)/dashboard/(examples)/patient-monitoring/_components/monitoring-provider.tsx",
    "A tooltip target: the status opens on hover and focus, not on press.",
  ],
  [
    "src/app/(main)/dashboard/(examples)/patient-monitoring/_components/monitoring-provider.tsx",
    "Opens the browser print dialog, which the dead-click sweep cannot observe.",
  ],
  [
    "src/app/(main)/dashboard/academy/_components/performance-highlights.tsx",
    "A tooltip target: the student's details open on hover and focus, not on press.",
  ],
  [
    "src/app/(main)/dashboard/invoice/_components/invoice-preview.tsx",
    "Opens the browser print dialog, which the dead-click sweep cannot observe.",
  ],
] as const;

const INERT_EXCEPTIONS = LISTED_EXCEPTIONS.filter(([file]) => existsSync(path.join(process.cwd(), file)));

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });

const inertReasonsInSource = () =>
  sourceFiles(path.join(process.cwd(), "src"))
    .flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(/data-inert-reason="([^"]+)"/g)].map(
        (match) => `${path.relative(process.cwd(), file)} | ${match[1]}`,
      ),
    )
    .filter((entry, index, all) => all.indexOf(entry) === index)
    .sort();

test("every control the sweep skips is a listed exception", () => {
  expect(inertReasonsInSource()).toEqual(INERT_EXCEPTIONS.map(([file, reason]) => `${file} | ${reason}`).sort());
});
