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
import { toast } from "sonner";

import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { PageHeader, PeriodStepper, SegmentedControl, type SegmentedOption } from "@/ds/components";
import { useToastWithUndo } from "@/ds/feedback";
import { ConfirmAction } from "@/ds/overlays";

import { EventDialog } from "./event-dialog";
import { type EventFormInput, type EventPreset, emptyEventForm, eventToForm, presetFromNow } from "./event-form";
import { EventFormWindow } from "./event-form-dialog";
import { createDemoEvents, type DemoEvent } from "./events-data";
import { fullCalendarLocale } from "./full-calendar-locale";
import { calendarMessageKey } from "./messages";
import { type ClosingDeal, ClosingSoon, type UpcomingEvent, UpNext } from "./schedule-sidebar";
import {
  createEvent,
  EMPTY_SCHEDULE_STATE,
  type EventFields,
  editEvent,
  inCalendar,
  moveEvent,
  removeEvent,
  resolveEvents,
  restoreEvent,
  restorePatch,
} from "./schedule-state";

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
  // What the session did to the events (demo-local: a reload starts over), and the windows that do it.
  const withUndo = useToastWithUndo();
  const [state, setState] = React.useState(EMPTY_SCHEDULE_STATE);
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const events = React.useMemo(
    () => (demoEvents ? inCalendar(resolveEvents(demoEvents, state), selectedCalendar) : null),
    [demoEvents, state, selectedCalendar],
  );
  const eventsRef = React.useRef(events);
  eventsRef.current = events;
  const opener = React.useRef<Element | null>(null);
  const region = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState<
    | { kind: "event"; id: string; opening: number; open: boolean }
    | { kind: "form"; id: string | null; initial: EventFormInput; opening: number; open: boolean }
    | null
  >(null);
  const [deleting, setDeleting] = React.useState<{ id: string; open: boolean } | null>(null);
  const shownEvent = shown && shown.kind === "event" ? events?.find((event) => event.id === shown.id) : undefined;
  const deletingEvent = deleting ? events?.find((event) => event.id === deleting.id) : undefined;
  // Where focus lands when the control that opened a window is gone (a deleted event's block).
  const returnFocus = () => (opener.current?.isConnected ? opener.current : region.current);

  function openCreate(preset: EventPreset, from: Element | null) {
    opener.current = from;
    setShown((current) => ({
      kind: "form",
      id: null,
      initial: emptyEventForm(preset),
      opening: (current?.opening ?? 0) + 1,
      open: true,
    }));
  }

  function openEvent(id: string, from: Element | null) {
    opener.current = from;
    setShown((current) => ({ kind: "event", id, opening: (current?.opening ?? 0) + 1, open: true }));
  }

  function saveEvent(fields: EventFields, id: string | null) {
    if (id) setState((current) => editEvent(current, id, fields));
    else setState((current) => createEvent(current, fields).state);
    toast.success(id ? text.event.toast.saved : text.event.toast.created);
  }

  /** A drag or a resize on the calendar: the event takes the new dates, and the move can be undone. */
  function reschedule(event: { id: string; title: string; start: Date | null; end: Date | null; allDay: boolean }) {
    const { start } = event;
    if (!start) return;
    const before = stateRef.current.patches[event.id];
    setState((current) => moveEvent(current, event.id, { start, end: event.end ?? undefined, allDay: event.allDay }));
    withUndo({
      message: format(text.event.toast.moved, locale, { title: event.title }),
      undo: () => setState((current) => restorePatch(current, event.id, before)),
    });
  }

  function confirmDelete(id: string, title: string) {
    setState((current) => removeEvent(current, id));
    setShown(null);
    opener.current = null;
    requestAnimationFrame(() => region.current?.focus());
    withUndo({
      message: format(text.event.toast.deleted, locale, { title }),
      undo: () => setState((current) => restoreEvent(current, id)),
    });
  }
  // All-day items read as salmon bars; timed meetings take the default azure; focus blocks tint in the accent.
  const scheduleEvents = (events ?? []).map((event) =>
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
      events && visible ? events.filter((event) => event.start >= visible.start && event.start < visible.end) : [];
    return {
      events: inRange.length,
      bookedMinutes: inRange
        .filter((event) => !isBackground(event) && !isAllDay(event))
        .reduce((total, event) => total + minutesBetween(event), 0),
      focusMinutes: inRange.filter(isBackground).reduce((total, event) => total + minutesBetween(event), 0),
    };
  }, [events, visible]);
  const [upcoming, setUpcoming] = React.useState<UpcomingEvent[] | null>(null);

  React.useEffect(() => {
    if (!events) {
      return;
    }
    const now = new Date();
    setUpcoming(
      events
        .filter((event) => !isBackground(event) && event.start >= now)
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 4)
        .map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: endOf(event),
          allDay: isAllDay(event),
        })),
    );
  }, [events]);

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
          <Button
            className="liquid-glass-brand h-9 rounded-full px-4"
            onClick={(click) => openCreate(presetFromNow(new Date()), click.currentTarget)}
          >
            <Plus data-icon="inline-start" />
            {text.addEvent}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <Card ref={region} tabIndex={-1} className="gap-0 overflow-hidden p-2 outline-none sm:p-3">
          <EventCalendarViews
            controller={controller}
            initialView={viewKeys[0]}
            locale={fullCalendarLocale(locale)}
            plugins={[...plugins]}
            popoverCloseContent={() => <XIcon className="text-muted-foreground group-hover:text-foreground size-5" />}
            events={scheduleEvents}
            eventInteractive
            selectable
            editable
            eventClick={(info) => openEvent(info.event.id, info.el)}
            select={(info) => {
              info.view.calendar.unselect();
              openCreate({ start: info.start, end: info.end, allDay: info.allDay }, null);
            }}
            eventDrop={(info) => reschedule(info.event)}
            eventResize={(info) => reschedule(info.event)}
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
          <UpNext events={upcoming} onOpen={openEvent} />
          <ClosingSoon deals={closingSoon} />
        </div>
      </div>
      {shown?.kind === "event" && shownEvent ? (
        <EventDialog
          key={shown.opening}
          event={shownEvent}
          open={shown.open}
          onOpenChange={(open) => setShown((current) => (current ? { ...current, open } : current))}
          returnFocus={returnFocus}
          onEdit={() =>
            setShown((current) => ({
              kind: "form",
              id: shownEvent.id,
              initial: eventToForm(shownEvent),
              opening: (current?.opening ?? 0) + 1,
              open: true,
            }))
          }
          onDelete={() => setDeleting({ id: shownEvent.id, open: true })}
        />
      ) : null}
      {shown?.kind === "form" ? (
        <EventFormWindow
          key={shown.opening}
          initial={shown.initial}
          editing={shown.id !== null}
          open={shown.open}
          onOpenChange={(open) => setShown((current) => (current ? { ...current, open } : current))}
          returnFocus={returnFocus}
          onSave={(fields) => saveEvent(fields, shown.id)}
        />
      ) : null}
      {deleting && deletingEvent ? (
        <ConfirmAction
          destructive
          open={deleting.open}
          onOpenChange={(open) => setDeleting({ ...deleting, open })}
          returnFocus={returnFocus}
          verb={text.event.confirm.verb}
          title={text.event.confirm.title}
          consequence={format(text.event.confirm.consequence, locale, { title: deletingEvent.title })}
          onConfirm={async () => {
            confirmDelete(deletingEvent.id, deletingEvent.title);
            return { status: "ok" };
          }}
        />
      ) : null}
    </div>
  );
}
