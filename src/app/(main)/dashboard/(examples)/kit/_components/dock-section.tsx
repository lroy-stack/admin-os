"use client";

import { useId, useRef, useState } from "react";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { DockedPanel, usePanelPick } from "@/ds/overlays";

import { KitSection } from "./kit-section";
import { kitMessageKey } from "./messages";

const TABLES = [1, 2, 3, 4, 5, 6] as const;

/** A mini floor next to a docked panel whose Table field is filled by clicking a table on the floor (pick mode). */
export function DockSection() {
  const text = useMessages(kitMessageKey).dock;
  const locale = useLocale();
  const guestId = useId();
  const [open, setOpen] = useState(false);
  const [guest, setGuest] = useState("");
  const [table, setTable] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const opener = useRef<Element | null>(null);
  const pickButton = useRef<HTMLButtonElement>(null);
  const pick = usePanelPick<number>();
  const dirty = guest !== "" || table !== null;
  const name = (number: number) => format(text.tableName, locale, { number });

  const change = (next: boolean) => {
    if (!next) {
      setGuest("");
      setTable(null);
    }
    setOpen(next);
  };

  const pickTable = async () => {
    const answer = await pick.request("table");
    if (answer !== null) setTable(answer);
    pickButton.current?.focus();
  };

  return (
    <KitSection title={text.title} description={text.description}>
      <Button
        variant="outline"
        onClick={(event) => {
          opener.current = event.currentTarget;
          change(true);
        }}
      >
        {text.open}
      </Button>
      {saved === null ? null : <p className="text-muted-foreground text-sm">{saved}</p>}
      <fieldset className="flex w-full min-w-0 flex-col gap-2">
        <legend className="text-sm font-medium">{text.floorLabel}</legend>
        <div className="grid grid-cols-3 gap-2" data-picking={pick.picking !== null}>
          {TABLES.map((number) => (
            <Button
              key={number}
              type="button"
              variant="outline"
              aria-pressed={pick.picking === null ? selected === number : undefined}
              className={cn(pick.picking !== null && "ring-primary ring-2")}
              onClick={() => {
                if (!pick.answer(number)) setSelected(number);
              }}
            >
              {name(number)}
            </Button>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          {selected === null ? text.floorNone : format(text.floorSelected, locale, { table: name(selected) })}
        </p>
      </fieldset>
      <DockedPanel
        open={open}
        onOpenChange={change}
        dirty={dirty}
        pick={pick}
        returnFocus={opener}
        title={text.windowTitle}
        description={text.windowDescription}
        footer={({ close }) => (
          <>
            <Button variant="outline" onClick={close}>
              {text.cancel}
            </Button>
            <Button
              onClick={() => {
                setSaved(
                  format(text.saved, locale, {
                    guest: guest === "" ? "-" : guest,
                    table: table === null ? text.tableAuto : name(table),
                  }),
                );
                change(false);
              }}
            >
              {text.save}
            </Button>
          </>
        )}
      >
        {({ docked }) => (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={guestId}>{text.guestLabel}</Label>
              <Input id={guestId} value={guest} onChange={(event) => setGuest(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{text.tableLabel}</span>
              <p data-testid="dock-table">{table === null ? text.tableAuto : name(table)}</p>
              {docked ? (
                <Button ref={pickButton} type="button" variant="outline" onClick={pickTable}>
                  {text.pick}
                </Button>
              ) : (
                <p className="text-muted-foreground text-sm">{text.sheetNote}</p>
              )}
            </div>
          </div>
        )}
      </DockedPanel>
    </KitSection>
  );
}
