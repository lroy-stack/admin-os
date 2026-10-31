"use client";

import * as React from "react";

import { useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { cn } from "cn";
import { differenceInCalendarDays, differenceInMinutes } from "date-fns";
import { CalendarDays, Calendar as CalendarIcon, Clock, Plus, Target, XIcon } from "lucide-react";

import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { PageHeader, PeriodStepper, SegmentedControl, type SegmentedOption } from "@/ds/components";

import { createDemoEvents, type DemoEvent } from "./events-data";
import { fullCalendarLocale } from "./full-calendar-locale";
import { calendarMessageKey } from "./messages";
import { type ClosingDeal, ClosingSoon, type UpcomingEvent, UpNext } from "./schedule-sidebar";

type ViewKey = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

const viewKeys = ["dayGridMonth", "timeGridWeek", "timeGridDay"] as const satisfies readonly ViewKey[];

const calendarKeys = ["all", "work", "personal", "team", "focus"] as const;

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin];

type ScheduleEvent = DemoEvent;

function isAllDay(event: ScheduleEvent) {
  return "allDay" in event && event.allDay === true;
}

function isBackground(event: ScheduleEvent) {
  return "display" in event && event.display === "background";
}

function endOf(event: ScheduleEvent) {
  return "end" in event ? event.end : undefined;
}

const glassBorder = "border border-foreground/8";

function isViewKey(value: string | undefined): value is ViewKey {
  return viewKeys.some((view) => view === value);
}

function minutesBetween(event: ScheduleEvent) {
  const end = endOf(event);
  return end ? differenceInMinutes(end, event.start) : 0;
}

