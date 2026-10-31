"use client";

import { cn } from "cn";

import { Card } from "@/components/ui/card";
import { format, type Locale, useLocale, useMessages } from "@/core/i18n/client";
import { toneEdge, toneTint } from "@/ds/components";

import type { TableLocation } from "./floor/floor-model";
import { zoneName } from "./floor/plan-names";
import { type BookingsMessages, bookingsMessageKey } from "./messages";
import { formatClock, guestName, isLate, statusTones } from "./reservation-status";
import { type Reservation, SERVICE_NOW_MIN, SERVICE_WINDOW } from "./reservations-data";

const span = SERVICE_WINDOW.endMin - SERVICE_WINDOW.startMin;
const hourMarks = Array.from({ length: span / 60 + 1 }, (_, index) => SERVICE_WINDOW.startMin + index * 60);
const percentOf = (minutes: number) => `${((minutes - SERVICE_WINDOW.startMin) / span) * 100}%`;

type Lane = { key: string; title: string; subtitle: string; reservations: Reservation[] };

function Track({
  lane,
  text,
  locale,
  onOpen,
}: {
  lane: Lane;
  text: BookingsMessages;
  locale: Locale;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="border-foreground/8 relative h-12 border-b">
      {hourMarks.map((mark) => (
        <span
          key={mark}
          aria-hidden="true"
          className="bg-foreground/8 absolute inset-y-0 w-px"
          style={{ left: percentOf(mark) }}
        />
      ))}
      {lane.reservations.map((reservation) => {
        const tone = statusTones[reservation.status];
        const label = `${guestName(reservation, text)} · ${format(text.partyShort, locale, { count: reservation.partySize })}`;
        return (
          <button
            key={reservation.id}
            type="button"
            onClick={() => onOpen(reservation.id)}
            title={label}
            className={cn(
              "focus-visible:ring-ring absolute inset-y-1.5 flex items-center truncate rounded-lg border-l-2 px-2 text-left text-xs outline-none focus-visible:ring-2",
              toneTint[tone],
              toneEdge[tone],
              isLate(reservation) && "ring-salmon ring-1",
            )}
            style={{
              left: percentOf(reservation.startMin),
              width: `calc(${percentOf(reservation.endMin)} - ${percentOf(reservation.startMin)})`,
            }}
          >
            <span className="truncate">{label}</span>
          </button>
        );
      })}
      <span
        aria-hidden="true"
        className="bg-brand pointer-events-none absolute inset-y-0 w-0.5"
        style={{ left: percentOf(SERVICE_NOW_MIN) }}
      />
    </div>
  );
}

/** Gantt-style service timeline: one lane per table, plus a lane per party that still has no table. */
export function ReservationsAgenda({
  reservations,
  tables,
  onOpen,
}: {
  reservations: Reservation[];
  tables: readonly TableLocation[];
  onOpen: (id: string) => void;
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const lanes: Lane[] = [
    ...reservations
      .filter((reservation) => reservation.tableIds.length === 0)
      .map((reservation) => ({
        key: `unassigned-${reservation.id}`,
        title: text.agenda.noTable,
        subtitle: format(text.agenda.toAssign, locale, {
          party: format(text.partyShort, locale, { count: reservation.partySize }),
        }),
        reservations: [reservation],
      })),
    ...tables.map(({ table, zone }) => ({
      key: table.id,
      title: table.label,
      subtitle: format(text.agenda.laneSubtitle, locale, {
        party: format(text.partyShort, locale, { count: table.capacity }),
        zone: zoneName(zone, text.venue),
      }),
      reservations: reservations.filter((reservation) => reservation.tableIds.includes(table.id)),
    })),
  ];

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="overflow-x-auto">
        <div className="grid min-w-[44rem] grid-cols-[9rem_minmax(0,1fr)]">
          <div className="border-foreground/8 text-muted-foreground border-b px-4 py-3 text-[11px] tracking-wide uppercase">
            {text.agenda.table}
          </div>
          <div className="border-foreground/8 relative h-10 border-b">
            {hourMarks.map((mark) => (
              <span
                key={mark}
                className="text-muted-foreground absolute top-3 -translate-x-1/2 text-[11px] tabular-nums first:translate-x-0 last:-translate-x-full"
                style={{ left: percentOf(mark) }}
              >
                {formatClock(mark, locale)}
              </span>
            ))}
          </div>
          {lanes.map((lane) => (
            <div key={lane.key} className="contents">
              <div className="border-foreground/8 flex min-w-0 flex-col justify-center border-b px-4">
                <span className="text-sm font-medium break-words">{lane.title}</span>
                <span className="text-muted-foreground line-clamp-2 text-[11px] break-words" title={lane.subtitle}>
                  {lane.subtitle}
                </span>
              </div>
              <Track lane={lane} text={text} locale={locale} onOpen={onOpen} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
