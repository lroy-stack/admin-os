import { ErrorCodes, errorClassOf } from "@/core/errors";

import type { CallResult } from "./index";

/** What a screen shows for a read. `empty` exists only for a read that succeeded: a failure is never an empty list. */
export type ReadStatus =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly code: string }
  | { readonly status: "forbidden"; readonly code: string }
  | { readonly status: "empty" }
  | { readonly status: "ready" };

/**
 * Maps a read's result to the state to render. `undefined` means the read is still in flight. A read is never held
 * for approval, so that answer counts as an unexpected response and shows as an error.
 */
export function readStateOf<T>(result: CallResult<T> | undefined, isEmpty: (value: T) => boolean): ReadStatus {
  if (result === undefined) return { status: "loading" };
  // Only a held write lacks `ok`; `index.ts` re-exports this file, so it cannot import `isAwaitingApproval` back.
  if (!("ok" in result)) return { status: "error", code: ErrorCodes.invalidOutput };
  if (result.ok) return isEmpty(result.value) ? { status: "empty" } : { status: "ready" };
  const { code } = result.error;
  return errorClassOf(code) === "forbidden" ? { status: "forbidden", code } : { status: "error", code };
}
