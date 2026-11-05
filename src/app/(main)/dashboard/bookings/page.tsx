import { LocaleBundles } from "@/app/_components/locale-root";
import { pageMetadata } from "@/config/metadata.server";
import { getRuntime } from "@/config/runtime";
import { bookingsErrors } from "@/modules/bookings/server";

import { abilitiesOf } from "./_components/abilities";
import { BOOKING_SLOTS } from "./_components/guest-slots";
import { reservationSlotsFilled, slotBundleOf, slotErrorsOf } from "./_components/guest-slots.server";
import { loadBookings } from "./_components/load-bookings.server";
import { bookingsBundle, bookingsMessages } from "./_components/messages.server";
import { Reservations } from "./_components/reservations";

export const generateMetadata = () => pageMetadata("/dashboard/bookings", bookingsMessages);

/** The panel writes bookings and, for a new contact, through the module that fills the slot: it needs both error texts. */
const filler = slotErrorsOf(BOOKING_SLOTS.contactFields);
const errors = {
  en: { ...bookingsErrors.en, ...filler?.en },
  es: { ...bookingsErrors.es, ...filler?.es },
  de: { ...bookingsErrors.de, ...filler?.de },
  fr: { ...bookingsErrors.fr, ...filler?.fr },
};

/** `?day=YYYY-MM-DD` picks the business day; without it the screen shows the business clock's day. */
export default async function Page({ searchParams }: { searchParams: Promise<{ day?: string | string[] }> }) {
  const { day } = await searchParams;
  const [{ actor }, loaded] = await Promise.all([
    getRuntime(),
    loadBookings(typeof day === "string" ? day : undefined),
  ]);

  const contactBundle = slotBundleOf(BOOKING_SLOTS.contactFields);
  const contactBundles = contactBundle === undefined ? [] : [contactBundle];

  return (
    <LocaleBundles bundles={[bookingsBundle, ...contactBundles]}>
      <Reservations
        state={loaded.state}
        reason={loaded.reason}
        service={loaded.service}
        reservations={loaded.reservations}
        can={abilitiesOf(actor.permissions, reservationSlotsFilled())}
        errors={errors}
      />
    </LocaleBundles>
  );
}
