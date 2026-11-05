import "server-only";

import type { Locale } from "@/core/i18n";

import { VERTICALS, type VerticalId } from "./vertical";
import { textFor } from "./vocabulary.server";

/**
 * A page trail's first level (ADR 0020 §2): the preset's home, with the href and the words its nav gives it, so the
 * trail and the nav never disagree. Throws for a preset without a home entry.
 */
export function homeLevel(vertical: VerticalId, locale: Locale): { readonly label: string; readonly href: string } {
  const home = VERTICALS[vertical].nav.find((entry) => entry.id === "home");
  if (home === undefined) throw new Error(`The "${vertical}" preset has no home entry in its nav.`);
  return { label: textFor(vertical, locale, home.labelKey), href: home.href };
}
