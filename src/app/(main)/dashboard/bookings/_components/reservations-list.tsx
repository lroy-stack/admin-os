"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, formatNumber, useLocale, useMessages } from "@/core/i18n/client";
import { TonePill } from "@/ds/components";

import { bookingsMessageKey } from "./messages";
import { type AdvanceReservation, ReservationActionButton } from "./reservation-action-button";
import { formatClock, guestName, isLate, minutesLate, statusTones, tableLabel } from "./reservation-status";
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
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();

  return (
    <Card className="gap-0 px-3 py-2">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={headClassName}>{text.list.arrival}</TableHead>
            <TableHead className={headClassName}>{text.list.guest}</TableHead>
            <TableHead className={headClassName}>{text.list.party}</TableHead>
            <TableHead className={headClassName}>{text.list.table}</TableHead>
            <TableHead className={headClassName}>{text.list.status}</TableHead>
            <TableHead className={`${headClassName} hidden xl:table-cell`}>{text.list.channel}</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation) => (
            <TableRow key={reservation.id} className="hover:bg-foreground/5">
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-base font-medium tabular-nums">
                    {formatClock(reservation.startMin, locale)}
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {`→ ${formatClock(reservation.endMin, locale)}`}
                    {isLate(reservation) && (
                      <span className="text-salmon">
                        {` · ${format(text.late.short, locale, { minutes: minutesLate(reservation) })}`}
                      </span>
                    )}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex min-w-0 flex-col items-start gap-1">
                  <button
                    type="button"
                    onClick={() => onOpen(reservation.id)}
                    className="focus-visible:ring-ring rounded-sm text-left font-medium break-words outline-none hover:underline focus-visible:ring-2"
                  >
                    {guestName(reservation, text)}
                  </button>
                  <ReservationTags tags={reservation.tags} />
                </div>
              </TableCell>
              <TableCell className="tabular-nums">{formatNumber(reservation.partySize, locale)}</TableCell>
              <TableCell>
                {reservation.tableIds.length > 0 ? (
                  <span className="tabular-nums">{tableLabel(reservation)}</span>
                ) : (
                  <TonePill tone="salmon">{text.list.noTable}</TonePill>
                )}
              </TableCell>
              <TableCell>
                <TonePill tone={statusTones[reservation.status]} dot>
                  {text.status[reservation.status]}
                </TonePill>
              </TableCell>
              <TableCell className="text-muted-foreground hidden xl:table-cell">
                {text.channels[reservation.channel]}
              </TableCell>
              <TableCell className="text-right">
                <ReservationActionButton reservation={reservation} onAdvance={onAdvance} />
              </TableCell>
            </TableRow>
          ))}
          {reservations.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground py-12 text-center">
                {text.list.empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
