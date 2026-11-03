import type { SerializedCallResult } from "@/core/client";
import { ErrorCodes } from "@/core/errors";
import { type ErrorMessages, errorText, type Locale } from "@/core/i18n";

export interface FieldIssue {
  readonly path: readonly (string | number)[];
  readonly message: string;
}

/** What a window shows after a write; the approval id never reaches it. */
export type ActionOutcome =
  | { readonly status: "ok" }
  | { readonly status: "invalid"; readonly issues: readonly FieldIssue[] }
  | { readonly status: "error"; readonly text: string; readonly code: string }
  | { readonly status: "awaiting_approval" };

export type ErrorDictionary = Readonly<Record<Locale, ErrorMessages>>;

export const NO_ERROR_MESSAGES: ErrorDictionary = { en: {}, es: {}, de: {}, fr: {} };

/** `"guests.0.name"` becomes `["guests", 0, "name"]`, the shape form libraries use for a field path. */
const toPath = (dotted: string): (string | number)[] =>
  dotted === "" ? [] : dotted.split(".").map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));

/** True when the attempt may have reached the server without an answer, so a retry must reuse its key. */
export const isTransportFailure = (result: SerializedCallResult): boolean =>
  result.status === "error" && result.code.startsWith("transport.");

export function toOutcome(
  result: SerializedCallResult,
  locale: Locale,
  dictionary: ErrorDictionary = NO_ERROR_MESSAGES,
): ActionOutcome {
  switch (result.status) {
    case "ok":
      return { status: "ok" };
    case "awaiting_approval":
      return { status: "awaiting_approval" };
    case "error": {
      const paths = result.paths ?? [];
      if (paths.length > 0) {
        const message = errorText({ code: ErrorCodes.invalidInput }, dictionary, locale);
        return { status: "invalid", issues: paths.map((path) => ({ path: toPath(path), message })) };
      }
      return { status: "error", text: errorText(result, dictionary, locale), code: result.code };
    }
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
}

/** The outcome of an action that threw or never answered: the connection failed, not the capability. */
export const transportFailure: SerializedCallResult = { status: "error", code: ErrorCodes.unavailable };
