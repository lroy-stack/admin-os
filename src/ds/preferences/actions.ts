"use server";

import { cookies } from "next/headers";

import { isLocale, LOCALE_COOKIE } from "@/core/i18n";

import {
  getPreferencePersistence,
  PREFERENCE_REGISTRY,
  type PreferenceKey,
  type PreferenceValueMap,
  parsePreference,
} from "./preferences-config";

export async function getValueFromCookie(key: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(key)?.value;
}

export async function setValueToCookie(
  key: string,
  value: string,
  options: { path?: string; maxAge?: number; sameSite?: "lax" | "strict" | "none" } = {},
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(key, value, {
    path: options.path ?? "/",
    maxAge: options.maxAge ?? 60 * 60 * 24 * 7, // default: 7 days
    ...(options.sameSite ? { sameSite: options.sameSite } : {}),
  });
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
  await setValueToCookie(LOCALE_COOKIE, locale, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

export async function getPreference<K extends PreferenceKey>(key: K): Promise<PreferenceValueMap[K]> {
  const definition = PREFERENCE_REGISTRY[key];
  const persistence = getPreferencePersistence(key);

  if (persistence !== "client-cookie" && persistence !== "server-cookie") {
    return definition.defaultValue as PreferenceValueMap[K];
  }

  const cookieStore = await cookies();
  return parsePreference(key, cookieStore.get(key)?.value.trim());
}
