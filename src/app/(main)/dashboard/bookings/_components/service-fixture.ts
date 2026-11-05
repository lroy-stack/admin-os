import { bookingSchema } from "@/modules/bookings";
import { hospitalityClock, hospitalitySeed } from "@/verticals/hospitality/server";

import { type GuestRecord, toReservations } from "./view-model";

const day = hospitalityClock.businessDay;

/** The preset's customers, none when it has no customers module (ADR 0017 §6): the rows are the guest records the screen reads. */
const { customers: seededCustomers = [] } = hospitalitySeed as { customers?: readonly GuestRecord[] };

/** Tonight's seeded service seen through the view model, for the floor and rail tests (seed: 8:40 PM, Oct 31). */
export const serviceReservations = toReservations(
  hospitalitySeed.bookings
    .filter((booking) => booking.businessDay === day)
    .map((booking) => bookingSchema.parse(booking)),
  {
    today: day,
    customers: new Map(seededCustomers.map((customer) => [customer.id, customer])),
    resourceLabels: new Map(hospitalitySeed.resources.map((resource) => [resource.id, resource.label])),
  },
);
