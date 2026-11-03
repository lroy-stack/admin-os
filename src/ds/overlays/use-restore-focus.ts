import { useRef } from "react";

/**
 * Focus handlers for a window opened by app state. Radix returns focus only to its own Trigger, so a controlled
 * window remembers the element focused when it opened and refocuses it on close. When nothing useful was focused
 * (Safari does not focus clicked buttons) Radix keeps its default, which returns to the Trigger if there is one.
 */
export function useRestoreFocus() {
  const opener = useRef<Element | null>(null);
  return {
    onOpenAutoFocus: () => {
      opener.current = document.activeElement;
    },
    onCloseAutoFocus: (event: Event) => {
      const target = opener.current;
      if (target instanceof HTMLElement && target !== document.body && target.isConnected) {
        event.preventDefault();
        target.focus();
      }
    },
  };
}
