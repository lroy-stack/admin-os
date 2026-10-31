"use client";

import * as React from "react";

import { startOfMonth, startOfToday } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/core/i18n/client";
import { dateFnsLocale } from "@/core/i18n/ui";

export function CalendarPanel() {
  const locale = useLocale();
  const today = startOfToday();
  const [date, setDate] = React.useState<Date | undefined>(today);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => startOfMonth(today));

  return (
    <Card className="w-full" size="sm">
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          fixedWeeks
          locale={dateFnsLocale(locale)}
          className="w-full p-0"
        />
      </CardContent>
    </Card>
  );
}
