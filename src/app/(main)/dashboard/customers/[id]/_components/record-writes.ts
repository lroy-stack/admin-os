import type { ActionOutcome } from "@/ds/forms";

/**
 * What the actor may do on a record page, as the booleans the controls need. The page derives it from the actor's
 * permissions on the server (ADR 0006), so a control a role may not use is not rendered and the role table never
 * reaches the browser; the server still refuses the call (ADR 0005).
 */
export interface RecordAbilities {
  /** `update:customers`: edit the contact details and add a note. */
  readonly edit: boolean;
  /** `block:customers`: block and unblock. */
  readonly block: boolean;
}

export const abilitiesOf = (permissions: readonly string[]): RecordAbilities => ({
  edit: permissions.includes("update:customers"),
  block: permissions.includes("block:customers"),
});

export const toNoteInput = (id: string, { text }: { text: string }) => ({ id, text });
/** Also what Undo sends after an unblock: the block again with the reason it had, captured before the unblock cleared it. A block written by someone else meanwhile is overwritten (last write wins). */
export const toBlockInput = (id: string, reason: string) => ({ id, reason });

/**
 * The reason Undo restores after an unblock, or null when there is none to restore: a blocked customer may lack one
 * (the schema allows it), and `customers.block` refuses an empty reason, so no Undo is offered.
 */
export const restorableReason = (reason: string | undefined): string | null => {
  const trimmed = reason?.trim();
  return trimmed === undefined || trimmed === "" ? null : trimmed;
};

/** The matches of a duplicate check without the customer being edited, who always shares their own details. */
export const excludingSelf = <T extends { readonly id: string }>(matches: readonly T[], id: string): T[] =>
  matches.filter((match) => match.id !== id);

/** The toast an unblock leads to. */
export type UnblockToast =
  /** Nothing: another write is still in flight and this one was refused. */
  | { readonly kind: "none" }
  /** The unblock went through and Undo can block again with `reason`. */
  | { readonly kind: "undo"; readonly reason: string }
  /** The unblock went through and there is no reason to restore, so the toast only confirms. */
  | { readonly kind: "final" }
  /** The unblock did not go through. */
  | { readonly kind: "error" };

/**
 * Which toast follows an unblock. `awaiting_approval` falls to the error branch: the web path is never held (the
 * mock holds a write for approval only for `via: "mcp"`, see `holdsForApproval`), so it would be an unexpected answer.
 */
export function planUnblockToast(outcome: ActionOutcome | null, reason: string | null): UnblockToast {
  if (outcome === null) return { kind: "none" };
  if (outcome.status !== "ok") return { kind: "error" };
  return reason === null ? { kind: "final" } : { kind: "undo", reason };
}
