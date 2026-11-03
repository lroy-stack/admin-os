"use client";

import { createContext, type ReactNode, useContext, useRef, useState } from "react";

import { toast } from "sonner";

import { format, useLocale, useMessages } from "@/core/i18n/client";
import type { OpenStage } from "@/data/crm";
import { useToastWithUndo } from "@/ds/feedback";
import { ConfirmAction } from "@/ds/overlays";
import type { OpenDeal } from "@/lib/crm";

import { DealFormWindow } from "./deal-form-dialog";
import { DealPanel } from "./deal-panel";
import {
  closeDeal,
  createDeal,
  type DealFields,
  type DealOutcome,
  editDeal,
  entryOf,
  moveDeal,
  removeDeal,
  restoreEntry,
} from "./deal-state";
import { getDealsState, updateDeals } from "./deals-session";
import { dashboardMessageKey } from "./messages";

/** What the cards and buttons of a screen can ask of the deal windows. `opener` is the control that asked. */
export interface DealWindows {
  openPanel: (deal: OpenDeal, opener: Element | null) => void;
  openEdit: (deal: OpenDeal, opener: Element | null) => void;
  openCreate: (stage: OpenStage | undefined, opener: Element | null) => void;
  askDelete: (deal: OpenDeal, opener: Element | null) => void;
  move: (deal: OpenDeal, stage: OpenStage, opener: Element | null) => void;
  close: (deal: OpenDeal, outcome: DealOutcome, opener: Element | null) => void;
}

const DealWindowsContext = createContext<DealWindows | null>(null);

export function useDealWindows(): DealWindows {
  const windows = useContext(DealWindowsContext);
  if (!windows) throw new Error("useDealWindows needs a DealWindowsProvider above it");
  return windows;
}

type Target = { kind: "panel" | "edit"; deal: OpenDeal } | { kind: "create"; stage: OpenStage | undefined };
type Shown = Target & { opening: number; open: boolean };

/** The region (`data-deal-region`) around a control, where focus lands when the control's deal leaves the screen. */
const regionOf = (opener: Element | null) => opener?.closest<HTMLElement>("[data-deal-region]") ?? null;

function focusRegion(region: HTMLElement | null) {
  requestAnimationFrame(() => {
    if (region?.isConnected) region.focus();
  });
}

/**
 * The windows every deal on a screen opens, mounted once: the deal panel, New deal and Edit deal, and the delete
 * confirmation, plus the actions that offer undo. The data is the session's (`deals-session.ts`): demo-local, so each
 * window that changes it says so (ADR 0015).
 */
export function DealWindowsProvider({ children }: { children: ReactNode }) {
  const text = useMessages(dashboardMessageKey);
  const locale = useLocale();
  const withUndo = useToastWithUndo();
  const opener = useRef<Element | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const [opening, setOpening] = useState(0);
  const [deleting, setDeleting] = useState<{ deal: OpenDeal; open: boolean } | null>(null);

  function show(next: Target, from: Element | null) {
    opener.current = from;
    setOpening(opening + 1);
    setShown({ ...next, opening: opening + 1, open: true });
  }

  /** Applies a change and offers to take it back: undo restores what the deal had before. */
  function perform(
    deal: OpenDeal,
    message: string,
    transition: Parameters<typeof updateDeals>[0],
    from: Element | null,
  ) {
    const before = entryOf(getDealsState(), deal.id);
    const region = regionOf(from);
    updateDeals(transition);
    focusRegion(region);
    withUndo({ message, undo: () => updateDeals((state) => restoreEntry(state, deal.id, before)) });
  }

  const windows: DealWindows = {
    openPanel: (deal, from) => show({ kind: "panel", deal }, from),
    openEdit: (deal, from) => show({ kind: "edit", deal }, from),
    openCreate: (stage, from) => show({ kind: "create", stage }, from),
    askDelete: (deal, from) => {
      opener.current = from;
      setDeleting({ deal, open: true });
    },
    move: (deal, stage, from) =>
      perform(
        deal,
        format(text.deal.toast.moved, locale, { title: deal.title, stage: text.stages[stage] }),
        (state) => moveDeal(state, deal.id, stage),
        from,
      ),
    close: (deal, outcome, from) =>
      perform(
        deal,
        format(text.deal.toast[outcome], locale, { title: deal.title }),
        (state) => closeDeal(state, deal.id, outcome),
        from,
      ),
  };

  const closeShown = (open: boolean) => setShown((current) => (current ? { ...current, open } : current));

  function saveDeal(fields: DealFields, existing: OpenDeal | null) {
    if (existing) updateDeals((state) => editDeal(state, existing.id, fields));
    else updateDeals((state) => createDeal(state, fields).state);
    toast.success(existing ? text.deal.toast.saved : text.deal.toast.created);
  }

  return (
    <DealWindowsContext.Provider value={windows}>
      {children}
      {shown?.kind === "panel" ? (
        <DealPanel
          key={shown.opening}
          deal={shown.deal}
          open={shown.open}
          onOpenChange={closeShown}
          returnFocus={() => opener.current}
          onEdit={() => windows.openEdit(shown.deal, opener.current)}
        />
      ) : null}
      {shown?.kind === "edit" || shown?.kind === "create" ? (
        <DealFormWindow
          key={shown.opening}
          deal={shown.kind === "edit" ? shown.deal : null}
          stage={shown.kind === "create" ? shown.stage : undefined}
          open={shown.open}
          onOpenChange={closeShown}
          returnFocus={() => opener.current}
          onSave={(fields) => saveDeal(fields, shown.kind === "edit" ? shown.deal : null)}
        />
      ) : null}
      {deleting ? (
        <ConfirmAction
          destructive
          open={deleting.open}
          onOpenChange={(open) => setDeleting({ ...deleting, open })}
          returnFocus={() => opener.current}
          verb={text.deal.confirm.verb}
          title={text.deal.confirm.title}
          consequence={format(text.deal.confirm.consequence, locale, { title: deleting.deal.title })}
          onConfirm={async () => {
            const deal = deleting.deal;
            const before = entryOf(getDealsState(), deal.id);
            const region = regionOf(opener.current);
            updateDeals((state) => removeDeal(state, deal.id));
            focusRegion(region);
            withUndo({
              message: format(text.deal.toast.deleted, locale, { title: deal.title }),
              undo: () => updateDeals((state) => restoreEntry(state, deal.id, before)),
            });
            return { status: "ok" };
          }}
        />
      ) : null}
    </DealWindowsContext.Provider>
  );
}
