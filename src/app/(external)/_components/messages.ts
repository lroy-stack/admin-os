import { type MessageKey, messageKey } from "@/core/i18n/client";

interface Feature {
  readonly title: string;
  readonly description: string;
}

/** Text of the landing page (/). Its metadata is the app's default (`appMessages.meta`). */
export interface LandingMessages {
  /** Accessible name of the logo link. */
  readonly home: string;
  readonly theme: {
    /** Placeholders: `{mode}`, one of `modes`. */
    readonly cycle: string;
    readonly modes: { readonly light: string; readonly dark: string; readonly system: string };
  };
  readonly language: {
    /** Accessible name of the language picker; the options are each language's own name (`LOCALE_NAMES`). */
    readonly label: string;
    readonly failed: string;
  };
  readonly hero: {
    readonly title: string;
    readonly lead: string;
    readonly status: string;
    /** Opens the app's own demo (`/dashboard`), served on the mock adapter. */
    readonly demo: string;
    readonly github: string;
  };
  readonly showcase: { readonly label: string; readonly alt: string };
  readonly features: {
    readonly eyebrow: string;
    readonly title: string;
    readonly items: {
      readonly bookings: Feature;
      readonly glass: Feature;
      readonly presets: Feature;
      readonly languages: Feature;
      readonly roles: Feature;
      readonly data: Feature;
      readonly mcp: Feature;
    };
  };
  readonly run: {
    readonly title: string;
    readonly body: string;
    /** Placeholders: `{stack}`, a list of framework names. */
    readonly stack: string;
  };
  readonly links: {
    readonly title: string;
    readonly source: string;
    readonly start: string;
    readonly mcp: string;
    readonly architecture: string;
    readonly license: string;
  };
  readonly footer: {
    /** Placeholders: `{author}`, rendered as a link to the author's GitHub profile. */
    readonly madeBy: string;
    readonly github: string;
  };
}

export const landingMessageKey: MessageKey<LandingMessages> = messageKey("landing");
