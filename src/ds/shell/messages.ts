import { type MessageKey, messageKey, type Plural } from "@/core/i18n/client";

/** Text of the shell chrome: top nav, rail, search, bell, account menu and the preferences panel. Route titles are the app's (`NavMessages`). */
export interface ShellMessages {
  readonly landmarks: {
    readonly sections: string;
    readonly quickAccess: string;
  };
  readonly header: {
    readonly inbox: string;
    /** Placeholders: `{count}`. */
    readonly unread: Plural;
  };
  readonly account: {
    /** Placeholders: `{name}`. */
    readonly label: string;
    readonly account: string;
    readonly billing: string;
    readonly notifications: string;
    readonly logOut: string;
    readonly demo: {
      /** Heading of the demo switches. */
      readonly title: string;
      readonly role: string;
      readonly preset: string;
      readonly reset: string;
      readonly resetDone: string;
      /** Shown in a toast when a switch could not be applied. */
      readonly failed: string;
    };
  };
  readonly search: {
    readonly open: string;
    readonly tooltip: string;
    readonly placeholder: string;
    readonly empty: string;
  };
  readonly preferences: {
    readonly trigger: string;
    readonly title: string;
    readonly description: string;
    readonly themePreset: string;
    readonly themePresetPlaceholder: string;
    readonly font: string;
    readonly fontPlaceholder: string;
    readonly language: string;
    readonly currency: string;
    readonly themeMode: string;
    readonly modes: { readonly light: string; readonly dark: string; readonly system: string };
    /** Placeholders: `{mode}`. */
    readonly themeCycle: string;
    readonly pageLayout: string;
    readonly layouts: { readonly centered: string; readonly fullWidth: string };
    readonly navbarBehavior: string;
    readonly navbarStyles: { readonly sticky: string; readonly scroll: string };
    readonly restoreDefaults: string;
    /** Shown in a toast when the language could not be saved. */
    readonly languageFailed: string;
    /** Shown in a toast when the currency could not be saved. */
    readonly currencyFailed: string;
  };
}

export const shellMessageKey: MessageKey<ShellMessages> = messageKey<ShellMessages>("shell");
