import { z } from "zod";

import { type CallResult, isAwaitingApproval } from "@/core/result";

/**
 * A `CallResult` reduced to what may cross the Server Action boundary to a window. The server `message` is for logs
 * and the approval id is for the approvals queue, so neither travels; a successful value is re-read by the page
 * after `refresh()`, so it does not travel either.
 */
export type SerializedCallResult =
  | { readonly status: "ok" }
  | { readonly status: "error"; readonly code: string; readonly paths?: readonly string[] }
  | { readonly status: "awaiting_approval" };

const pathsDetailsSchema = z.object({ paths: z.array(z.string()) });

export function serializeCallResult(result: CallResult<unknown>): SerializedCallResult {
  if (isAwaitingApproval(result)) return { status: "awaiting_approval" };
  if (result.ok) return { status: "ok" };
  // Only field paths are kept: any other detail may carry values the actor is not meant to read.
  const details = pathsDetailsSchema.safeParse(result.error.details);
  return details.success
    ? { status: "error", code: result.error.code, paths: details.data.paths }
    : { status: "error", code: result.error.code };
}
