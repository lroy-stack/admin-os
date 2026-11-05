import { format, type Locale } from "@/core/i18n/client";

import type { InventoryViewsMessages } from "./messages";

/** An amount on hand in the locale's words: the unit's label for a code the dictionary knows, else the code as stored. */
export function onHandText(
  text: Pick<InventoryViewsMessages["stock"], "onHand" | "units">,
  locale: Locale,
  count: number,
  unit: string,
): string {
  const known = Object.hasOwn(text.units, unit) ? text.units[unit] : undefined;
  return known === undefined ? format(text.onHand, locale, { count, unit }) : format(known, locale, { count });
}
