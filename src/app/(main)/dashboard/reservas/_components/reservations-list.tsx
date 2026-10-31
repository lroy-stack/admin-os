import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TonePill } from "@/ds/components";

import { type AdvanceReservation, ReservationActionButton } from "./reservation-action-button";
import { formatClock, isLate, minutesLate, statusLabels, statusTones, tableLabel } from "./reservation-status";
import { ReservationTags } from "./reservation-tags";
import type { Reservation } from "./reservations-data";

const headClassName = "text-muted-foreground text-[11px] font-normal tracking-wide uppercase";

export function ReservationsList({
  reservations,
  onOpen,
  onAdvance,
}: {
  reservations: Reservation[];
  onOpen: (id: string) => void;
  onAdvance: AdvanceReservation;
}) {
  return (
    <Card className="gap-0 px-3 py-2">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={headClassName}>Arrival → leaves</TableHead>
            <TableHead className={headClassName}>Guest</TableHead>
            <TableHead className={headClassName}>Party</TableHead>
            <TableHead className={headClassName}>Table</TableHead>
            <TableHead className={headClassName}>Status</TableHead>
            <TableHead className={`${headClassName} hidden xl:table-cell`}>Channel</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation) => (
            <TableRow key={reservation.id} className="hover:bg-foreground/5">
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-base font-medium tabular-nums">{formatClock(reservation.startMin)}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    → {formatClock(reservation.endMin)}
                    {isLate(reservation) && <span className="text-salmon"> · +{minutesLate(reservation)}'</span>}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <button
                    type="button"
                    onClick={() => onOpen(reservation.id)}
                    className="focus-visible:ring-ring rounded-sm text-left font-medium outline-none hover:underline focus-visible:ring-2"
                  >
                    {reservation.guest}
                  </button>
                  <ReservationTags tags={reservation.tags} />
                </div>
              </TableCell>
              <TableCell className="tabular-nums">{reservation.partySize}</TableCell>
              <TableCell>
                {reservation.tableIds.length > 0 ? (
                  <span className="tabular-nums">{tableLabel(reservation)}</span>
                ) : (
                  <TonePill tone="salmon">No table</TonePill>
                )}
              </TableCell>
              <TableCell>
                <TonePill tone={statusTones[reservation.status]} dot>
                  {statusLabels[reservation.status]}
                </TonePill>
              </TableCell>
              <TableCell className="text-muted-foreground hidden first-letter:uppercase xl:table-cell">
                {reservation.channel}
              </TableCell>
              <TableCell className="text-right">
                <ReservationActionButton reservation={reservation} onAdvance={onAdvance} />
              </TableCell>
            </TableRow>
          ))}
          {reservations.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground py-12 text-center">
                Nothing matches these filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
