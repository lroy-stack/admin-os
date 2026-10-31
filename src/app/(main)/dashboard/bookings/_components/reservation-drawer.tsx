"use client";

import { Ellipsis } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  format,
  formatAmount,
  formatNumber,
  formatRelative,
  useCurrency,
  useLocale,
  useMessages,
} from "@/core/i18n/client";
import { StatTiles, TonePill } from "@/ds/components";
import { useIsMobile } from "@/hooks/use-mobile";

import { bookingsMessageKey } from "./messages";
import { type AdvanceReservation, ReservationActionButton } from "./reservation-action-button";
import { formatClock, guestName, isActive, isLate, minutesLate, statusTones, tableLabel } from "./reservation-status";
import { ReservationTags } from "./reservation-tags";
import type { GuestProfile, Reservation } from "./reservations-data";

const DAY_MS = 86_400_000;

/** Fictitious contact details derived from the booking id, so the mock never shows real-looking data. */
function contactFor(reservation: Reservation) {
  const digits = reservation.id.replace(/\D/g, "").padStart(3, "0").slice(-3);
  const handle = (reservation.guest || "walkin")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "");
  return { phone: `+34 600 000 ${digits}`, email: `${handle}@example.invalid` };
}

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
  onOpenChange,
  onAdvance,
}: {
  reservation: Reservation | null;
  onOpenChange: (open: boolean) => void;
  onAdvance: AdvanceReservation;
}) {
  const isMobile = useIsMobile();
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const currency = useCurrency();

  function lastVisit(profile: GuestProfile) {
    if (profile.lastVisitDaysAgo === null) return text.drawer.firstVisit;
    if (profile.lastVisitDaysAgo === 0) return text.drawer.today;
    return formatRelative(-profile.lastVisitDaysAgo * DAY_MS, 0, locale);
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"} open={reservation !== null} onOpenChange={onOpenChange}>
      <DrawerContent className="backdrop-blur-xl data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-md">
        {reservation && (
          <div className="flex min-h-0 flex-col overflow-y-auto">
            <DrawerHeader className="gap-1 px-6 pt-6">
              <DrawerTitle className="text-xl font-medium break-words">{guestName(reservation, text)}</DrawerTitle>
              <DrawerDescription>
                {format(text.drawer.summary, locale, {
                  party: format(text.party, locale, { count: reservation.partySize }),
                  from: formatClock(reservation.startMin, locale),
                  to: formatClock(reservation.endMin, locale),
                  channel: text.channels[reservation.channel],
                })}
              </DrawerDescription>
            </DrawerHeader>

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
                {isLate(reservation) && (
                  <TonePill tone="salmon">
                    {format(text.late.long, locale, { minutes: minutesLate(reservation) })}
                  </TonePill>
                )}
              </div>

              {isActive(reservation) && (
                <div className="flex flex-wrap items-center gap-2">
                  <ReservationActionButton reservation={reservation} onAdvance={onAdvance} emphasis="primary" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={text.drawer.moreActions}
                        className="liquid-glass hover:bg-foreground/10 size-9 rounded-full"
                      >
                        <Ellipsis />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onSelect={() => onAdvance(reservation.id, "no_show")}>
                        {text.drawer.markNoShow}
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => onAdvance(reservation.id, "cancelled")}>
                        {text.drawer.cancelReservation}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <section className="flex flex-col gap-2" aria-labelledby="reservation-guest">
                <h3 id="reservation-guest" className="text-muted-foreground text-xs tracking-wide uppercase">
                  {text.drawer.guest}
                </h3>
                <StatTiles
                  items={[
                    { label: text.drawer.visits, value: formatNumber(reservation.profile.visits, locale) },
                    {
                      label: text.drawer.averageSpend,
                      value: reservation.profile.averageSpend
                        ? formatAmount(reservation.profile.averageSpend, currency, locale, { fractionDigits: 0 })
                        : "—",
                    },
                    { label: text.drawer.lastVisit, value: lastVisit(reservation.profile) },
                    {
                      label: text.drawer.language,
                      value: reservation.profile.language ? text.languages[reservation.profile.language] : "—",
                    },
                  ]}
                />
              </section>

              <section className="flex flex-col gap-1" aria-labelledby="reservation-details">
                <h3 id="reservation-details" className="text-muted-foreground text-xs tracking-wide uppercase">
                  {text.drawer.details}
                </h3>
                <dl className="divide-foreground/8 divide-y">
                  <DetailRow label={text.drawer.phone} value={contactFor(reservation).phone} />
                  <DetailRow label={text.drawer.email} value={contactFor(reservation).email} />
                  <DetailRow
                    label={text.drawer.allergies}
                    value={
                      reservation.profile.allergy
                        ? text.allergies[reservation.profile.allergy]
                        : text.drawer.noneRecorded
                    }
                  />
                  <DetailRow
                    label={text.drawer.bookingNote}
                    value={reservation.note ? text.notes[reservation.note] : "—"}
                  />
                </dl>
                <ReservationTags tags={reservation.tags} />
              </section>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
