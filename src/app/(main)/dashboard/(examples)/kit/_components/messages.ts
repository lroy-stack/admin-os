import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

/** The fields and buttons shared by the two dialog sections. */
interface DialogDemoMessages {
  readonly title: string;
  readonly description: string;
  readonly open: string;
  readonly windowTitle: string;
  readonly windowDescription: string;
  readonly submit: string;
  readonly cancel: string;
  /** Placeholders: `{name}`. Shown after the demo form is submitted. */
  readonly submitted: string;
}

/** Text of /dashboard/kit, the showcase of the shared window kit. Demo content included. */
export interface KitMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly subtitle: string;
  readonly panel: {
    readonly title: string;
    readonly description: string;
    readonly open: string;
    readonly panelTitle: string;
    readonly panelDescription: string;
    readonly panelBody: string;
  };
  readonly confirm: {
    readonly title: string;
    readonly description: string;
    readonly plain: {
      readonly open: string;
      readonly title: string;
      readonly consequence: string;
    };
    readonly withReason: {
      readonly open: string;
      readonly title: string;
      readonly consequence: string;
      readonly reasonLabel: string;
      readonly reasonTooShort: string;
    };
    readonly failing: {
      readonly open: string;
      readonly title: string;
      readonly consequence: string;
      /** What the demo action answers when it refuses. */
      readonly refusal: string;
    };
    /** A row menu whose item opens the plain confirmation: the opener is gone when the window closes. */
    readonly menu: {
      readonly trigger: string;
      readonly item: string;
    };
    /** Placeholders: `{count}`, how many times an action ran. */
    readonly confirmed: Plural;
  };
  readonly quick: DialogDemoMessages & {
    readonly nameLabel: string;
    readonly partyLabel: string;
  };
  readonly form: Omit<DialogDemoMessages, "cancel"> & {
    readonly nameLabel: string;
    readonly emailLabel: string;
    readonly notesLabel: string;
    /** The small control that picks what the demo submit answers. */
    readonly outcomeLabel: string;
    readonly outcome: {
      readonly ok: string;
      readonly invalid: string;
      readonly error: string;
      readonly awaiting: string;
    };
    readonly nameRequired: string;
    readonly emailInvalid: string;
    /** The server issue the `invalid` outcome puts on the email field. */
    readonly emailTaken: string;
    /** The form-level text of the `error` outcome. */
    readonly failed: string;
    /** Who decides in the `awaiting_approval` outcome. */
    readonly approvalRole: string;
    /** Placeholders: `{count}`. How many submits reached the demo server, so a refused second submit is visible. */
    readonly attempts: string;
  };
  readonly dock: {
    readonly title: string;
    readonly description: string;
    readonly open: string;
    readonly windowTitle: string;
    readonly windowDescription: string;
    readonly floorLabel: string;
    /** Placeholders: `{number}`. */
    readonly tableName: string;
    /** Placeholders: `{table}`. */
    readonly floorSelected: string;
    readonly floorNone: string;
    readonly guestLabel: string;
    readonly tableLabel: string;
    readonly tableAuto: string;
    readonly pick: string;
    /** Shown instead of the pick button when the panel is a full-screen sheet. */
    readonly sheetNote: string;
    readonly save: string;
    readonly cancel: string;
    /** Placeholders: `{guest}`, `{table}`. */
    readonly saved: string;
  };
  readonly popover: {
    readonly title: string;
    readonly description: string;
    /** The trigger button. */
    readonly open: string;
    readonly panelTitle: string;
    readonly panelDescription: string;
    readonly optionAll: string;
    readonly optionConfirmed: string;
    readonly optionWaiting: string;
    /** Placeholders: `{status}`. */
    readonly current: string;
  };
  readonly guard: {
    readonly title: string;
    readonly description: string;
    readonly noteLabel: string;
    readonly save: string;
    /** Placeholders: `{note}`. */
    readonly saved: string;
    /** A link to another page, to try leaving with unsaved changes. */
    readonly link: string;
    /** Runs `router.refresh()`, as a revalidation after a save would: the router rewrites the history state. */
    readonly refresh: string;
  };
}

export const kitMessageKey: MessageKey<KitMessages> = messageKey<KitMessages>("kit");
