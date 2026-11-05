import { z } from "zod";

import { defineCapability } from "@/core/capability";
import { pageInput, pageOutput } from "@/core/pagination";

import {
  customerBlockInput,
  customerContactUpdateInput,
  customerCreateInput,
  customerNoteAddInput,
  customerSchema,
  customerSearchInput,
  customerSummarySchema,
} from "./schema";

const idInput = z.strictObject({ id: z.string().min(1) });

export const customersList = defineCapability({
  id: "customers.list",
  summary: "List customers, one page at a time.",
  input: pageInput({ defaultLimit: 50, maxLimit: 200 }),
  output: pageOutput(customerSchema),
  permission: "read:customers",
  effect: "read",
  riskTier: 1,
});

export const customersGet = defineCapability({
  id: "customers.get",
  summary: "Get one customer by id. Fails with customers.not_found when there is none.",
  input: idInput,
  output: customerSchema,
  permission: "read:customers",
  effect: "read",
  riskTier: 1,
});

export const customersSearch = defineCapability({
  id: "customers.search",
  summary:
    "Find customers by text in their name, phone or email, one page of at most 50 at a time. Returns concise rows (id, name, phone, email, vip, blocked) without notes or consent; use customers.get for the whole record. Phones match after dropping spaces, dashes, dots and parentheses.",
  input: customerSearchInput,
  output: pageOutput(customerSummarySchema),
  permission: "read:customers",
  effect: "read",
  riskTier: 1,
});

/** Which contact detail made a customer match. */
export const duplicateMatchSchema = z.object({
  customer: customerSchema,
  matchedOn: z.array(z.enum(["phone", "email"])).min(1),
});

export const customersDuplicatesCheck = defineCapability({
  id: "customers.duplicates.check",
  summary:
    "Find existing customers with the same phone or the same email. Phones are compared after dropping spaces, dashes, dots and parentheses and reading a leading 00 as +; national formats are not guessed, so send E.164 (+34600000101). Emails are compared case-insensitively. Use it before customers.create.",
  input: z.strictObject({ phone: z.string().min(1).optional(), email: z.string().min(1).optional() }),
  output: z.strictObject({ matches: z.array(duplicateMatchSchema) }),
  permission: "read:customers",
  effect: "read",
  riskTier: 1,
});

export const customersCreate = defineCapability({
  id: "customers.create",
  summary:
    "Create a customer. Phone must be E.164 (+34600000101). Fails with customers.duplicate when a customer already has that phone or email.",
  input: customerCreateInput,
  output: customerSchema,
  permission: "create:customers",
  effect: "write",
  riskTier: 2,
  change: "add",
  idempotency: "key",
  requiresIdempotencyKey: true,
});

export const customersContactUpdate = defineCapability({
  id: "customers.contact.update",
  summary:
    "Change a customer's contact data: name, phone, email or locale. Omitted fields stay as they are and a null phone or email clears it. Phone must be E.164 (+34600000101). Consent, VIP and tags are not changed here. Fails with customers.duplicate when the new phone or email belongs to another customer and customers.not_found for an unknown id.",
  input: customerContactUpdateInput,
  output: customerSchema,
  permission: "update:customers",
  effect: "write",
  riskTier: 2,
  change: "overwrite",
  idempotency: "target-state",
});

export const customersNotesAdd = defineCapability({
  id: "customers.notes.add",
  summary: "Add a dated note to a customer, signed by the acting staff member.",
  input: customerNoteAddInput,
  output: customerSchema,
  permission: "update:customers",
  effect: "write",
  riskTier: 2,
  change: "add",
  idempotency: "key",
  requiresIdempotencyKey: true,
});

export const customersBlock = defineCapability({
  id: "customers.block",
  summary: "Block a customer from new bookings, with the reason staff will see.",
  input: customerBlockInput,
  output: customerSchema,
  permission: "block:customers",
  effect: "write",
  riskTier: 2,
  change: "overwrite",
  idempotency: "target-state",
});

export const customersUnblock = defineCapability({
  id: "customers.unblock",
  summary: "Lift the block on a customer and clear its reason.",
  input: idInput,
  output: customerSchema,
  permission: "block:customers",
  effect: "write",
  riskTier: 2,
  change: "overwrite",
  idempotency: "target-state",
});

export const customersCapabilities = {
  "customers.list": customersList,
  "customers.get": customersGet,
  "customers.search": customersSearch,
  "customers.duplicates.check": customersDuplicatesCheck,
  "customers.create": customersCreate,
  "customers.contact.update": customersContactUpdate,
  "customers.notes.add": customersNotesAdd,
  "customers.block": customersBlock,
  "customers.unblock": customersUnblock,
} as const;
