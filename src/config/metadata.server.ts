import "server-only";

import type { Metadata } from "next";

import { type Locale, OG_LOCALES, type PageMeta } from "@/core/i18n";

import { APP_CONFIG } from "./app-config";
import { getLocale } from "./locale.server";

/** Any route dictionary that owns a page: `meta` holds the page's title and description in each locale. */
type MetaDictionary = Readonly<Record<Locale, { readonly meta: PageMeta }>>;

/**
 * Metadata for one page in the request's locale, from its route dictionary:
 *
 *   export const generateMetadata = () => pageMetadata("/dashboard/default", overviewMessages);
 *
 * It sets title, description, canonical URL, the Open Graph pair (`og:locale` per language) and the social card as
 * `og:image`, since a page's `openGraph` replaces the root layout's. The root layout stays
 * static (ADR 0007), so pages cannot inherit these from it. `extra` is merged last, for example `robots`; its
 * `openGraph` and `alternates` are merged field by field into the defaults, so adding an `og:image` or a language
 * alternate does not drop `og:locale`, the title, the URL or the canonical.
 */
export async function pageMetadata(path: string, dictionary: MetaDictionary, extra: Metadata = {}): Promise<Metadata> {
  const locale = await getLocale();
  const { title, description } = dictionary[locale].meta;
  const { openGraph, alternates, ...rest } = extra;
  return {
    title,
    description,
    ...rest,
    alternates: { canonical: path, ...alternates },
    openGraph: {
      type: "website",
      siteName: APP_CONFIG.name,
      locale: OG_LOCALES[locale],
      url: path,
      title,
      description,
      images: [APP_CONFIG.socialImage],
      ...openGraph,
    } as Metadata["openGraph"],
  };
}
