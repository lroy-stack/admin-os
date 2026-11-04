"use client";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/core/i18n/client";
import { QuickDialog } from "@/ds/overlays";

import { useOpenWindow } from "../../_components/use-open-window";
import { financeMessageKey } from "./messages";

export interface ScoreEntry {
  /** The month, already formatted. */
  readonly month: string;
  /** The score, already formatted. */
  readonly score: string;
}

/** View details of the score notification: a `QuickDialog` with the score at the start of each month. */
export function ScoreHistoryButton({ label, entries }: { label: string; entries: readonly ScoreEntry[] }) {
  const text = useMessages(financeMessageKey);
  const window = useOpenWindow<null>();

  return (
    <>
      <Button size="sm" variant="outline" onClick={(event) => window.show(null, event.currentTarget)}>
        {label}
      </Button>
      {window.shown ? (
        <QuickDialog
          demo
          key={window.shown.opening}
          open={window.shown.open}
          onOpenChange={window.onOpenChange}
          title={text.scoreHistory.title}
          description={text.scoreHistory.description}
          returnFocus={window.returnFocus}
          footer={({ close }) => (
            <Button type="button" onClick={close}>
              {text.done}
            </Button>
          )}
        >
          <dl className="divide-y rounded-lg border text-sm">
            {entries.map((entry) => (
              <div key={entry.month} className="flex items-center justify-between gap-4 px-3 py-2">
                <dt className="text-muted-foreground">{entry.month}</dt>
                <dd className="font-medium tabular-nums">{entry.score}</dd>
              </div>
            ))}
          </dl>
        </QuickDialog>
      ) : null}
    </>
  );
}
