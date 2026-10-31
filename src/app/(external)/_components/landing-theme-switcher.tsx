"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { usePreferencesStore } from "@/ds/preferences";

import { landingMessageKey } from "./messages";

const THEME_CYCLE = ["light", "dark", "system"] as const;

export function LandingThemeSwitcher() {
  const text = useMessages(landingMessageKey);
  const locale = useLocale();
  const { themeMode, setPreference } = usePreferencesStore(
    useShallow((state) => ({
      themeMode: state.values.theme_mode,
      setPreference: state.setPreference,
    })),
  );

  const cycleTheme = () => {
    const currentIndex = THEME_CYCLE.indexOf(themeMode);
    const nextTheme = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
    const updateTheme = () => setPreference("theme_mode", nextTheme);

    if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      updateTheme();
      return;
    }

    document.startViewTransition(updateTheme);
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={cycleTheme}
      aria-label={format(text.theme.cycle, locale, { mode: text.theme.modes[themeMode] })}
    >
      <Monitor className="hidden [html[data-theme-mode=system]_&]:block" />
      <Sun className="hidden dark:block [html[data-theme-mode=system]_&]:hidden" />
      <Moon className="block dark:hidden [html[data-theme-mode=system]_&]:hidden" />
    </Button>
  );
}
