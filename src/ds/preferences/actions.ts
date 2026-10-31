"use server";

import { isLocale, LOCALE_COOKIE } from "@/core/i18n";
import { CURRENCY_COOKIE, isCurrency } from "@/core/money";

import { PREFERENCE_REGISTRY, type PreferenceKey } from "./preferences-config";
import { writeCookie } from "./server";

const YEAR_S = 60 * 60 * 24 * 365;

/**
 * Stores one preference from the registry. Public endpoint: the key must be a registry key and the value one of that
 * preference's allowed values, so no caller can use it to set, overwrite or probe any other cookie (sessions, demo
 * switches, locale, currency).
 */
export async function setPreference(key: unknown, value: unknown): Promise<void> {
  if (typeof key !== "string" || !Object.hasOwn(PREFERENCE_REGISTRY, key)) {
    throw new Error("Unknown preference");
  }
  const preference = key as PreferenceKey;
  const allowed = PREFERENCE_REGISTRY[preference].values as readonly string[];
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new Error(`Unsupported value for ${preference}`);
  }
  await writeCookie(preference, value, { maxAge: YEAR_S, sameSite: "lax" });
}

/**
 * Stores the language in its cookie. Setting a cookie in a Server Action makes Next re-render the current page and
 * its layouts on the server, so no explicit `refresh()` is needed and client state survives (ADR 0007).
 * Public endpoint: the input is untrusted, so anything but one of the kit's locales is rejected.
 */
export async function setLocale(locale: unknown): Promise<void> {
  if (!isLocale(locale)) {
    throw new Error("Unsupported locale");
  }
  await writeCookie(LOCALE_COOKIE, locale, { maxAge: YEAR_S, sameSite: "lax" });
}

/**
 * Stores the business currency in its cookie, with the same attributes as the language. The currency is a business
 * setting independent of the language. Public endpoint: anything but one of `CURRENCIES` is rejected.
 */
export async function setCurrency(currency: unknown): Promise<void> {
  if (!isCurrency(currency)) {
    throw new Error("Unsupported currency");
  }
  await writeCookie(CURRENCY_COOKIE, currency, { maxAge: YEAR_S, sameSite: "lax" });
}
