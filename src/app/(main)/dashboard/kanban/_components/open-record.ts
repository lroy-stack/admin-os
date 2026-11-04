import type { MouseEvent } from "react";

/**
 * Whether a click on a card or row is meant to open its record: it landed on the card's own surface, not on a control
 * inside it (the menu button) and not on a window that React bubbles through its portal (a menu item).
 */
export function opensRecord(event: MouseEvent<HTMLElement>): boolean {
  const target = event.target;
  if (!(target instanceof Element) || !event.currentTarget.contains(target)) return false;
  return target.closest("button, a, input, select, textarea, [role=menuitem]") === null;
}
