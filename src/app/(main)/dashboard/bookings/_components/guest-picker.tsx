"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { searchGuests } from "../actions";
import type { GuestRow } from "./guest-search";
import { bookingsMessageKey } from "./messages";
import { useGuestSearch } from "./use-guest-search";

export interface GuestPickerProps {
  /** From `FormField`: the id the label points at, and the error wiring. */
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
  /** The guest picked, or null. */
  picked: GuestRow | null;
  onPick: (row: GuestRow) => void;
  onClear: () => void;
}

/**
 * Finds an existing guest by name or phone (`customers.search`) and shows the one picked with a way to change it.
 * The list is a listbox: arrow keys move, Enter picks.
 */
export function GuestPicker({ id, picked, onPick, onClear, ...field }: GuestPickerProps) {
  const text = useMessages(bookingsMessageKey).newReservation.guest;
  const locale = useLocale();
  const [typed, setTyped] = useState("");
  const found = useGuestSearch(typed, searchGuests);

  if (picked !== null) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
        <span className="min-w-0 text-sm">
          <span className="font-medium break-words">{picked.name}</span>
          {picked.phone === null ? null : (
            <span className="text-muted-foreground block tabular-nums">{picked.phone}</span>
          )}
        </span>
        <Button id={id} type="button" variant="outline" size="sm" {...field} onClick={onClear}>
          {text.change}
        </Button>
      </div>
    );
  }

  return (
    <Command label={text.searchLabel} shouldFilter={false} className="rounded-lg border p-0">
      <CommandInput
        id={id}
        value={typed}
        onValueChange={setTyped}
        placeholder={text.searchPlaceholder}
        autoComplete="off"
        {...field}
      />
      <CommandList>
        {found.status === "ready"
          ? found.rows.map((row) => (
              <CommandItem
                key={row.id}
                value={row.id}
                onSelect={() => onPick(row)}
                className="flex-col items-start gap-0"
              >
                <span className="font-medium">{row.name}</span>
                {row.phone === null ? null : (
                  <span className="text-muted-foreground text-xs tabular-nums">{row.phone}</span>
                )}
              </CommandItem>
            ))
          : null}
      </CommandList>
      <div role="status" className="text-muted-foreground px-3 py-2 text-sm empty:hidden">
        {found.status === "loading" ? (
          <span className="flex items-center gap-2">
            <Spinner /> {text.searching}
          </span>
        ) : null}
        {found.status === "error" ? (found.text ?? text.searchFailed) : null}
        {found.status === "ready" && found.rows.length === 0
          ? format(text.noMatch, locale, { query: typed.trim() })
          : null}
      </div>
    </Command>
  );
}
