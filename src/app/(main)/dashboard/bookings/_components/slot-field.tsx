"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { bookingsMessageKey } from "./messages";
import type { SlotOption } from "./new-reservation-slots";
import { formatClock } from "./reservation-status";
import type { AvailabilityState } from "./use-availability";

export interface SlotFieldProps {
  /** From `FormField`: the id the label points at, and the error wiring. */
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
  availability: AvailabilityState;
  /** The slots to offer, from `slotOptions`. */
  options: readonly SlotOption[];
  /** The start minute picked, as text, or blank. */
  value: string;
  onChange: (startMin: string) => void;
  onRetry: () => void;
  /** The party, worded, for the "no time fits" sentence. */
  party: string;
}

/** The start times of the day as one choice, with its loading, empty and error states. */
export function SlotField({ id, availability, options, value, onChange, onRetry, party, ...field }: SlotFieldProps) {
  const text = useMessages(bookingsMessageKey).newReservation;
  const locale = useLocale();

  if (availability.status === "idle") {
    return <p className="text-muted-foreground text-sm">{text.date.invalid}</p>;
  }
  if (availability.status === "loading") {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-2">
        <span className="text-muted-foreground text-sm">{text.slot.loading}</span>
        <div className="flex flex-wrap gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-8 w-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  if (availability.status === "error") {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>{availability.text ?? text.slot.failed}</span>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            {text.slot.retry}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (options.length === 0) {
    return (
      <Alert>
        <AlertDescription>{format(text.slot.none, locale, { party })}</AlertDescription>
      </Alert>
    );
  }
  return (
    <ToggleGroup
      id={id}
      type="single"
      variant="outline"
      spacing={2}
      value={value}
      aria-label={text.slot.label}
      aria-invalid={field["aria-invalid"]}
      aria-describedby={field["aria-describedby"]}
      onValueChange={(next) => {
        if (next !== "") onChange(next);
      }}
      className="w-full flex-wrap"
    >
      {options.map((slot) => (
        <ToggleGroupItem key={slot.startMin} value={String(slot.startMin)} className="min-h-9 px-3 tabular-nums">
          {formatClock(slot.startMin, locale)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
