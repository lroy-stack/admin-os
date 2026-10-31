import { cn } from "cn";

import { Card } from "@/components/ui/card";
import { toneEdge, toneTint } from "@/ds/components";

import type { TableLocation } from "./floor/floor-model";
import { formatClock, isLate, statusTones } from "./reservation-status";
import { type Reservation, SERVICE_NOW_MIN, SERVICE_WINDOW } from "./reservations-data";

const span = SERVICE_WINDOW.endMin - SERVICE_WINDOW.startMin;
const hourMarks = Array.from({ length: span / 60 + 1 }, (_, index) => SERVICE_WINDOW.startMin + index * 60);
const percentOf = (minutes: number) => `${((minutes - SERVICE_WINDOW.startMin) / span) * 100}%`;

type Lane = { key: string; title: string; subtitle: string; reservations: Reservation[] };

function Track({ lane, onOpen }: { lane: Lane; onOpen: (id: string) => void }) {
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
        return (
          <button
            key={reservation.id}
            type="button"
            onClick={() => onOpen(reservation.id)}
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
            <span className="truncate">
              {reservation.guest} · {reservation.partySize}p
            </span>
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
  const lanes: Lane[] = [
    ...reservations
      .filter((reservation) => reservation.tableIds.length === 0)
      .map((reservation) => ({
        key: `unassigned-${reservation.id}`,
        title: "No table",
        subtitle: `${reservation.partySize}p · to assign`,
        reservations: [reservation],
      })),
    ...tables.map(({ table, zone }) => ({
      key: table.id,
      title: table.label,
      subtitle: `${table.capacity}p · ${zone.name}`,
      reservations: reservations.filter((reservation) => reservation.tableIds.includes(table.id)),
    })),
  ];

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="overflow-x-auto">
        <div className="grid min-w-[44rem] grid-cols-[7rem_minmax(0,1fr)]">
          <div className="border-foreground/8 text-muted-foreground border-b px-4 py-3 text-[11px] tracking-wide uppercase">
            Table
          </div>
          <div className="border-foreground/8 relative h-10 border-b">
            {hourMarks.map((mark) => (
              <span
                key={mark}
                className="text-muted-foreground absolute top-3 -translate-x-1/2 text-[11px] tabular-nums first:translate-x-0 last:-translate-x-full"
                style={{ left: percentOf(mark) }}
              >
                {formatClock(mark)}
              </span>
            ))}
          </div>
          {lanes.map((lane) => (
            <div key={lane.key} className="contents">
              <div className="border-foreground/8 flex flex-col justify-center border-b px-4">
                <span className="text-sm font-medium">{lane.title}</span>
                <span className="text-muted-foreground truncate text-[11px]">{lane.subtitle}</span>
              </div>
              <Track lane={lane} onOpen={onOpen} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
