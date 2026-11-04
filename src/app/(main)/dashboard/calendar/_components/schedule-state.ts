export const eventCalendars = ["work", "personal", "team", "focus"] as const;

export type EventCalendar = (typeof eventCalendars)[number];

/** What a person can write on an event in the Schedule windows. `end` of an all-day event is exclusive, as in FullCalendar. */
export interface EventFields {
  readonly title: string;
  readonly start: Date;
  readonly end?: Date;
  readonly allDay: boolean;
  readonly calendar: EventCalendar;
  readonly location: string;
  readonly notes: string;
}

/** An event of the schedule: the fields plus what the demo data carries. */
export interface ScheduleEvent extends Omit<EventFields, "location" | "notes" | "allDay"> {
  readonly id: string;
  readonly allDay?: boolean;
  readonly location?: string;
  readonly notes?: string;
  readonly groupId?: string;
  /** A background event (a focus block) is shaded behind the others and has no record of its own. */
  readonly display?: "background";
}

export type EventPatch = Partial<EventFields>;

/**
 * The events of a session on demo-local state (ADR 0015: a showcase screen keeps demo-local state). It holds only what
 * the session changed, on top of the demo events the calendar builds, so a language change still re-localizes the demo
 * titles the session did not touch. A reload starts over.
 */
export interface ScheduleState {
  readonly created: readonly ScheduleEvent[];
  readonly patches: Readonly<Record<string, EventPatch>>;
  readonly removed: readonly string[];
}

export const EMPTY_SCHEDULE_STATE: ScheduleState = { created: [], patches: {}, removed: [] };

/** The events as the calendar shows them: new ones appended, edits applied, deleted ones gone. */
export function resolveEvents(base: readonly ScheduleEvent[], state: ScheduleState): ScheduleEvent[] {
  return [...base, ...state.created]
    .filter((event) => !state.removed.includes(event.id))
    .map((event) => ({ ...event, ...state.patches[event.id] }));
}

/** Adds an event; its id is unique within the session. */
export function createEvent(state: ScheduleState, fields: EventFields): { state: ScheduleState; event: ScheduleEvent } {
  const event: ScheduleEvent = { ...fields, id: `new-${state.created.length + 1}` };
  return { state: { ...state, created: [...state.created, event] }, event };
}

export function editEvent(state: ScheduleState, id: string, fields: EventFields): ScheduleState {
  return { ...state, patches: { ...state.patches, [id]: { ...state.patches[id], ...fields } } };
}

/** Reschedules an event (a drag): only its dates change. */
export function moveEvent(
  state: ScheduleState,
  id: string,
  when: Pick<EventFields, "start" | "end" | "allDay">,
): ScheduleState {
  return { ...state, patches: { ...state.patches, [id]: { ...state.patches[id], ...when } } };
}

export function removeEvent(state: ScheduleState, id: string): ScheduleState {
  return state.removed.includes(id) ? state : { ...state, removed: [...state.removed, id] };
}

/** Undo of `removeEvent`. */
export function restoreEvent(state: ScheduleState, id: string): ScheduleState {
  return { ...state, removed: state.removed.filter((entry) => entry !== id) };
}

/** Undo of `editEvent` and `moveEvent`: puts back the patch the event had (`undefined` clears it). */
export function restorePatch(state: ScheduleState, id: string, patch: EventPatch | undefined): ScheduleState {
  const { [id]: _current, ...rest } = state.patches;
  return { ...state, patches: patch ? { ...rest, [id]: patch } : rest };
}

/** The events of one calendar, or all of them. */
export function inCalendar<E extends { calendar: EventCalendar }>(
  events: readonly E[],
  calendar: EventCalendar | "all",
): E[] {
  return calendar === "all" ? [...events] : events.filter((event) => event.calendar === calendar);
}
