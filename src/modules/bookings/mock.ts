import { type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";

import { bookingsList } from "./capabilities";
import type { BookingInput } from "./schema";

/** Mock answers for the bookings module (ADR 0005); `src/config/data.server.ts` wires them with the preset seed. */
export const bookingsMockHandlers = {
  ...mockHandler(bookingsList, (input, { data }: MockContext<{ readonly bookings: readonly BookingInput[] }>) =>
    paginate(data.bookings, input),
  ),
};
