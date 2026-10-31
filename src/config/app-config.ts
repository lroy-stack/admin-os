import type { Locale } from "@/core/i18n";
import type { Currency } from "@/core/money";

import packageJson from "../../package.json";

export const APP_CONFIG = {
  name: "admin-OS",
  // The public site URL is set per deployment; local development falls back to the dev server.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  repository: "https://github.com/lroy-stack/admin-os",
  // The link preview card (og:image, twitter:image), written to public/ by `npm run media`.
  socialImage: {
    url: "/social-card.png",
    width: 1200,
    height: 630,
    alt: "admin-OS reservations screen: the live floor plan beside the arrivals rail, in the Lime dark theme",
  },
  version: packageJson.version,
  // Each default applies only when neither the preference cookie nor Accept-Language settles it (ADR 0007).
  i18n: { defaultLocale: "en" as Locale, defaultCurrency: "USD" as Currency },
};
