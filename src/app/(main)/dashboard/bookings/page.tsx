import { LocaleBundles } from "@/app/_components/locale-root";
import { pageMetadata } from "@/config/metadata.server";

import { bookingsBundle, bookingsMessages } from "./_components/messages.server";
import { Reservations } from "./_components/reservations";

export const generateMetadata = () => pageMetadata("/dashboard/bookings", bookingsMessages);

export default function Page() {
  return (
    <LocaleBundles bundles={[bookingsBundle]}>
      <Reservations />
    </LocaleBundles>
  );
}
