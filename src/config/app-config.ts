import type { Locale } from "@/core/i18n";

import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "admin-OS",
  // The public site URL is set per deployment; local development falls back to the dev server.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  repository: "https://github.com/lroy-stack/admin-os",
  version: packageJson.version,
  // Applies only when neither the locale cookie nor Accept-Language matches one of the kit's locales (ADR 0007).
  i18n: { defaultLocale: "en" as Locale },
  copyright: `© ${currentYear}, admin-OS.`,
  meta: {
    title: "admin-OS: open-source management dashboard for small businesses",
    description:
      "MIT-licensed management dashboard for restaurants, salons and workshops: bookings with a live floor plan, customers, team, catalog and messaging. Built with Next.js, shadcn/ui and liquid glass.",
  },
};
