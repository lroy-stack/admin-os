import type { ReactNode } from "react";

import { getCurrency, getLocale } from "@/config/locale.server";
import { LocaleProvider, type MessageBundle, resolveMessages } from "@/core/i18n/client";

interface LocaleBundlesProps {
  /** Dictionaries the subtree's client components read with `useMessages`, resolved here for ONE locale. */
  readonly bundles?: readonly MessageBundle<unknown>[];
  readonly children: ReactNode;
}

/**
 * Resolves the request's locale and currency and hands the bundles to the client components below (ADR 0007).
 * Inside another provider (a page under the dashboard layout) it only adds its bundles to the layout's, and it adds
 * no element, so the page keeps its place in the layout's grid.
 */
export async function LocaleBundles({ bundles = [], children }: LocaleBundlesProps) {
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  return (
    <LocaleProvider locale={locale} currency={currency} messages={resolveMessages(locale, ...bundles)}>
      {children}
    </LocaleProvider>
  );
}

/**
 * The locale root of a route group: a provider plus a wrapper carrying `lang`, so the language is right from the
 * first byte even when `Accept-Language` decided it. Put it in the group's `layout.tsx`; the group appends its
 * bundles there. The dashboard layout uses it with the shell bundles.
 */
export async function LocaleRoot({
  bundles,
  className,
  children,
}: LocaleBundlesProps & { readonly className?: string }) {
  const locale = await getLocale();
  return (
    <LocaleBundles bundles={bundles}>
      <div lang={locale} className={className}>
        {children}
      </div>
    </LocaleBundles>
  );
}
