import { type MessageKey, messageKey, type PageMeta } from "@/core/i18n/client";

/** The four auth pages, as keys of `AuthMessages["meta"]`. */
export type AuthPage = "loginV1" | "loginV2" | "registerV1" | "registerV2";

/** Text of /auth: both layouts, both pages in each, the forms and their validation. */
export interface AuthMessages {
  readonly meta: Readonly<Record<AuthPage, PageMeta>>;
  readonly fields: {
    readonly email: string;
    readonly emailPlaceholder: string;
    readonly password: string;
    readonly passwordPlaceholder: string;
    readonly confirmPassword: string;
    readonly remember: string;
  };
  readonly actions: {
    readonly login: string;
    readonly register: string;
    readonly google: string;
    readonly orContinueWith: string;
  };
  /** Placeholders: `{min}`, the minimum password length. */
  readonly validation: {
    readonly emailInvalid: string;
    readonly passwordTooShort: string;
    readonly confirmTooShort: string;
    readonly passwordsMismatch: string;
  };
  /** The toast shown after the demo form is submitted. */
  readonly submitted: string;
  readonly loginV1: {
    readonly panelTitle: string;
    readonly panelSubtitle: string;
    readonly title: string;
    readonly description: string;
    readonly noAccount: string;
  };
  readonly registerV1: {
    readonly panelTitle: string;
    readonly panelSubtitle: string;
    readonly title: string;
    readonly description: string;
    readonly haveAccount: string;
  };
  readonly loginV2: {
    readonly title: string;
    readonly subtitle: string;
    readonly noAccount: string;
  };
  readonly registerV2: {
    readonly title: string;
    readonly subtitle: string;
    readonly haveAccount: string;
  };
  /** The branded panel of the v2 layout. */
  readonly brand: {
    readonly tagline: string;
    readonly launchTitle: string;
    readonly launchText: string;
    readonly helpTitle: string;
    readonly helpText: string;
  };
}

export const authMessageKey: MessageKey<AuthMessages> = messageKey<AuthMessages>("auth");
