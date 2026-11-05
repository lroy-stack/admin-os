import { type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";
import { err, ok, type Result } from "@/core/result";
import { foldText } from "@/core/text";

import {
  bookingsAvailabilityGet,
  bookingsCancel,
  bookingsCreate,
  bookingsGet,
  bookingsList,
  bookingsNoShowMark,
  bookingsReschedule,
  bookingsSearch,
  bookingsStaffNoteAdd,
  bookingsStatusAdvance,
  bookingsStatusUndo,
  bookingsTableAssign,
  bookingsWalkInSeat,
  bookingsWalkInUndo,
} from "./capabilities";
import {
  CANCELLABLE_STATUSES,
  isActive,
  NEXT_STATUS,
  overlaps,
  type Span,
  seatsOf,
  serviceMinute,
  slotStarts,
  stayEnd,
} from "./rules";
import { type Availability, type BookingChange, type BookingInput, type ClockReading, STAFF_NOTE_MAX } from "./schema";
import { lateAfterMinutes, serviceWindow, slotMinutes, walkInStayMinutes, walkInUndoSeconds } from "./settings";

/**
 * Writes change the session copy in place (ADR 0005), so the bookings are mutable here. The resources and the
 * customers are read only: bookings never writes to another module. A new guest is created with `customers.create`
 * first and booked by its id.
 */
interface BookingsData {
  readonly bookings: BookingInput[];
  /** The resource fields bookings reads; the rows are resources' own (ADR 0017 §2). */
  readonly resources: readonly { readonly id: string; readonly capacity?: number; readonly active: boolean }[];
  readonly customers: readonly { readonly id: string; readonly name: string }[];
}

type Context = MockContext<BookingsData>;

const notFound = (kind: "booking" | "resource" | "customer", ids: readonly string[]) =>
  err("bookings.not_found", `No ${kind} with id ${ids.join(", ")}`, { kind, ids });

const invalidTransition = (from: string, to: string) =>
  err("bookings.invalid_transition", `A ${from} booking cannot become ${to}`, { from, to });

const LEAVES_THE_FLOW: readonly string[] = ["cancelled", "no_show"];

const bookingOf = (data: BookingsData, id: string) => data.bookings.find((booking) => booking.id === id);

/** Replaces the stored booking so a later read sees the change, and returns the new value. */
const replace = (data: BookingsData, next: BookingInput): BookingInput => {
  data.bookings[data.bookings.findIndex((booking) => booking.id === next.id)] = next;
  return next;
};

/** The resource ids another open booking of the day holds during `span`. */
const busyResourceIds = (data: BookingsData, businessDay: string, span: Span, exceptId?: string): Set<string> =>
  new Set(
    data.bookings
      .filter((booking) => booking.id !== exceptId && booking.businessDay === businessDay && isActive(booking.status))
      .filter((booking) => overlaps(booking, span))
      .flatMap((booking) => booking.resourceIds),
  );

interface Placement extends Span {
  readonly businessDay: string;
  readonly partySize: number;
  readonly resourceIds: readonly string[];
  readonly exceptId?: string;
}

/**
 * The rules every booking placement obeys: the resources exist and are active, their capacities together seat the
 * party, and no other open booking of the day holds one of them during the stay. Without resources the booking is
 * unassigned and nothing is checked.
 */
function placementError(data: BookingsData, placement: Placement): Result<never> | undefined {
  const { resourceIds, partySize } = placement;
  const resources = resourceIds.flatMap((id) => data.resources.filter((resource) => resource.id === id));
  const unknown = resourceIds.filter((id) => !resources.some((resource) => resource.id === id));
  if (unknown.length > 0) return notFound("resource", unknown);

  const inactive = resources.filter((resource) => !resource.active).map((resource) => resource.id);
  if (inactive.length > 0) {
    return err("bookings.resource_inactive", `Resource ${inactive.join(", ")} is not in use`, {
      resourceIds: inactive,
    });
  }

  const seats = resources.reduce((total, resource) => total + seatsOf(resource), 0);
  if (resources.length > 0 && seats < partySize) {
    return err("bookings.not_enough_seats", `${seats} seats cannot hold a party of ${partySize}`, { seats, partySize });
  }

  const busy = busyResourceIds(data, placement.businessDay, placement, placement.exceptId);
  const taken = resourceIds.filter((id) => busy.has(id));
  return taken.length > 0
    ? err("bookings.resource_busy", `Resource ${taken.join(", ")} is booked for that time`, { resourceIds: taken })
    : undefined;
}

/** Whether a stay of `businessDay` starting at `startMin` begins before the clock: on an earlier day, or earlier today. */
const hasStarted = ({ clock }: Context, businessDay: string, startMin: number): boolean =>
  businessDay === clock.businessDay ? startMin < serviceMinute(clock) : businessDay < clock.businessDay;

/** A start time must lie inside the service window, on the slot grid and not before the clock. */
function startTimeError(context: Context, businessDay: string, startMin: number): Result<never> | undefined {
  const window = context.settings.get(serviceWindow);
  if (startMin < window.startMin || startMin >= window.endMin) {
    return err("bookings.outside_window", `${startMin} is outside the service window`, { startMin, window });
  }
  const slot = context.settings.get(slotMinutes);
  if (startMin % slot !== 0) {
    return err("bookings.off_grid", `${startMin} is not on the ${slot}-minute grid`, { startMin, slotMinutes: slot });
  }
  if (!hasStarted(context, businessDay, startMin)) return undefined;
  const now = { day: context.clock.businessDay, minute: serviceMinute(context.clock) };
  return err(
    "bookings.start_passed",
    `${startMin} on ${businessDay} has already passed; the clock is at minute ${now.minute} of business day ${now.day}, counted from that day's midnight`,
    { businessDay, startMin, now },
  );
}

const newId = () => `bk-${crypto.randomUUID().slice(0, 8)}`;

const closedError = (booking: BookingInput) =>
  err("bookings.closed", `A ${booking.status} booking can no longer be changed`, { status: booking.status });

/** Moves an open booking: the start, the party size or the resources it holds, under the rules of a new placement. */
function moveBooking(context: Context, id: string, change: BookingChange): Result<BookingInput> {
  const { data } = context;
  const booking = bookingOf(data, id);
  if (booking === undefined) return notFound("booking", [id]);
  if (!isActive(booking.status)) return closedError(booking);
  const { startMin: newStart, partySize, resourceIds } = change;
  const startMin = newStart ?? booking.startMin;
  const endMin = newStart === undefined ? booking.endMin : stayEnd(startMin, booking.endMin - booking.startMin);
  // Only a start that moves is checked again: a booking that has begun keeps its own, and a repeated move still lands.
  if (newStart !== undefined && newStart !== booking.startMin) {
    const timeError = startTimeError(context, booking.businessDay, newStart);
    if (timeError) return timeError;
  }
  const placeError = placementError(data, {
    businessDay: booking.businessDay,
    startMin,
    endMin,
    partySize: partySize ?? booking.partySize ?? 1,
    resourceIds: resourceIds ?? booking.resourceIds,
    exceptId: id,
  });
  if (placeError) return placeError;
  return ok(
    replace(data, {
      ...booking,
      ...(newStart === undefined ? {} : { startMin, endMin }),
      ...(partySize === undefined ? {} : { partySize }),
      ...(resourceIds === undefined ? {} : { resourceIds }),
    }),
  );
}

/** The text a search looks in: the booking id, who booked and the tags. Notes are never searched. */
const searchableText = (data: BookingsData, booking: BookingInput): string =>
  foldText(
    [
      booking.id,
      booking.contactName,
      data.customers.find((customer) => customer.id === booking.customerId)?.name,
      ...booking.tags,
    ]
      .filter((part) => part !== undefined)
      .join("\n"),
  );

/** Whether a booking of `businessDay` starting at `startMin` counts as late on the clock. */
const isLate = (context: Context, booking: BookingInput): boolean => {
  const { clock, settings } = context;
  if (booking.businessDay !== clock.businessDay) return booking.businessDay < clock.businessDay;
  return serviceMinute(clock) >= booking.startMin + settings.get(lateAfterMinutes);
};

/**
 * Whether the undo window that opened at `since` has closed. The clock counts whole minutes, so true elapsed time is
 * within a minute of the difference: judge by the lower bound, so an undo inside the window is never refused and one
 * a minute or more past it always is. A moment on another business day, or none recorded, is always past.
 */
const undoWindowPassed = ({ clock, settings }: Context, since: ClockReading | undefined): boolean => {
  const elapsedMin = since?.day === clock.businessDay ? serviceMinute(clock) - since.minute : Number.POSITIVE_INFINITY;
  return (elapsedMin - 1) * 60 >= settings.get(walkInUndoSeconds);
};

/** Mock answers for the bookings module (ADR 0005); `src/config/data.server.ts` wires them with the preset seed. */
export const bookingsMockHandlers = {
  ...mockHandler(bookingsList, (input, { data, clock }: Context) =>
    paginate(
      data.bookings.filter((booking) => booking.businessDay === (input.businessDay ?? clock.businessDay)),
      input,
    ),
  ),

  ...mockHandler(bookingsGet, ({ id }, { data }: Context) => {
    const booking = bookingOf(data, id);
    return booking === undefined ? notFound("booking", [id]) : ok(booking);
  }),

  ...mockHandler(bookingsSearch, ({ customerId, from, to, text, ...page }, { data }: Context) => {
    const needle = text === undefined ? undefined : foldText(text);
    const found = data.bookings
      .filter((booking) => customerId === undefined || booking.customerId === customerId)
      .filter((booking) => from === undefined || booking.businessDay >= from)
      .filter((booking) => to === undefined || booking.businessDay <= to)
      .filter((booking) => needle === undefined || searchableText(data, booking).includes(needle))
      .sort(
        (a, b) => a.businessDay.localeCompare(b.businessDay) || a.startMin - b.startMin || a.id.localeCompare(b.id),
      );
    return paginate(
      found.map(({ id, businessDay, startMin, partySize, status, customerId, contactName, resourceIds, tags }) => ({
        id,
        businessDay,
        startMin,
        partySize,
        status,
        ...(customerId === undefined ? {} : { customerId }),
        ...(contactName === undefined ? {} : { contactName }),
        resourceIds,
        tags,
      })),
      page,
    );
  }),

  /**
   * Offers the starts still ahead of the clock (none on an earlier day), the ones `bookings.create` accepts, and single
   * resources only: each free resource that seats the whole party. `bookings.create` also accepts several resources
   * whose capacities add up to the party (joined tables); proposing those combinations is left to the caller until a
   * preset needs it.
   */
  ...mockHandler(bookingsAvailabilityGet, ({ businessDay, partySize }, context: Context): Result<Availability> => {
    const { data, settings } = context;
    const stay = settings.get(walkInStayMinutes);
    const fits = data.resources.filter((resource) => resource.active && seatsOf(resource) >= partySize);
    const ahead = slotStarts(settings.get(serviceWindow), settings.get(slotMinutes)).filter(
      (startMin) => !hasStarted(context, businessDay, startMin),
    );
    const slots = ahead.map((startMin) => {
      const endMin = stayEnd(startMin, stay);
      const busy = busyResourceIds(data, businessDay, { startMin, endMin });
      return { startMin, endMin, resourceIds: fits.filter((resource) => !busy.has(resource.id)).map(({ id }) => id) };
    });
    return ok({ businessDay, partySize, slots });
  }),

  ...mockHandler(bookingsCreate, (input, context: Context) => {
    const { data, settings, clock } = context;
    if (input.customerId !== undefined && !data.customers.some((customer) => customer.id === input.customerId)) {
      return notFound("customer", [input.customerId]);
    }
    const timeError = startTimeError(context, input.businessDay, input.startMin);
    if (timeError) return timeError;
    // A reservation carries no length of its own: it stays as long as a walk-in party is expected to.
    const endMin = stayEnd(input.startMin, settings.get(walkInStayMinutes));
    const placeError = placementError(data, { ...input, endMin });
    if (placeError) return placeError;

    const booking: BookingInput = {
      id: newId(),
      status: "confirmed",
      businessDay: input.businessDay,
      startMin: input.startMin,
      endMin,
      resourceIds: input.resourceIds,
      staffIds: [],
      ...(input.customerId === undefined ? {} : { customerId: input.customerId }),
      ...(input.contactName === undefined ? {} : { contactName: input.contactName }),
      partySize: input.partySize,
      lines: [],
      origin: "staff",
      channel: input.channel,
      ...(input.guestNote === undefined ? {} : { guestNote: input.guestNote }),
      tags: input.tags,
      createdAt: { day: clock.businessDay, minute: serviceMinute(clock) },
    };
    data.bookings.push(booking);
    return ok(booking);
  }),

  ...mockHandler(bookingsReschedule, ({ id, ...change }, context: Context) => moveBooking(context, id, change)),

  ...mockHandler(bookingsTableAssign, ({ id, resourceIds }, context: Context) =>
    moveBooking(context, id, { resourceIds }),
  ),

  ...mockHandler(bookingsStaffNoteAdd, ({ id, text }, { data }: Context) => {
    const booking = bookingOf(data, id);
    if (booking === undefined) return notFound("booking", [id]);
    if (!isActive(booking.status)) return closedError(booking);
    const staffNote = booking.staffNote ? `${booking.staffNote}\n${text}` : text;
    if (staffNote.length > STAFF_NOTE_MAX) {
      return err("bookings.staff_note_full", `The staff note would pass ${STAFF_NOTE_MAX} characters`, {
        max: STAFF_NOTE_MAX,
        length: staffNote.length,
      });
    }
    return ok(replace(data, { ...booking, staffNote }));
  }),

  ...mockHandler(bookingsStatusAdvance, ({ id, to }, { data, clock }: Context) => {
    const booking = bookingOf(data, id);
    if (booking === undefined) return notFound("booking", [id]);
    // A retry of a step that already landed answers the booking as it is; cancel and no-show have their own capabilities.
    if (booking.status === to && !LEAVES_THE_FLOW.includes(to)) return ok(booking);
    return NEXT_STATUS[booking.status] === to
      ? ok(
          replace(data, {
            ...booking,
            status: to,
            lastStep: { from: booking.status, at: { day: clock.businessDay, minute: serviceMinute(clock) } },
          }),
        )
      : invalidTransition(booking.status, to);
  }),

  ...mockHandler(bookingsStatusUndo, ({ id }, context: Context) => {
    const { data } = context;
    const booking = bookingOf(data, id);
    if (booking === undefined) return notFound("booking", [id]);
    const { lastStep, ...rest } = booking;
    // Only the step that left the booking where it is can be taken back: a cancel or a no-show since breaks the chain.
    if (lastStep === undefined || NEXT_STATUS[lastStep.from] !== booking.status) {
      return invalidTransition(booking.status, "its previous status");
    }
    if (undoWindowPassed(context, lastStep.at)) {
      return err("bookings.status_undo_expired", "The undo window for this step has passed", { id });
    }
    return ok(replace(data, { ...rest, status: lastStep.from }));
  }),

  ...mockHandler(bookingsCancel, ({ id, reason }, { data }: Context) => {
    const booking = bookingOf(data, id);
    if (booking === undefined) return notFound("booking", [id]);
    if (booking.status === "cancelled") return ok(booking);
    if (!CANCELLABLE_STATUSES.includes(booking.status)) return invalidTransition(booking.status, "cancelled");
    return ok(replace(data, { ...booking, status: "cancelled", cancelReason: reason, resourceIds: [] }));
  }),

  ...mockHandler(bookingsNoShowMark, ({ id, reason }, context: Context) => {
    const { data } = context;
    const booking = bookingOf(data, id);
    if (booking === undefined) return notFound("booking", [id]);
    if (booking.status === "no_show") return ok(booking);
    if (booking.status !== "confirmed") return invalidTransition(booking.status, "no_show");
    if (!isLate(context, booking)) {
      return err("bookings.too_early", "The booking has not started long enough ago to be a no-show", {
        startMin: booking.startMin,
      });
    }
    // Hook for the customer's no-show count (`figures.noShows`): bookings never writes to customers, so whichever
    // flow marks the no-show follows up with a customers capability once one exists, using `customerId` below.
    return ok(
      replace(data, {
        ...booking,
        status: "no_show",
        resourceIds: [],
        ...(reason === undefined ? {} : { noShowReason: reason }),
      }),
    );
  }),

  ...mockHandler(bookingsWalkInSeat, (input, context: Context) => {
    const { data, clock, settings } = context;
    const startMin = serviceMinute(clock);
    if (startMin >= 1440) {
      return err("bookings.outside_window", "The business day has ended", { startMin });
    }
    const endMin = stayEnd(startMin, settings.get(walkInStayMinutes));
    const placeError = placementError(data, {
      businessDay: clock.businessDay,
      startMin,
      endMin,
      partySize: input.partySize,
      resourceIds: input.resourceIds,
    });
    if (placeError) return placeError;

    const booking: BookingInput = {
      id: newId(),
      status: "in_progress",
      businessDay: clock.businessDay,
      startMin,
      endMin,
      resourceIds: input.resourceIds,
      staffIds: [],
      ...(input.contactName === undefined ? {} : { contactName: input.contactName }),
      partySize: input.partySize,
      lines: [],
      origin: "walk_in",
      channel: "in_person",
      tags: [],
      createdAt: { day: clock.businessDay, minute: startMin },
    };
    data.bookings.push(booking);
    return ok(booking);
  }),

  ...mockHandler(bookingsWalkInUndo, ({ id }, context: Context) => {
    const { data } = context;
    const booking = bookingOf(data, id);
    if (booking === undefined) return notFound("booking", [id]);
    if (booking.origin !== "walk_in") return err("bookings.not_walk_in", "Only a walk-in can be undone", { id });
    if (booking.status !== "in_progress") return invalidTransition(booking.status, "removed");
    if (undoWindowPassed(context, booking.createdAt)) {
      return err("bookings.undo_expired", "The undo window for this walk-in has passed", { id });
    }
    data.bookings.splice(
      data.bookings.findIndex((candidate) => candidate.id === id),
      1,
    );
    return ok({ id });
  }),
};
