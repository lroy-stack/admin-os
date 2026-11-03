/** The result contract every capability returns (ADR 0005): a value, a domain error, or awaiting approval. */
export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export type Result<T, E = DomainError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/** A write held for approval is a pending state, not a failure. */
export interface AwaitingApproval {
  readonly status: "awaiting_approval";
  readonly approvalId: string;
}

export type CallResult<T> = Result<T> | AwaitingApproval;

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = (code: string, message: string, details?: Readonly<Record<string, unknown>>): Result<never> => ({
  ok: false,
  error: details === undefined ? { code, message } : { code, message, details },
});

export const isAwaitingApproval = <T>(result: CallResult<T>): result is AwaitingApproval =>
  "status" in result && result.status === "awaiting_approval";

export { type ReadStatus, readStateOf } from "./read-state";
