import { useSyncExternalStore } from "react";

/** `phone` below 768 px, `tablet` from 768 px, `desktop` from 1024 px (Tailwind `md` and `lg`). */
export type Viewport = "phone" | "tablet" | "desktop";

const TABLET_QUERY = "(min-width: 768px)";
const DESKTOP_QUERY = "(min-width: 1024px)";

/** The current breakpoint, read from `matchMedia`. */
export function readViewport(): Viewport {
  if (window.matchMedia(DESKTOP_QUERY).matches) return "desktop";
  return window.matchMedia(TABLET_QUERY).matches ? "tablet" : "phone";
}

export function subscribeViewport(onChange: () => void): () => void {
  const lists = [TABLET_QUERY, DESKTOP_QUERY].map((query) => window.matchMedia(query));
  for (const list of lists) list.addEventListener("change", onChange);
  return () => {
    for (const list of lists) list.removeEventListener("change", onChange);
  };
}

/**
 * The current breakpoint, or `undefined` on the server and during hydration, so the first client render matches the
 * server HTML. Decide layout from it only after it is known.
 */
export function useViewport(): Viewport | undefined {
  return useSyncExternalStore(subscribeViewport, readViewport, () => undefined);
}
