import { type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";
import { err, ok } from "@/core/result";
import { foldText } from "@/core/text";

import { partiesGet, partiesList } from "./capabilities";
import type { Party } from "./schema";

interface PartiesData {
  readonly parties: Party[];
}

type Context = MockContext<PartiesData>;

const matches = (party: Party, needle: string) =>
  [party.legalName, party.tradeName ?? "", party.taxId].some((field) => foldText(field).includes(needle));

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
    return party === undefined ? err("parties.not_found", `No party with id ${id}`, { id }) : ok(party);
  }),
};
