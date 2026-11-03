import { z } from "zod";

export const ErrorCodes = {
  forbidden: "access.forbidden",
  invalidInput: "schema.invalid_input",
  invalidOutput: "schema.invalid_output",
  timeout: "transport.timeout",
  unavailable: "transport.unavailable",
  unknownCapability: "client.unknown_capability",
  idempotencyRequired: "client.idempotency_required",
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
  conflict: "conflict",
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
