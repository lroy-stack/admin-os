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
import { StatTiles, TonePill } from "@/ds/components";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/utils";

import { type AdvanceReservation, ReservationActionButton } from "./reservation-action-button";
import {
  formatClock,
  isActive,
  isLate,
  minutesLate,
  statusLabels,
  statusTones,
  tableLabel,
} from "./reservation-status";
import { ReservationTags } from "./reservation-tags";
import type { Reservation } from "./reservations-data";

/** Fictitious contact details derived from the booking id, so the mock never shows real-looking data. */
function contactFor(reservation: Reservation) {
  const digits = reservation.id.replace(/\D/g, "").padStart(3, "0").slice(-3);
  const handle = reservation.guest
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "");
  return { phone: `+34 600 000 ${digits}`, email: `${handle}@example.invalid` };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
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

  return (
    <Drawer direction={isMobile ? "bottom" : "right"} open={reservation !== null} onOpenChange={onOpenChange}>
      <DrawerContent className="backdrop-blur-xl data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-md">
        {reservation && (
          <div className="flex min-h-0 flex-col overflow-y-auto">
            <DrawerHeader className="gap-1 px-6 pt-6">
              <DrawerTitle className="text-xl font-medium">{reservation.guest}</DrawerTitle>
              <DrawerDescription>
                {reservation.partySize} guests · {formatClock(reservation.startMin)}–{formatClock(reservation.endMin)} ·{" "}
                <span className="inline-block first-letter:uppercase">{reservation.channel}</span>
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col gap-6 px-6 pb-8">
              <div className="flex flex-wrap items-center gap-1.5">
                <TonePill tone={statusTones[reservation.status]} dot>
                  {statusLabels[reservation.status]}
                </TonePill>
                <TonePill tone="neutral">{formatClock(reservation.startMin)}</TonePill>
                {reservation.tableIds.length > 0 ? (
                  <TonePill tone="neutral">Table {tableLabel(reservation)}</TonePill>
                ) : (
                  <TonePill tone="salmon">No table yet</TonePill>
                )}
                {isLate(reservation) && <TonePill tone="salmon">+{minutesLate(reservation)}' late</TonePill>}
              </div>

              {isActive(reservation) && (
                <div className="flex items-center gap-2">
                  <ReservationActionButton reservation={reservation} onAdvance={onAdvance} emphasis="primary" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="More actions"
                        className="liquid-glass hover:bg-foreground/10 size-9 rounded-full"
                      >
                        <Ellipsis />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onSelect={() => onAdvance(reservation.id, "no_show")}>
                        Mark no-show
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => onAdvance(reservation.id, "cancelled")}>
                        Cancel reservation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <section className="flex flex-col gap-2" aria-labelledby="reservation-guest">
                <h3 id="reservation-guest" className="text-muted-foreground text-xs tracking-wide uppercase">
                  Guest
                </h3>
                <StatTiles
                  items={[
                    { label: "Visits", value: reservation.profile.visits },
                    {
                      label: "Average spend",
                      value: reservation.profile.averageSpend
                        ? formatCurrency(reservation.profile.averageSpend, { noDecimals: true })
                        : "—",
                    },
                    { label: "Last visit", value: reservation.profile.lastVisit },
                    { label: "Language", value: reservation.profile.language },
                  ]}
                />
              </section>

              <section className="flex flex-col gap-1" aria-labelledby="reservation-details">
                <h3 id="reservation-details" className="text-muted-foreground text-xs tracking-wide uppercase">
                  Details
                </h3>
                <dl className="divide-foreground/8 divide-y">
                  <DetailRow label="Phone (mock)" value={contactFor(reservation).phone} />
                  <DetailRow label="Email (mock)" value={contactFor(reservation).email} />
                  <DetailRow label="Allergies" value={reservation.profile.allergies ?? "None recorded"} />
                  <DetailRow label="Booking note" value={reservation.note ?? "—"} />
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
