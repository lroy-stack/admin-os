"use client";

import * as React from "react";

import { subDays } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatLocalDate, useLocale, useMessages } from "@/core/i18n/client";
import { dateFnsLocale } from "@/core/i18n/ui";

import { commonMessageKey } from "./common-messages";

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (value: DateRange | undefined) => void;
}

const SHORT_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const text = useMessages(commonMessageKey).dateRange;
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const [internalDateRange, setInternalDateRange] = React.useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = subDays(to, 29);
    return { from, to };
  });
  const dateRange = value ?? internalDateRange;
  let dateRangeLabel = text.select;

  if (dateRange?.from) {
    dateRangeLabel = formatLocalDate(dateRange.from, locale, SHORT_DATE);
  }

  if (dateRange?.from && dateRange.to) {
    dateRangeLabel = `${formatLocalDate(dateRange.from, locale, SHORT_DATE)} - ${formatLocalDate(dateRange.to, locale, SHORT_DATE)}`;
  }

  const handleDateChange = (nextValue: DateRange | undefined) => {
    if (!value) {
      setInternalDateRange(nextValue);
    }
    onChange?.(nextValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" id="date" className="font-normal">
          {dateRangeLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="end">
        <Calendar
          mode="range"
          locale={dateFnsLocale(locale)}
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={handleDateChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
