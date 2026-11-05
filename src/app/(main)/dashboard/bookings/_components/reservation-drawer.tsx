"use client";

import { useRef, useState } from "react";

import { Ellipsis } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  format,
  formatAmount,
  formatList,
  formatNumber,
  formatRelative,
  languageName,
  useCurrency,
  useLocale,
  useMessages,
} from "@/core/i18n/client";
import { StatTiles, TonePill } from "@/ds/components";
import { ResponsivePanel } from "@/ds/overlays";

import { useBookingWrites } from "./booking-writes";
import { bookingsMessageKey } from "./messages";
import { type AdvanceReservation, ReservationActionButton } from "./reservation-action-button";
import { type PendingConfirm, ReservationConfirms } from "./reservation-confirms";
import {
  formatClock,
  guestName,
  isActive,
  isCancellable,
  isLate,
  isNoShowable,
  minutesLate,
  statusTones,
  tableLabel,
} from "./reservation-status";
import { ReservationTags } from "./reservation-tags";
import type { GuestProfile, Reservation, ServiceDay } from "./view-model";

const DAY_MS = 86_400_000;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(6rem,8rem)_minmax(0,1fr)] gap-3 py-1.5 text-sm">
      <dt className="text-muted-foreground break-words hyphens-auto">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

/** Reservation details: a right drawer on desktop and tablet, a bottom drawer on phones (repo pattern). */
export function ReservationDrawer({
  reservation,
  service,
  onOpenChange,
  onAdvance,
}: {
  reservation: Reservation | null;
  service: ServiceDay;
  onOpenChange: (open: boolean) => void;
  onAdvance: AdvanceReservation;
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const currency = useCurrency();
  const profile = reservation?.profile ?? null;
  const { can } = useBookingWrites();
  const [confirming, setConfirming] = useState<PendingConfirm | null>(null);
  const moreActions = useRef<HTMLButtonElement>(null);
  const canCancel = reservation !== null && can.cancel && isCancellable(reservation);
  const canNoShow =
    reservation !== null && can.noShow && isNoShowable(reservation, service.nowMin, service.lateAfterMin);

  function lastVisit(profile: GuestProfile) {
    if (profile.lastVisitDaysAgo === null) return text.drawer.firstVisit;
    if (profile.lastVisitDaysAgo === 0) return text.drawer.today;
    return formatRelative(-profile.lastVisitDaysAgo * DAY_MS, 0, locale);
  }

  return (
    <ResponsivePanel
      open={reservation !== null}
      onOpenChange={onOpenChange}
      title={reservation ? guestName(reservation, text) : ""}
      description={
        reservation
          ? format(text.drawer.summary, locale, {
              party: format(text.party, locale, { count: reservation.partySize }),
              from: formatClock(reservation.startMin, locale),
              to: formatClock(reservation.endMin, locale),
              channel: text.channels[reservation.channel],
            })
          : ""
      }
      className="backdrop-blur-xl"
      headerClassName="gap-1 px-6 pt-6"
      titleClassName="text-xl font-medium break-words"
    >
      {reservation && (
        <div className="flex flex-col gap-6 px-6 pb-8">
          <div className="flex flex-wrap items-center gap-1.5">
            <TonePill tone={statusTones[reservation.status]} dot>
              {text.status[reservation.status]}
            </TonePill>
            <TonePill tone="neutral">{formatClock(reservation.startMin, locale)}</TonePill>
            {reservation.tableIds.length > 0 ? (
              <TonePill tone="neutral">
                {format(text.drawer.table, locale, { label: tableLabel(reservation) })}
              </TonePill>
            ) : (
              <TonePill tone="salmon">{text.drawer.noTableYet}</TonePill>
            )}
            {isLate(reservation, service.nowMin, service.lateAfterMin) && (
              <TonePill tone="salmon">
                {format(text.late.long, locale, { minutes: minutesLate(reservation, service.nowMin) })}
              </TonePill>
            )}
          </div>

          {isActive(reservation) && (
            <div className="flex flex-wrap items-center gap-2">
              <ReservationActionButton reservation={reservation} onAdvance={onAdvance} emphasis="primary" />
              {canCancel || canNoShow ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      ref={moreActions}
                      variant="ghost"
                      size="icon"
                      aria-label={text.drawer.moreActions}
                      className="liquid-glass hover:bg-foreground/10 size-9 rounded-full"
                    >
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {canNoShow ? (
                      <DropdownMenuItem onSelect={() => setConfirming("no_show")}>
                        {text.drawer.markNoShow}
                      </DropdownMenuItem>
                    ) : null}
                    {canCancel ? (
                      <DropdownMenuItem variant="destructive" onSelect={() => setConfirming("cancel")}>
                        {text.drawer.cancelReservation}
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          )}

          <ReservationConfirms
            reservation={reservation}
            confirming={confirming}
            onClose={() => setConfirming(null)}
            returnFocus={moreActions}
          />

          <section className="flex flex-col gap-2" aria-labelledby="reservation-guest">
            <h3 id="reservation-guest" className="text-muted-foreground text-xs tracking-wide uppercase">
              {text.drawer.guest}
            </h3>
            <StatTiles
              items={[
                { label: text.drawer.visits, value: profile ? formatNumber(profile.visits, locale) : "—" },
                {
                  label: text.drawer.averageSpend,
                  value: profile?.averageSpend
                    ? formatAmount(profile.averageSpend, currency, locale, { fractionDigits: 0 })
                    : "—",
                },
                { label: text.drawer.lastVisit, value: profile ? lastVisit(profile) : "—" },
                {
                  label: text.drawer.language,
                  value: profile?.language ? languageName(profile.language, locale) : "—",
                },
              ]}
            />
          </section>

          <section className="flex flex-col gap-1" aria-labelledby="reservation-details">
            <h3 id="reservation-details" className="text-muted-foreground text-xs tracking-wide uppercase">
              {text.drawer.details}
            </h3>
            <dl className="divide-foreground/8 divide-y">
              <DetailRow label={text.drawer.phone} value={reservation.phone ?? "—"} />
              <DetailRow label={text.drawer.email} value={reservation.email ?? "—"} />
              <DetailRow
                label={text.drawer.allergies}
                value={
                  profile && profile.allergens.length > 0
                    ? formatList(
                        profile.allergens.map((id) => text.allergens[id] ?? id),
                        locale,
                      )
                    : text.drawer.noneRecorded
                }
              />
              <DetailRow label={text.drawer.bookingNote} value={reservation.note ?? "—"} />
              {reservation.staffNote && <DetailRow label={text.drawer.staffNote} value={reservation.staffNote} />}
            </dl>
            <ReservationTags tags={reservation.tags} />
          </section>
        </div>
      )}
    </ResponsivePanel>
  );
}
