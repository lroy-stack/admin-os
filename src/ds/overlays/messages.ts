import { type MessageKey, messageKey } from "@/core/i18n/client";

/** Text of the shared windows: confirmation, the quick and form dialogs and the unsaved-changes question. */
export interface OverlaysMessages {
  readonly confirm: {
    readonly cancel: string;
    /** Read by assistive technology while the action runs. */
    readonly pending: string;
    /** Under a reason field that is still empty or invalid. */
    readonly reasonRequired: string;
    /** When the action threw or never answered. */
    readonly failed: string;
    /** When the answer listed field problems but none could be shown. */
    readonly invalid: string;
  };
  readonly discard: {
    readonly title: string;
    readonly consequence: string;
    readonly keep: string;
    readonly discard: string;
  };
  readonly window: {
    readonly close: string;
    /** Footer note of showcase windows whose data is local to the screen. */
    readonly demoNote: string;
  };
  /** The docked panel's pick mode: what it tells the person while the page waits for an answer. */
  readonly dock: {
    /** Announced when the panel starts waiting for a click on the page. */
    readonly pickHint: string;
    /** The button that leaves pick mode, for people who do not use Escape. */
    readonly stopPicking: string;
  };
}

export const overlaysMessageKey: MessageKey<OverlaysMessages> = messageKey<OverlaysMessages>("overlays");
