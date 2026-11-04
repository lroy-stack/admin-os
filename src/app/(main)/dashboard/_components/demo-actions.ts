"use server";

import { refresh } from "next/cache";

import { isDemoAdapter } from "@/config/data.server";
import { demoCookieScopeForRequest, resetDemoSession } from "@/config/demo-session.server";
import { DEMO_ROLE_COOKIE } from "@/config/runtime";
import { verticalIdSchema } from "@/config/vertical";
import { DEMO_PRESET_COOKIE, getVertical } from "@/config/vertical.server";
import { roleIdSchema } from "@/core/access";
import { writeCookie } from "@/ds/preferences/server";

// The demo switches (ADR 0006). Every action is a public endpoint: the input is untrusted and the switches work
// only on the demo build. Setting a cookie in a Server Action re-renders the page and its layouts on its own.

const COOKIE_OPTIONS = { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" } as const;

function assertDemo(): void {
  if (!isDemoAdapter()) {
    throw new Error("The demo switches are available only with the mock adapter.");
  }
}

export async function setDemoRole(role: unknown): Promise<void> {
  assertDemo();
  await writeCookie(DEMO_ROLE_COOKIE, roleIdSchema.parse(role), {
    ...COOKIE_OPTIONS,
    ...(await demoCookieScopeForRequest()),
  });
}

export async function setDemoPreset(preset: unknown): Promise<void> {
  assertDemo();
  await writeCookie(DEMO_PRESET_COOKIE, verticalIdSchema.parse(preset), COOKIE_OPTIONS);
}

export async function resetDemoData(): Promise<void> {
  assertDemo();
  await resetDemoSession((await getVertical()).id);
  // No cookie changes here, so ask Next to re-render with the seed again.
  refresh();
}
