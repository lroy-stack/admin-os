import type { ActionOutcome } from "./outcome";

/**
 * The text a failed write shows when it is not in a window with a field to point at: the server's own message when it
 * gave one (already in the active language), the first issue of a rejected input, else `fallback`. An `ok` outcome has
 * no failure, so it reads as the fallback too.
 */
export function failureMessage(outcome: ActionOutcome, fallback: string): string {
  switch (outcome.status) {
    case "error":
      return outcome.text;
    case "invalid":
      return outcome.issues[0]?.message ?? fallback;
    case "ok":
    case "awaiting_approval":
      return fallback;
    default: {
      const unreachable: never = outcome;
      return unreachable;
    }
  }
}
