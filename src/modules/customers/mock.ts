import { type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";
import { err, ok } from "@/core/result";

import {
  customersBlock,
  customersCreate,
  customersDuplicatesCheck,
  customersGet,
  customersList,
  customersNotesAdd,
  customersUnblock,
  customersUpdate,
} from "./capabilities";
import { type ContactQuery, matchedFields } from "./contact";
import type { Customer, CustomerPatch } from "./schema";

/** Writes change the session copy in place (ADR 0005), so the collection is mutable here. */
interface CustomersData {
  readonly customers: Customer[];
}

type Context = MockContext<CustomersData>;

const notFound = (id: string) => err("customers.not_found", `No customer with id ${id}`, { id });

const duplicatesOf = (customers: readonly Customer[], query: ContactQuery, exceptId?: string) =>
  customers
    .filter((customer) => customer.id !== exceptId)
    .map((customer) => ({ customer, matchedOn: matchedFields(customer, query) }))
    .filter(({ matchedOn }) => matchedOn.length > 0);

const duplicateError = (matches: ReturnType<typeof duplicatesOf>) =>
  err("customers.duplicate", "A customer with this phone or email already exists", {
    customerIds: matches.map(({ customer }) => customer.id),
    matchedOn: [...new Set(matches.flatMap(({ matchedOn }) => matchedOn))],
  });

const applyPatch = (customer: Customer, patch: CustomerPatch): Customer => {
  const { marketingConsent, ...fields } = patch;
  const defined = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
  return {
    ...customer,
    ...defined,
    ...(marketingConsent === undefined ? {} : { consent: { marketing: marketingConsent } }),
  };
};

/** Replaces the stored customer so a later read sees the change, and returns the new value. */
const replace = (data: CustomersData, next: Customer): Customer => {
  data.customers[data.customers.findIndex((customer) => customer.id === next.id)] = next;
  return next;
};

/** Mock answers for the customers module (ADR 0005); `src/config/data.server.ts` wires them with the preset seed. */
export const customersMockHandlers = {
  ...mockHandler(customersList, (input, { data }: Context) => paginate(data.customers, input)),

  ...mockHandler(customersGet, ({ id }, { data }: Context) => {
    const customer = data.customers.find((candidate) => candidate.id === id);
    return customer === undefined ? notFound(id) : ok(customer);
  }),

  ...mockHandler(customersDuplicatesCheck, (input, { data }: Context) =>
    ok({ matches: duplicatesOf(data.customers, input) }),
  ),

  ...mockHandler(customersCreate, (input, { data }: Context) => {
    const matches = duplicatesOf(data.customers, input);
    if (matches.length > 0) return duplicateError(matches);
    const customer: Customer = {
      id: `cus-${crypto.randomUUID().slice(0, 8)}`,
      name: input.name,
      ...(input.phone === undefined ? {} : { phone: input.phone }),
      ...(input.email === undefined ? {} : { email: input.email }),
      ...(input.locale === undefined ? {} : { locale: input.locale }),
      ...(input.marketingConsent === undefined ? {} : { consent: { marketing: input.marketingConsent } }),
      tags: input.tags,
      vip: false,
      blocked: false,
      notes: [],
      figures: { visits: 0, spend: null, lastVisit: null, noShows: 0 },
    };
    data.customers.push(customer);
    return ok(customer);
  }),

  ...mockHandler(customersUpdate, ({ id, patch }, { data }: Context) => {
    const customer = data.customers.find((candidate) => candidate.id === id);
    if (customer === undefined) return notFound(id);
    const matches = duplicatesOf(data.customers, patch, id);
    if (matches.length > 0) return duplicateError(matches);
    return ok(replace(data, applyPatch(customer, patch)));
  }),

  ...mockHandler(customersNotesAdd, ({ id, text }, { data, actor, clock }: Context) => {
    const customer = data.customers.find((candidate) => candidate.id === id);
    if (customer === undefined) return notFound(id);
    const note = {
      id: `note-${crypto.randomUUID().slice(0, 8)}`,
      text,
      authorId: actor.actorId,
      authorName: actor.displayName ?? actor.actorId,
      day: clock.today,
      minute: clock.nowMin,
    };
    return ok(replace(data, { ...customer, notes: [...customer.notes, note] }));
  }),

  ...mockHandler(customersBlock, ({ id, reason }, { data }: Context) => {
    const customer = data.customers.find((candidate) => candidate.id === id);
    return customer === undefined
      ? notFound(id)
      : ok(replace(data, { ...customer, blocked: true, blockReason: reason }));
  }),

  ...mockHandler(customersUnblock, ({ id }, { data }: Context) => {
    const customer = data.customers.find((candidate) => candidate.id === id);
    if (customer === undefined) return notFound(id);
    const { blockReason: _reason, ...rest } = customer;
    return ok(replace(data, { ...rest, blocked: false }));
  }),
};
