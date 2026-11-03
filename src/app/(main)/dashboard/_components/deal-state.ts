import { CRM_AS_OF, type Deal, type OpenStage, type TeamMemberId } from "@/data/crm";
import type { OpenDeal } from "@/lib/crm";

/** What a person can write on a deal in the Deals windows. */
export interface DealFields {
  readonly title: string;
  readonly customerId: string;
  readonly stage: OpenStage;
  readonly value: number;
  /** ISO date, `YYYY-MM-DD`. */
  readonly closeDate: string;
  readonly ownerIds: TeamMemberId[];
}

export type DealOutcome = "won" | "lost";

/** What the session did to one deal. Absent means untouched; `restoreEntry` puts a previous one back (undo). */
export interface DealEntry {
  readonly patch?: Partial<DealFields>;
  readonly outcome?: DealOutcome;
  readonly removed?: true;
}

/**
 * The deals of a session on demo-local state (ADR 0015: a showcase screen keeps demo-local state). It holds only what
 * the session changed, on top of the deals each screen is given, so a language change still re-localizes the demo
 * titles the session did not touch.
 */
export interface DealsState {
  readonly created: readonly OpenDeal[];
  readonly entries: Readonly<Record<string, DealEntry>>;
}

export const EMPTY_DEALS_STATE: DealsState = { created: [], entries: {} };

/** The day a deal marked won or lost closes on: the demo's "today". */
export const CLOSED_ON = CRM_AS_OF;

export function entryOf(state: DealsState, id: string): DealEntry | undefined {
  return state.entries[id];
}

function withEntry(state: DealsState, id: string, entry: DealEntry | undefined): DealsState {
  const { [id]: _previous, ...rest } = state.entries;
  return { ...state, entries: entry === undefined ? rest : { ...rest, [id]: entry } };
}

/** Adds a deal to the end of the session's new deals; its id is unique within the session. */
export function createDeal(state: DealsState, fields: DealFields): { state: DealsState; deal: OpenDeal } {
  const deal: OpenDeal = {
    id: `session-${state.created.length + 1}`,
    title: fields.title,
    customerId: fields.customerId,
    stage: fields.stage,
    value: fields.value,
    closeDate: fields.closeDate,
    ownerIds: [...fields.ownerIds],
  };
  return { state: { ...state, created: [...state.created, deal] }, deal };
}

export function editDeal(state: DealsState, id: string, fields: DealFields): DealsState {
  return withEntry(state, id, { ...entryOf(state, id), patch: { ...fields, ownerIds: [...fields.ownerIds] } });
}

export function moveDeal(state: DealsState, id: string, stage: OpenStage): DealsState {
  const current = entryOf(state, id);
  return withEntry(state, id, { ...current, patch: { ...current?.patch, stage } });
}

/** Closes a deal as won or lost: it leaves the open pipeline and counts in that outcome. */
export function closeDeal(state: DealsState, id: string, outcome: DealOutcome): DealsState {
  return withEntry(state, id, { ...entryOf(state, id), outcome });
}

export function removeDeal(state: DealsState, id: string): DealsState {
  return withEntry(state, id, { ...entryOf(state, id), removed: true });
}

/** Undo: puts back what `entryOf` returned before the action (`undefined` clears the deal's entry). */
export function restoreEntry(state: DealsState, id: string, entry: DealEntry | undefined): DealsState {
  return withEntry(state, id, entry);
}

/** The deal with the session's edits on top. */
export function applyPatch<D extends OpenDeal>(deal: D, entry: DealEntry | undefined): D {
  return entry?.patch ? { ...deal, ...entry.patch, ownerIds: [...(entry.patch.ownerIds ?? deal.ownerIds)] } : deal;
}

/** The deal as the screen shows it, or `null` once it was deleted or closed. */
export function resolveDeal<D extends OpenDeal>(deal: D, state: DealsState): D | null {
  const entry = entryOf(state, deal.id);
  if (entry?.removed || entry?.outcome) return null;
  return applyPatch(deal, entry);
}

export interface ResolvedDeals {
  readonly open: OpenDeal[];
  readonly won: Deal[];
  readonly lost: Deal[];
}

/**
 * Splits `base` (plus, when `withCreated`, the deals created in the session) into the open ones, with their edits, and
 * the ones the session closed. Deleted deals appear nowhere.
 */
export function resolveDeals(base: readonly OpenDeal[], state: DealsState, withCreated: boolean): ResolvedDeals {
  const result: { open: OpenDeal[]; won: Deal[]; lost: Deal[] } = { open: [], won: [], lost: [] };
  for (const deal of withCreated ? [...base, ...state.created] : base) {
    const entry = entryOf(state, deal.id);
    if (entry?.removed) continue;
    const edited = applyPatch(deal, entry);
    if (entry?.outcome === "won") result.won.push({ ...edited, stage: "won", closeDate: CLOSED_ON });
    else if (entry?.outcome === "lost") result.lost.push({ ...edited, stage: "lost", closeDate: CLOSED_ON });
    else result.open.push(edited);
  }
  return result;
}

export interface OutcomeTotals {
  readonly count: number;
  readonly value: number;
}

/** The month's won or lost figures plus the deals the session closed. */
export function addOutcome(base: OutcomeTotals, closed: readonly Deal[]): OutcomeTotals {
  return { count: base.count + closed.length, value: base.value + closed.reduce((sum, deal) => sum + deal.value, 0) };
}
