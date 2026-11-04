"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { format, formatLocalDate, type Locale, useLocale, useMessages } from "@/core/i18n/client";
import { QuickDialog, type ReturnFocus } from "@/ds/overlays";

import { type CalendarMessages, calendarMessageKey } from "./messages";
import type { ScheduleEvent } from "./schedule-state";

const DATE: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
const TIME: Intl.DateTimeFormatOptions = { timeStyle: "short" };
const DATE_TIME: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** When an event happens, in words: a day, a day with its hours, or a range. `end` of an all-day event is exclusive. */
export function describeWhen(event: ScheduleEvent, locale: Locale, text: CalendarMessages): string {
  const { start, end } = event;
  if (event.allDay) {
    const last = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1) : start;
    return isSameDay(start, last)
      ? formatLocalDate(start, locale, DATE)
      : format(text.event.range, locale, {
          start: formatLocalDate(start, locale, DATE),
          end: formatLocalDate(last, locale, DATE),
        });
  }
  if (!end) return formatLocalDate(start, locale, DATE_TIME);
  if (isSameDay(start, end)) {
    return format(text.event.timed, locale, {
      date: formatLocalDate(start, locale, DATE),
      time: format(text.sidebar.timeRange, locale, {
        start: formatLocalDate(start, locale, TIME),
        end: formatLocalDate(end, locale, TIME),
      }),
    });
  }
  return format(text.event.range, locale, {
    start: formatLocalDate(start, locale, DATE_TIME),
    end: formatLocalDate(end, locale, DATE_TIME),
  });
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm break-words whitespace-pre-line">{children}</dd>
    </div>
  );
}

export interface EventDialogProps {
  event: ScheduleEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  onEdit: () => void;
  onDelete: () => void;
}

/** An event's details with Edit and Delete (ADR 0015: a short look at a record and its two actions). */
export function EventDialog({ event, open, onOpenChange, returnFocus, onEdit, onDelete }: EventDialogProps) {
  const text = useMessages(calendarMessageKey);
  const locale = useLocale();

  return (
    <QuickDialog
      open={open}
      onOpenChange={onOpenChange}
      title={event.title}
      description={text.event.details}
      returnFocus={returnFocus}
      footer={
        <>
          <Button type="button" variant="outline" className="text-destructive" onClick={onDelete}>
            <Trash2 data-icon="inline-start" />
            {text.event.delete}
          </Button>
          <Button type="button" onClick={onEdit}>
            <Pencil data-icon="inline-start" />
            {text.event.edit}
          </Button>
        </>
      }
    >
      <dl className="divide-border divide-y">
        <Detail label={text.event.when}>{describeWhen(event, locale, text)}</Detail>
        <Detail label={text.event.calendar}>{text.filter[event.calendar]}</Detail>
        {event.location ? <Detail label={text.event.location}>{event.location}</Detail> : null}
        {event.notes ? <Detail label={text.event.notes}>{event.notes}</Detail> : null}
      </dl>
    </QuickDialog>
  );
}
