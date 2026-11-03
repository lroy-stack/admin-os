import { LocaleBundles } from "@/app/_components/locale-root";
import { pageMetadata } from "@/config/metadata.server";

import { loadBookings } from "./_components/load-bookings.server";
import { bookingsBundle, bookingsMessages } from "./_components/messages.server";
import { Reservations } from "./_components/reservations";

export const generateMetadata = () => pageMetadata("/dashboard/bookings", bookingsMessages);

/** `?day=YYYY-MM-DD` picks the business day; without it the screen shows the business clock's day. */
export default async function Page({ searchParams }: { searchParams: Promise<{ day?: string | string[] }> }) {
  const { day } = await searchParams;
  const loaded = await loadBookings(typeof day === "string" ? day : undefined);

  return (
    <LocaleBundles bundles={[bookingsBundle]}>
      <Reservations
        state={loaded.state}
        reason={loaded.reason}
        service={loaded.service}
        reservations={loaded.reservations}
      />
    </LocaleBundles>
  );
}
