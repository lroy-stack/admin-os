import type { Locale } from "./locale";

/**
 * Names one dictionary and carries its type, so a client component can read it without importing the dictionary
 * (and with it the other three locales). The type parameter exists only for inference.
 */
export interface MessageKey<T> {
  readonly namespace: string;
  readonly phantom?: T;
}

export function messageKey<T>(namespace: string): MessageKey<T> {
  return { namespace };
}

/** A dictionary for all four locales, paired with its key. Lives in a server entry (ADR 0003). */
export interface MessageBundle<T> {
  readonly key: MessageKey<T>;
  readonly dictionary: Readonly<Record<Locale, T>>;
}

export type ResolvedMessages = Readonly<Record<string, unknown>>;

/** Picks one locale from each bundle; the result is plain data, ready for `<LocaleProvider>`. */
export function resolveMessages(locale: Locale, ...bundles: readonly MessageBundle<unknown>[]): ResolvedMessages {
  return Object.fromEntries(bundles.map(({ key, dictionary }) => [key.namespace, dictionary[locale]]));
}
