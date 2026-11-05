"use server";

import { bellRequestSchema, bellRuntimeOf, bellWriteOf, loadBell } from "@/config/bell.server";
import { getRuntime } from "@/config/runtime";
import { runWrite } from "@/config/write-action.server";
import { type SerializedCallResult, serializeCallResult } from "@/core/client";
import { ErrorCodes } from "@/core/errors";
import { err } from "@/core/result";

/**
 * The bell's one Server Action (ADR 0017 "The bell"): the panel's reads and writes go through it. It loads the rows of
 * every feed the actor may see, or runs the named feed's capability by the id its descriptor gives; the capability's
 * own schema validates the payload.
 */
export async function bellAction(input: unknown, attemptKey: unknown): Promise<SerializedCallResult> {
  const request = bellRequestSchema.safeParse(input);
  if (!request.success) return serializeCallResult(err(ErrorCodes.invalidInput, "The bell rejected its request"));
  if (request.data.op === "load") {
    return serializeCallResult(await loadBell(bellRuntimeOf(await getRuntime())));
  }
  const capability = bellWriteOf(request.data);
  if (capability === undefined) {
    return serializeCallResult(err(ErrorCodes.invalidInput, "The bell has no such feed"));
  }
  return runWrite(capability, request.data.input, attemptKey);
}
