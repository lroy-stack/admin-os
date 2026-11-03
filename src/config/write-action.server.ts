import "server-only";

import { refresh } from "next/cache";

import { idempotencyKeySchema, type SerializedCallResult, serializeCallResult } from "@/core/client";
import { ErrorCodes } from "@/core/errors";
import { err } from "@/core/result";

import type { CATALOG } from "./catalog";
import { getRuntime } from "./runtime";

type CapabilityId = keyof typeof CATALOG & string;

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
export async function runWrite(id: CapabilityId, input: unknown, attemptKey: unknown): Promise<SerializedCallResult> {
  const key = idempotencyKeySchema.safeParse(attemptKey);
  if (!key.success) {
    return serializeCallResult(
      err(ErrorCodes.invalidInput, `${id} rejected its attempt key`, { paths: ["idempotencyKey"] }),
    );
  }
  const { client } = await getRuntime();
  const serialized = serializeCallResult(await client.call(id, input as never, { idempotencyKey: key.data }));
  if (serialized.status === "ok") refresh();
  return serialized;
}
