"use client";

import { createContext, type ReactNode, use, useEffect } from "react";

import type { Locale } from "./locale";
import type { MessageKey, ResolvedMessages } from "./namespace";

interface LocaleValue {
  readonly locale: Locale;
  readonly messages: ResolvedMessages;
}

const LocaleContext = createContext<LocaleValue | null>(null);

function useLocaleValue(): LocaleValue {
  const value = use(LocaleContext);
  if (!value) {
    throw new Error("Missing LocaleProvider");
  }
  return value;
}

/**
 * Receives the messages the server resolved for ONE locale (ADR 0007). It also keeps `<html lang>` in step, because
 * the static root layout cannot know the locale and the boot script only sees the cookie.
 */
export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: ResolvedMessages;
  children: ReactNode;
}) {
  // Leaving the provider (for example to /auth/*) restores the page's own language.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.lang;
    root.lang = locale;
    return () => {
      root.lang = previous;
    };
  }, [locale]);

  return <LocaleContext.Provider value={{ locale, messages }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useLocaleValue().locale;
}

export function useMessages<T>(key: MessageKey<T>): T {
  const { messages } = useLocaleValue();
  const resolved = messages[key.namespace];
  if (resolved === undefined) {
    throw new Error(`No messages for "${key.namespace}"; pass its bundle to resolveMessages in the layout.`);
  }
  // The key was typed with T when the bundle was defined, and the server resolved that same bundle.
  return resolved as T;
}
