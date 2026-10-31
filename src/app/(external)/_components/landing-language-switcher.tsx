"use client";

import { useOptimistic, useTransition } from "react";

import { Languages } from "lucide-react";
import { toast } from "sonner";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isLocale, LOCALE_NAMES, LOCALES, useLocale, useMessages } from "@/core/i18n/client";
import { setLocale } from "@/ds/preferences/actions";

import { landingMessageKey } from "./messages";

/**
 * The language picker of the landing, the same flow as the Language select of the preferences panel: `setLocale`
 * stores the cookie and Next re-renders the page in the new language, and the dashboard reads the same cookie.
 */
export function LandingLanguageSwitcher() {
  const text = useMessages(landingMessageKey);
  const locale = useLocale();
  const [pendingLocale, setPendingLocale] = useOptimistic(locale);
  const [, startTransition] = useTransition();

  const onLocaleChange = (value: string) => {
    if (!isLocale(value)) return;
    startTransition(async () => {
      setPendingLocale(value);
      try {
        await setLocale(value);
      } catch {
        // The optimistic value reverts when the transition ends; tell the visitor why.
        toast.error(text.language.failed);
      }
    });
  };

  return (
    <Select value={pendingLocale} onValueChange={onLocaleChange}>
      <SelectTrigger aria-label={text.language.label} lang={pendingLocale}>
        <Languages aria-hidden="true" className="text-muted-foreground" />
        {/* The name is rendered here too, so the server HTML shows it before the options mount. */}
        <SelectValue>{LOCALE_NAMES[pendingLocale]}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end" position="popper">
        <SelectGroup>
          {LOCALES.map((code) => (
            <SelectItem key={code} value={code} lang={code}>
              {LOCALE_NAMES[code]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
