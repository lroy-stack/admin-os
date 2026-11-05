/**
 * The one stable hook of the block control. A block turns it into an unblock and back when the page refreshes, so the
 * control that opened a window is gone when the window closes; focus goes to whichever one is there (ADR 0015).
 */
export const BLOCK_TOGGLE = { "data-record-toggle": "block" } as const;

export const findBlockToggle = (): HTMLElement | null =>
  document.querySelector<HTMLElement>("[data-record-toggle=block]");
