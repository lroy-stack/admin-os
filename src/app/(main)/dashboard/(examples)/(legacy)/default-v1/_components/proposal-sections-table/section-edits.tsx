"use client";

import { createContext, useContext } from "react";

import type { ProposalSectionsRow } from "./schema";

/** What a row of the sections table can ask of the table that owns the rows (demo-local, nothing is saved). */
export interface SectionEdits {
  readonly update: (id: number, patch: Partial<Omit<ProposalSectionsRow, "id">>) => void;
  /** Removes the row and offers to bring it back where it was. */
  readonly remove: (row: ProposalSectionsRow) => void;
}

export const SectionEditsContext = createContext<SectionEdits | null>(null);

export function useSectionEdits(): SectionEdits {
  const edits = useContext(SectionEditsContext);
  if (!edits) throw new Error("useSectionEdits needs the sections table above it");
  return edits;
}
