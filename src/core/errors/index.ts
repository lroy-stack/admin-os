import { z } from "zod";

export const ErrorCodes = {
  forbidden: "access.forbidden",
  invalidInput: "schema.invalid_input",
  invalidOutput: "schema.invalid_output",
  timeout: "transport.timeout",
  unavailable: "transport.unavailable",
  unknownCapability: "client.unknown_capability",
  idempotencyRequired: "client.idempotency_required",
  /** The same idempotency key arrived with a different input (Stripe answers the same way). */
  idempotencyConflict: "client.idempotency_conflict",
} as const;

export type ErrorClass =
  | "forbidden"
  | "not_found"
  | "invalid"
  | "conflict"
  | "unavailable"
  | "timeout"
  | "invalid_output"
  | "unknown";

const CLASS_BY_SUFFIX: Readonly<Record<string, ErrorClass>> = {
  forbidden: "forbidden",
  not_found: "not_found",
  invalid: "invalid",
  required: "invalid",
  idempotency_required: "invalid",
  idempotency_conflict: "conflict",
  conflict: "conflict",
  /** A resource, seat or state already taken: the same request may succeed after a reload or another choice. */
  resource_busy: "conflict",
  invalid_transition: "conflict",
  closed: "conflict",
  /** A held write that was decided, or timed out, before this call; or one whose requester lost the right. */
  not_pending: "conflict",
  expired: "conflict",
  requester_forbidden: "forbidden",
  queue_full: "unavailable",
  too_early: "conflict",
  undo_expired: "conflict",
  not_enough_seats: "invalid",
  staff_note_full: "invalid",
  resource_inactive: "invalid",
  outside_window: "invalid",
  /** A setting another capability owns (the approval policy): this path never changes it. */
  not_writable: "forbidden",
  off_grid: "invalid",
  /** A start before the clock: another time works, the same one never will. */
  start_passed: "invalid",
  not_walk_in: "invalid",
  unavailable: "unavailable",
  timeout: "timeout",
  invalid_output: "invalid_output",
};

/** Screens map text by class, so a module's own codes (`bookings.table_conflict`) need no registry entry. */
export const errorClassOf = (code: string): ErrorClass => {
  const [namespace = "", ...rest] = code.split(".");
  const reason = rest.join(".");
  const bySuffix = Object.hasOwn(CLASS_BY_SUFFIX, reason) ? CLASS_BY_SUFFIX[reason] : undefined;
  if (bySuffix) return bySuffix;
  // Input rejections are `schema.invalid_input`: the suffix alone would not match.
  if (code === ErrorCodes.invalidInput) return "invalid";
  // Any other transport failure is the adapter being unreachable.
  if (namespace === "transport") return "unavailable";
  return "unknown";
};

/** Rule violations travel as data; the owning module composes the sentence (ADR 0005). */
export const violationSchema = z.object({
  ruleId: z.string(),
  severity: z.string(),
  params: z.record(z.string(), z.unknown()),
});

export const violationsDetailsSchema = z.object({ violations: z.array(violationSchema) });

export type Violation = z.infer<typeof violationSchema>;
