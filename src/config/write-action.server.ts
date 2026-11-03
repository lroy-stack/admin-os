import "server-only";

import { refresh } from "next/cache";

import { idempotencyKeySchema, type SerializedCallResult, serializeCallResult } from "@/core/client";
import { ErrorCodes } from "@/core/errors";
import { err } from "@/core/result";

import { CATALOG, type SOURCE_CATALOGS } from "./catalog";
import { ensureDemoSession } from "./demo-session.server";
import { getRuntime } from "./runtime";

/** The ids of the capabilities whose effect is not `read`, from the literal source catalogues (not the wide merge). */
type WriteIdsOf<C> = C extends unknown
  ? { [K in keyof C & string]: C[K] extends { readonly effect: "read" } ? never : K }[keyof C & string]
  : never;

export type WriteCapabilityId = WriteIdsOf<(typeof SOURCE_CATALOGS)[number]>;

/**
 * The one way a route writes through the data seam (ADR 0005, ADR 0015). A route's `actions.ts` is a `"use server"`
 * module, so every export is a public endpoint taking untrusted arguments; each action is a one-liner and the
 * capability's own schema validates the input:
 *
 * ```ts
 * "use server";
 *
 * import { runWrite } from "@/config/write-action.server";
 *
 * export async function seatWalkIn(input: unknown, attemptKey: unknown) {
 *   return runWrite("bookings.walk_in.seat", input, attemptKey);
 * }
 * ```
 *
 * The window calls it through `useCapabilityAction` (`@/ds/forms`), which creates the attempt key. Add the action to
 * the inventory in `server-actions.test.ts` in the same change.
 *
 * The attempt key is validated here, the call carries it as the idempotency key (a replay of the same attempt does
 * not write twice), `refresh()` re-reads the Server Components after a write that went through, and the result is
 * serialized so neither the server message nor an approval id reaches the browser.
 */
export async function runWrite(
  id: WriteCapabilityId,
  input: unknown,
  attemptKey: unknown,
): Promise<SerializedCallResult> {
  // A Server Action argument is untrusted whatever its type says: a read is not a write and must not `refresh()`.
  if (CATALOG[id]?.effect === "read") {
    return serializeCallResult(err(ErrorCodes.invalidInput, `${id} is a read, not a write`));
  }
  const key = idempotencyKeySchema.safeParse(attemptKey);
  if (!key.success) {
    // No paths: the attempt key is not a field of the window's form, so it must not surface as a field issue.
    return serializeCallResult(err(ErrorCodes.invalidInput, `${id} rejected its attempt key`));
  }
  // The first write of a visitor starts the demo session (ADR 0005). In the action phase `cookies()` is the mutable
  // jar and a `set` lands on the same store a later `get` reads (next/dist/server/web/spec-extension/adapters/
  // request-cookies.js, `MutableRequestCookiesAdapter.wrap`), so `getRuntime` must only run after this line: it is
  // cached per request and would otherwise freeze a session-less adapter.
  await ensureDemoSession();
  const { client } = await getRuntime();
  const serialized = serializeCallResult(await client.call(id, input as never, { idempotencyKey: key.data }));
  if (serialized.status === "ok") refresh();
  return serialized;
}
