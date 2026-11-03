export type UndoOutcome = "undone" | "expired";

/** Settles an undo toast exactly once: whichever of undo and expiry comes first wins and the other is ignored. */
export interface UndoGate {
  /** True for the first call only; the caller acts on the outcome only when it gets true. */
  settle: (outcome: UndoOutcome) => boolean;
  readonly outcome: UndoOutcome | null;
}

export function createUndoGate(): UndoGate {
  let outcome: UndoOutcome | null = null;
  return {
    settle(next) {
      if (outcome !== null) return false;
      outcome = next;
      return true;
    },
    get outcome() {
      return outcome;
    },
  };
}
