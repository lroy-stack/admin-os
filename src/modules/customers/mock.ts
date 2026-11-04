import { type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";
import { err, ok } from "@/core/result";
import { foldText } from "@/core/text";

import {
  customersBlock,
  customersContactUpdate,
  customersCreate,
  customersDuplicatesCheck,
  customersGet,
  customersList,
  customersNotesAdd,
  customersSearch,
  customersUnblock,
} from "./capabilities";
import { type ContactQuery, matchedFields, normalisePhone } from "./contact";
import type { Customer, CustomerContactUpdateInput } from "./schema";

/** Writes change the session copy in place (ADR 0005), so the collection is mutable here. */
interface CustomersData {
  readonly customers: Customer[];
}

type Context = MockContext<CustomersData>;

/** Text made only of what people type in a phone number. */
const PHONE_SHAPED = /^[\d+\s().-]+$/;

const notFound = (id: string) => err("customers.not_found", `No customer with id ${id}`, { id });

const duplicatesOf = (customers: readonly Customer[], query: ContactQuery, exceptId?: string) =>
  customers
    .filter((customer) => customer.id !== exceptId)
    .map((customer) => ({ customer, matchedOn: matchedFields(customer, query) }))
    .filter(({ matchedOn }) => matchedOn.length > 0);

/**
 * The details name the matching customers for callers that may read them (the typed client, MCP). They never reach a
 * window: `serializeCallResult` drops every detail but `paths` (privacy), so a window that must open the existing
 * record calls `customers.duplicates.check`, which `read:customers` gates.
 */
const duplicateError = (matches: ReturnType<typeof duplicatesOf>) =>
  err("customers.duplicate", "A customer with this phone or email already exists", {
    customerIds: matches.map(({ customer }) => customer.id),
    matchedOn: [...new Set(matches.flatMap(({ matchedOn }) => matchedOn))],
  });

const applyContact = (customer: Customer, change: Omit<CustomerContactUpdateInput, "id">): Customer => {
  const { phone, email, ...fields } = change;
  const defined = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
  const { phone: _phone, email: _email, ...kept } = customer;
  return {
    ...kept,
    ...(phone === null ? {} : { phone: phone ?? customer.phone }),
    ...(email === null ? {} : { email: email ?? customer.email }),
    ...defined,
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

  ...mockHandler(customersSearch, ({ text, ...page }, { data }: Context) => {
    const needle = foldText(text);
    // Only text that looks like a phone number is compared with phones, so "bravo 34" does not match every +34.
    const phoneNeedle =
      PHONE_SHAPED.test(text) && text.replace(/\D/g, "").length >= 3 ? normalisePhone(text) : undefined;
    const found = data.customers
      .filter(
        (customer) =>
          foldText(customer.name).includes(needle) ||
          (customer.email !== undefined && foldText(customer.email).includes(needle)) ||
          (phoneNeedle !== undefined &&
            customer.phone !== undefined &&
            normalisePhone(customer.phone).includes(phoneNeedle)),
      )
      .map(({ id, name, email, phone, vip, blocked }) => ({
        id,
        name,
        ...(email === undefined ? {} : { email }),
        ...(phone === undefined ? {} : { phone }),
        vip,
        blocked,
      }));
    return paginate(found, page);
  }),

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

  ...mockHandler(customersContactUpdate, ({ id, ...change }, { data }: Context) => {
    const customer = data.customers.find((candidate) => candidate.id === id);
    if (customer === undefined) return notFound(id);
    const matches = duplicatesOf(
      data.customers,
      {
        ...(change.phone ? { phone: change.phone } : {}),
        ...(change.email ? { email: change.email } : {}),
      },
      id,
    );
    if (matches.length > 0) return duplicateError(matches);
    return ok(replace(data, applyContact(customer, change)));
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
