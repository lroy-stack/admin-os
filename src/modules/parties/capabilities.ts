import { z } from "zod";

import { defineCapability } from "@/core/capability";
import { pageOutput } from "@/core/pagination";

import { partyListInput, partySchema } from "./schema";

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

export const partiesCapabilities = {
  "parties.list": partiesList,
  "parties.get": partiesGet,
} as const;
