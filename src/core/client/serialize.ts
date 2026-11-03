import { z } from "zod";

import { ErrorCodes } from "@/core/errors";
import { type CallResult, isAwaitingApproval } from "@/core/result";

/**
 * A `CallResult` reduced to what may cross the Server Action boundary to a window. The server `message` is for logs
 * and the approval id is for the approvals queue, so neither travels. A successful `value` does: the client already
 * validated it against the capability's output schema and the actor may read it, and windows need it (the id of the
 * booking just created).
 */
export type SerializedCallResult<O = unknown> =
  | { readonly status: "ok"; readonly value: O }
  | { readonly status: "error"; readonly code: string; readonly paths?: readonly string[] }
  | { readonly status: "awaiting_approval" };

const pathsDetailsSchema = z.object({ paths: z.array(z.string()) });

export function serializeCallResult<O>(result: CallResult<O>): SerializedCallResult<O> {
  if (isAwaitingApproval(result)) return { status: "awaiting_approval" };
  if (result.ok) return { status: "ok", value: result.value };
  // Only the field paths of a rejected input are kept (an invalid output's paths point into the output, not at a
  // field the window has); any other detail may carry values the actor is not meant to read.
  if (result.error.code !== ErrorCodes.invalidInput) return { status: "error", code: result.error.code };
  const details = pathsDetailsSchema.safeParse(result.error.details);
  return details.success
    ? { status: "error", code: result.error.code, paths: details.data.paths }
    : { status: "error", code: result.error.code };
}
