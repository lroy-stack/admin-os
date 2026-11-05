import { type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";
import { err, ok } from "@/core/result";
import { foldText } from "@/core/text";

import { partiesCreate, partiesGet, partiesList, partiesUpdate } from "./capabilities";
import type { Party, PartyUpdateInput } from "./schema";

/** Writes change the session copy in place (ADR 0005), so the collection is mutable here. */
interface PartiesData {
  readonly parties: Party[];
}

type Context = MockContext<PartiesData>;

const matches = (party: Party, needle: string) =>
  [party.legalName, party.tradeName ?? "", party.taxId].some((field) => foldText(field).includes(needle));

const notFound = (id: string) => err("parties.not_found", `No party with id ${id}`, { id });

/** The party with the change applied: an omitted field is kept and a null one removed. */
const applyChange = (party: Party, change: Omit<PartyUpdateInput, "id">): Party => {
  const cleared = new Set(Object.keys(change).filter((field) => change[field as keyof typeof change] === null));
  const kept = Object.fromEntries(Object.entries(party).filter(([field]) => !cleared.has(field)));
  const set = Object.fromEntries(Object.entries(change).filter(([, value]) => value !== undefined && value !== null));
  return { ...kept, ...set } as Party;
};

/** Mock answers for the parties module (ADR 0005); `src/config/data.server.ts` wires them with the preset seed. */
export const partiesMockHandlers = {
  ...mockHandler(partiesList, ({ role, text, ...page }, { data }: Context) => {
    const needle = text === undefined ? undefined : foldText(text);
    const found = data.parties.filter(
      (party) => (role === undefined || party.roles.includes(role)) && (needle === undefined || matches(party, needle)),
    );
    return paginate(found, page);
  }),

  ...mockHandler(partiesGet, ({ id }, { data }: Context) => {
    const party = data.parties.find((candidate) => candidate.id === id);
    return party === undefined ? notFound(id) : ok(party);
  }),

  ...mockHandler(partiesCreate, (input, { data }: Context) => {
    const party: Party = { id: `party-${crypto.randomUUID().slice(0, 8)}`, ...input };
    data.parties.push(party);
    return ok(party);
  }),

  ...mockHandler(partiesUpdate, ({ id, ...change }, { data }: Context) => {
    const index = data.parties.findIndex((candidate) => candidate.id === id);
    const party = data.parties[index];
    if (party === undefined) return notFound(id);
    const next = applyChange(party, change);
    data.parties[index] = next;
    return ok(next);
  }),
};
