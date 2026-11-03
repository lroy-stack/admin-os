import type { ActionOutcome, FieldIssue } from "./outcome";

/** A path as react-hook-form names a field: `["guests", 0, "name"]` becomes `"guests.0.name"`. */
export const fieldName = (path: readonly (string | number)[]): string => path.join(".");

/** Keys of a react-hook-form error node that describe the error itself, not a nested field. */
const ERROR_META = new Set(["message", "type", "types", "ref", "root"]);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/**
 * The messages inside react-hook-form's `errors` tree as issues by path, in tree order. A node with a string `message`
 * is an error; a `root` key (an error on an array itself) belongs to the array's own path.
 */
export function flattenFieldErrors(errors: unknown, base: readonly (string | number)[] = []): FieldIssue[] {
  if (!isRecord(errors)) return [];
  const own: FieldIssue[] = [];
  if (typeof errors.message === "string" && errors.message !== "") own.push({ path: base, message: errors.message });
  const fromRoot = flattenFieldErrors(errors.root, base);
  if (own.length > 0 || fromRoot.length > 0) return [...own, ...fromRoot];

  return Object.entries(errors).flatMap(([key, child]) =>
    ERROR_META.has(key) ? [] : flattenFieldErrors(child, [...base, Array.isArray(errors) ? Number(key) : key]),
  );
}

/** Registered field names in registration (render) order, from react-hook-form's field tree (`control._fields`). */
export function registeredFieldNames(fields: unknown, base: readonly string[] = []): string[] {
  if (!isRecord(fields)) return [];
  return Object.entries(fields).flatMap(([key, child]) => {
    const path = [...base, key];
    if (!isRecord(child)) return [];
    if ("_f" in child) return [path.join(".")];
    return registeredFieldNames(child, path);
  });
}

export interface RoutedIssues {
  /** Issues whose path is a registered field: shown under that field. */
  readonly fields: readonly { readonly name: string; readonly message: string }[];
  /** What the issues without a field say, once each, or `null` when every issue landed on a field. */
  readonly formError: string | null;
  /** The field to focus: the first of `fields` in render order, or `null`. */
  readonly focus: string | null;
}

/**
 * Sends each issue to its field when the form has one at that path and to the form-level error when it does not, so no
 * issue is lost. `order` is the registered field names in render order; it decides which field takes focus.
 */
export function routeIssues(
  issues: readonly FieldIssue[],
  isField: (name: string) => boolean,
  order: readonly string[] = [],
): RoutedIssues {
  const fields: { name: string; message: string }[] = [];
  const orphans: string[] = [];
  for (const { path, message } of issues) {
    const name = fieldName(path);
    if (name !== "" && isField(name)) {
      // The first message of a field wins; a second one would only replace what the person is about to read.
      if (!fields.some((field) => field.name === name)) fields.push({ name, message });
    } else if (!orphans.includes(message)) {
      orphans.push(message);
    }
  }
  const rank = (name: string) => {
    const index = order.indexOf(name);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  const first = fields.reduce<string | null>(
    (best, { name }) => (best === null || rank(name) < rank(best) ? name : best),
    null,
  );
  return { fields, formError: orphans.length > 0 ? orphans.join(" ") : null, focus: first };
}

/** What a window form does with the answer to a submit. */
export type OutcomePlan<O> =
  | { readonly kind: "done"; readonly value: O }
  | ({ readonly kind: "issues" } & RoutedIssues)
  | { readonly kind: "error"; readonly text: string }
  | { readonly kind: "awaiting" }
  /** The submit was refused because another is in flight: nothing changes. */
  | { readonly kind: "none" };

export function planOutcome<O>(
  outcome: ActionOutcome<O> | null,
  isField: (name: string) => boolean,
  order: readonly string[] = [],
): OutcomePlan<O> {
  if (outcome === null) return { kind: "none" };
  switch (outcome.status) {
    case "ok":
      return { kind: "done", value: outcome.value };
    case "invalid":
      return { kind: "issues", ...routeIssues(outcome.issues, isField, order) };
    case "error":
      return { kind: "error", text: outcome.text };
    case "awaiting_approval":
      return { kind: "awaiting" };
    default: {
      const unreachable: never = outcome;
      return unreachable;
    }
  }
}

/** What a form shows between submits. */
export interface WindowFormStatus {
  readonly formError: string | null;
  /** Held for approval: the form stays open with the submitted values, read-only. */
  readonly awaiting: boolean;
}

export const IDLE_STATUS: WindowFormStatus = { formError: null, awaiting: false };

/** The status after a plan; `none` and `done` leave it as it was. */
export function statusAfter<O>(previous: WindowFormStatus, plan: OutcomePlan<O>): WindowFormStatus {
  switch (plan.kind) {
    case "issues":
      return { formError: plan.formError, awaiting: false };
    case "error":
      return { formError: plan.text, awaiting: false };
    case "awaiting":
      return { formError: null, awaiting: true };
    case "done":
    case "none":
      return previous;
    default: {
      const unreachable: never = plan;
      return unreachable;
    }
  }
}

/** Ids that tie a field's control to its description and error (`aria-describedby`). */
export function fieldDomIds(id: string): { description: string; error: string } {
  return { description: `${id}-description`, error: `${id}-error` };
}

export function describedBy(
  ids: { description: string; error: string },
  state: { hasDescription: boolean; invalid: boolean },
): string | undefined {
  const parts = [state.hasDescription ? ids.description : null, state.invalid ? ids.error : null].filter(
    (part) => part !== null,
  );
  return parts.length > 0 ? parts.join(" ") : undefined;
}
