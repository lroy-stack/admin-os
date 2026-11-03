"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { formatNumber, useLocale, useMessages } from "@/core/i18n/client";

import { bookingsMessageKey } from "./messages";

/** The covers of a party to seat: one fewer, the count, one more. Shared by the table callout and the Walk-in window. */
export function CoversStepper({
  value,
  onChange,
  max,
  label,
  labelledBy,
}: {
  value: number;
  onChange: (covers: number) => void;
  max: number;
  /** The group's name, when no visible label points at it. */
  label?: string;
  /** The id of the visible label that names the group. */
  labelledBy?: string;
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();

  return (
    <ButtonGroup aria-label={label} aria-labelledby={labelledBy}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={text.callout.fewer}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus />
      </Button>
      <ButtonGroupText aria-live="polite" className="min-w-9 justify-center tabular-nums">
        {formatNumber(value, locale)}
      </ButtonGroupText>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={text.callout.more}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus />
      </Button>
    </ButtonGroup>
  );
}
