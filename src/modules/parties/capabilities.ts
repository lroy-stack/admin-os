import { z } from "zod";

import { defineCapability } from "@/core/capability";
import { pageOutput } from "@/core/pagination";

import { partyCreateInput, partyListInput, partySchema, partyUpdateInput } from "./schema";

export const partiesList = defineCapability({
  id: "parties.list",
  summary:
    "List the fiscal directory (clients and suppliers), one page at a time. Filter by role and search by text in the legal name, trade name or tax ID.",
  input: partyListInput,
  output: pageOutput(partySchema),
  permission: "read:parties",
  effect: "read",
  riskTier: 1,
});

export const partiesGet = defineCapability({
  id: "parties.get",
  summary: "Get one party by id. Fails with parties.not_found when there is none.",
  input: z.strictObject({ id: z.string().min(1) }),
  output: partySchema,
  permission: "read:parties",
  effect: "read",
  riskTier: 1,
});

/** The writes are restricted (ADR 0019 §1): the owner and the manager keep the fiscal directory, staff only read it. */
export const partiesCreate = defineCapability({
  id: "parties.create",
  summary:
    "Create a client or supplier: kind (person or company), legal name, tax ID, fiscal address lines, country (ISO 3166-1 alpha-2, ES), email and at least one role (client, supplier). Phone must be E.164 (+34600000101).",
  input: partyCreateInput,
  output: partySchema,
  permission: "manage:parties",
  effect: "write",
  restricted: true,
  riskTier: 2,
  change: "add",
  idempotency: "key",
  requiresIdempotencyKey: true,
});

export const partiesUpdate = defineCapability({
  id: "parties.update",
  summary:
    "Change a client's or supplier's data. Omitted fields stay as they are and a null trade name, phone or notes clears it. Fails with parties.not_found for an unknown id.",
  input: partyUpdateInput,
  output: partySchema,
  permission: "manage:parties",
  effect: "write",
  restricted: true,
  riskTier: 2,
  change: "overwrite",
  idempotency: "target-state",
});

export const partiesCapabilities = {
  "parties.list": partiesList,
  "parties.get": partiesGet,
  "parties.create": partiesCreate,
  "parties.update": partiesUpdate,
} as const;
