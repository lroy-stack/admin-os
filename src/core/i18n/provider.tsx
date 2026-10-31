"use client";

import { createContext, type ReactNode, use, useEffect, useMemo } from "react";

import type { Currency } from "@/core/money/client";

import { type ChartFormatters, chartFormatters } from "./chart-format";
import type { Locale } from "./locale";
import type { MessageKey, ResolvedMessages } from "./namespace";

interface LocaleValue {
  readonly locale: Locale;
  readonly currency: Currency;
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
 * Receives the messages the server resolved for ONE locale (ADR 0007). The outermost provider also keeps `<html lang>`
 * in step, because the static root layout cannot know the locale and the boot script only sees the cookie.
 */
export function LocaleProvider({
  locale,
  currency,
  messages,
  children,
}: {
  locale: Locale;
  /** The business currency (a setting, independent of the language). */
  currency: Currency;
  messages: ResolvedMessages;
  children: ReactNode;
}) {
  // A provider inside another one (a route's bundles under the layout's) adds to the outer messages, so the
  // layout's shell and shared dictionaries stay reachable.
  const outer = use(LocaleContext);
  const outerMessages = outer?.messages;
  const isOutermost = outer === null;

  // Only the outermost provider owns `<html lang>`: effects run child first, so a nested provider that restored "its"
  // previous value would leave the page in the wrong language when it unmounts alone (navigating between pages).
  // Leaving the outermost provider (for example to /auth/*) restores the page's own language.
  useEffect(() => {
    if (!isOutermost) {
      return;
    }
    const root = document.documentElement;
    const previous = root.lang;
    root.lang = locale;
    return () => {
      root.lang = previous;
    };
  }, [isOutermost, locale]);

  const value = useMemo<LocaleValue>(
    () => ({ locale, currency, messages: outerMessages ? { ...outerMessages, ...messages } : messages }),
    [locale, currency, messages, outerMessages],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useLocaleValue().locale;
}

/** The business currency: what plain amounts in demo data and charts are written in. A `Money` uses its own. */
export function useCurrency(): Currency {
  return useLocaleValue().currency;
}

/** Tick and tooltip formatters for the active locale and business currency, for recharts props. */
export function useChartFormatters(): ChartFormatters {
  const { locale, currency } = useLocaleValue();
  return useMemo(() => chartFormatters(locale, currency), [locale, currency]);
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
