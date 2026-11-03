import { bookingSchema } from "@/modules/bookings";
import { hospitalityClock, hospitalitySeed } from "@/verticals/hospitality/server";

import { toReservations } from "./view-model";

const day = hospitalityClock.businessDay;

/** Tonight's seeded service seen through the view model, for the floor and rail tests (seed: 8:40 PM, Oct 31). */
export const serviceReservations = toReservations(
  hospitalitySeed.bookings
    .filter((booking) => booking.businessDay === day)
    .map((booking) => bookingSchema.parse(booking)),
  {
    today: day,
    customers: new Map(hospitalitySeed.customers.map((customer) => [customer.id, customer])),
    resourceLabels: new Map(hospitalitySeed.resources.map((resource) => [resource.id, resource.label])),
  },
);
