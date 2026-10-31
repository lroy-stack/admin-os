import "server-only";

import { cookies } from "next/headers";

import { isDemoAdapter } from "./data.server";
import { resolveVertical } from "./vertical";

/** Demo switch (ADR 0004): which preset this visitor sees. It beats `VERTICAL` in the demo build only. */
export const DEMO_PRESET_COOKIE = "demo_preset";

/** The preset of this request: demo cookie, then `VERTICAL` (read on every call, never frozen), then the default. */
export async function getVertical() {
  const preferred = isDemoAdapter() ? (await cookies()).get(DEMO_PRESET_COOKIE)?.value : undefined;
  return resolveVertical(process.env.VERTICAL, preferred);
}