export function Calendar({ closingSoon }: { closingSoon: ClosingDeal[] }) {
  const text = useMessages(calendarMessageKey);
  const locale = useLocale();
  const controller = useCalendarController();
  const [selectedCalendar, setSelectedCalendar] = React.useState<(typeof calendarKeys)[number]>(calendarKeys[0]);
  // Demo events in the active language, built after mount: this component also renders on the server, whose clock and
  // time zone are not the device's, so reading `new Date()` during render would not match the client's markup.
  const [demoEvents, setDemoEvents] = React.useState<DemoEvent[] | null>(null);
  React.useEffect(() => {
    setDemoEvents(createDemoEvents(text.demoEvents, locale, new Date()));
  }, [text, locale]);
  // All-day items read as salmon bars; timed meetings take the default azure; focus blocks tint in the accent.
  const scheduleEvents = (demoEvents ?? []).map((event) =>
    isAllDay(event) ? { ...event, color: "var(--salmon)" } : event,
  );
  const views: SegmentedOption<ViewKey>[] = [
    { value: "dayGridMonth", label: text.views.month },
    { value: "timeGridWeek", label: text.views.week },
    { value: "timeGridDay", label: text.views.day },
  ];
  // The visible window, reported by FullCalendar's `datesSet`; the KPIs are derived from it and the events.
  const [visible, setVisible] = React.useState<{ title: string; days: number; start: Date; end: Date } | null>(null);
  const range = React.useMemo(() => {
    const inRange =
      demoEvents && visible
        ? demoEvents.filter((event) => event.start >= visible.start && event.start < visible.end)
        : [];
    return {
      events: inRange.length,
      bookedMinutes: inRange
        .filter((event) => !isBackground(event) && !isAllDay(event))
        .reduce((total, event) => total + minutesBetween(event), 0),
      focusMinutes: inRange.filter(isBackground).reduce((total, event) => total + minutesBetween(event), 0),
    };
  }, [demoEvents, visible]);
  const [upcoming, setUpcoming] = React.useState<UpcomingEvent[] | null>(null);

  React.useEffect(() => {
    if (!demoEvents) {
      return;
    }
    const now = new Date();
    setUpcoming(
      demoEvents
        .filter((event) => !isBackground(event) && event.start >= now)
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 4)
        .map((event, index) => ({
          id: `${event.title}-${index}`,
          title: event.title,
          start: event.start,
          end: endOf(event),
          allDay: isAllDay(event),
        })),
    );
  }, [demoEvents]);

  const activeView = isViewKey(controller.view?.type) ? controller.view.type : viewKeys[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={text.title}
        kpis={[
          {
            icon: CalendarDays,
            value: String(range.events),
            label: format(text.kpis.eventsInDays, locale, { count: visible?.days ?? 0 }),
          },
          {
            icon: Clock,
            value: format(text.kpis.hours, locale, { hours: Math.round(range.bookedMinutes / 60) }),
            label: text.kpis.booked,
          },
          {
            icon: Target,
            value: format(text.kpis.hours, locale, { hours: Math.round(range.focusMinutes / 60) }),
            label: text.kpis.focus,
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <PeriodStepper
          label={text.stepper.label}
          previousLabel={text.stepper.previous}
          todayLabel={text.stepper.today}
          nextLabel={text.stepper.next}
          onPrevious={() => controller.prev()}
          onToday={() => controller.today()}
          onNext={() => controller.next()}
        />
        <h2 className="ml-2 text-xl font-medium tracking-tight" aria-live="polite">
          {visible?.title}
        </h2>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <Select
            value={selectedCalendar}
            onValueChange={(value) => {
              const next = calendarKeys.find((key) => key === value);
              if (next) setSelectedCalendar(next);
            }}
          >
            <SelectTrigger
              aria-label={text.filter.label}
              className="liquid-glass h-8! w-44 rounded-full border-0 text-xs"
            >
              <CalendarIcon />
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {calendarKeys.map((key) => (
                  <SelectItem key={key} value={key}>
                    {text.filter[key]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <SegmentedControl
            label={text.views.label}
            value={activeView}
            options={views}
            onValueChange={(view) => controller.changeView(view)}
          />
          <Button className="liquid-glass-brand h-9 rounded-full px-4">
            <Plus data-icon="inline-start" />
            {text.addEvent}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <Card className="gap-0 overflow-hidden p-2 sm:p-3">
          <EventCalendarViews
            controller={controller}
            initialView={viewKeys[0]}
            locale={fullCalendarLocale(locale)}
            plugins={[...plugins]}
            popoverCloseContent={() => <XIcon className="text-muted-foreground group-hover:text-foreground size-5" />}
            events={scheduleEvents}
            nowIndicator
            eventColor="var(--azure)"
            eventContrastColor="var(--foreground)"
            backgroundEventColor="var(--brand)"
            blockEventClass={(info) =>
              cn(
                "group relative border-transparent bg-[color-mix(in_oklab,var(--fc-event-color)_32%,transparent)] backdrop-blur-sm hover:bg-[color-mix(in_oklab,var(--fc-event-color)_45%,transparent)]",
                info.isDragging && !info.isSelected && "opacity-75",
              )
            }
            blockEventInnerClass="text-foreground"
            tableBodyClass="bg-transparent"
            dayHeaderRowClass="border-0"
            dayRowClass={glassBorder}
            dayCellClass={(info) => cn(glassBorder, info.isToday && "bg-brand/6", info.isOther && "bg-foreground/2")}
            dayLaneClass={(info) => cn(glassBorder, info.isToday && "bg-brand/5", info.isDisabled && "bg-foreground/3")}
            slotLaneClass={(info) => cn(glassBorder, info.isMinor && "border-dotted")}
            slotHeaderRowClass={glassBorder}
            highlightClass="bg-brand/15"
            nonBusinessHoursClass="bg-foreground/2"
            nowIndicatorLineClass="-m-px border-1 border-brand"
            nowIndicatorDotClass="-m-1.5 size-0 rounded-full border-6 border-brand ring-2 ring-background"
            popoverClass="liquid-glass m-1 min-w-55 overflow-hidden rounded-2xl text-popover-foreground [--glass-fill:var(--popover)]"
            views={{
              dayGrid: {
                tableHeaderClass: "bg-transparent",
                listItemEventClass: (info) =>
                  cn(
                    "mb-px flex items-center gap-1 rounded-full p-px ps-1.5",
                    info.isNarrow ? "mx-0.5" : "mx-1",
                    info.isSelected ? "bg-foreground/10" : "hover:bg-foreground/8",
                  ),
                listItemEventBeforeClass: "size-1.5 shrink-0 rounded-full bg-(--fc-event-color)",
                listItemEventInnerClass: (info) =>
                  cn(
                    "flex min-w-0 flex-1 flex-row items-center justify-between",
                    info.isNarrow ? "py-px text-[0.6875rem]" : "py-0.5 text-xs",
                  ),
              },
              timeGrid: { tableHeaderClass: "bg-transparent" },
            }}
            datesSet={(info) =>
              setVisible({
                title: info.view.title,
                days: differenceInCalendarDays(info.view.currentEnd, info.view.currentStart),
                start: info.start,
                end: info.end,
              })
            }
          />
        </Card>
        <div className="flex flex-col gap-4">
          <UpNext events={upcoming} />
          <ClosingSoon deals={closingSoon} />
        </div>
      </div>
    </div>
  );
}
