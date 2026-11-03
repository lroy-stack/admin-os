import { type RefObject, useRef } from "react";

/** Where focus goes on close: an element, or a ref or getter read at close time (so an opener's handler can set it). */
export type ReturnFocus = Element | RefObject<Element | null> | (() => Element | null) | null | undefined;

function resolve(returnFocus: ReturnFocus): Element | null {
  if (returnFocus === null || returnFocus === undefined) return null;
  if (typeof returnFocus === "function") return returnFocus();
  if ("current" in returnFocus) return returnFocus.current;
  return returnFocus;
}

const isFocusable = (target: Element | null): target is HTMLElement =>
  target instanceof HTMLElement && target !== document.body && target.isConnected;

/**
 * Focus handlers for a window opened by app state, the one place that restores focus. Radix returns focus only to
 * its own Trigger, so a controlled window returns it, in order, to `returnFocus` (for openers that are detached when
 * the window closes, such as a DropdownMenu item, or never focused, as buttons in WebKit), then to the element that
 * was focused when it opened if that is still in the page. Otherwise Radix keeps its default, which returns to the
 * Trigger if there is one.
 */
export function useRestoreFocus(returnFocus?: ReturnFocus) {
  const opener = useRef<Element | null>(null);
  return {
    onOpenAutoFocus: () => {
      opener.current = document.activeElement;
    },
    onCloseAutoFocus: (event: Event) => {
      const target = [resolve(returnFocus), opener.current].find(isFocusable);
      if (target) {
        event.preventDefault();
        target.focus();
      }
    },
  };
}
