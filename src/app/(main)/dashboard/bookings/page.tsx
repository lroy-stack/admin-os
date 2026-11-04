import { LocaleBundles } from "@/app/_components/locale-root";
import { pageMetadata } from "@/config/metadata.server";
import { getRuntime } from "@/config/runtime";
import { bookingsErrors } from "@/modules/bookings/server";
import { contactFieldsBundle, customersErrors } from "@/modules/customers/server";

import { abilitiesOf } from "./_components/abilities";
import { loadBookings } from "./_components/load-bookings.server";
import { bookingsBundle, bookingsMessages } from "./_components/messages.server";
import { Reservations } from "./_components/reservations";

export const generateMetadata = () => pageMetadata("/dashboard/bookings", bookingsMessages);

/** The panel writes bookings and, for a new contact, customers: it needs both modules' error texts. */
const errors = {
  en: { ...bookingsErrors.en, ...customersErrors.en },
  es: { ...bookingsErrors.es, ...customersErrors.es },
  de: { ...bookingsErrors.de, ...customersErrors.de },
  fr: { ...bookingsErrors.fr, ...customersErrors.fr },
};

/** `?day=YYYY-MM-DD` picks the business day; without it the screen shows the business clock's day. */
export default async function Page({ searchParams }: { searchParams: Promise<{ day?: string | string[] }> }) {
  const { day } = await searchParams;
  const [{ actor }, loaded] = await Promise.all([
    getRuntime(),
    loadBookings(typeof day === "string" ? day : undefined),
  ]);

  return (
    <LocaleBundles bundles={[bookingsBundle, contactFieldsBundle]}>
      <Reservations
        state={loaded.state}
        reason={loaded.reason}
        service={loaded.service}
        reservations={loaded.reservations}
        can={abilitiesOf(actor.permissions)}
        errors={errors}
      />
    </LocaleBundles>
  );
}
