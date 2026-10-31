import { defineCapability } from "@/core/capability";
import { pageInput, pageOutput } from "@/core/pagination";

import { customerSchema } from "./schema";

export const customersList = defineCapability({
  id: "customers.list",
  summary: "List customers, one page at a time.",
  input: pageInput({ defaultLimit: 50, maxLimit: 200 }),
  output: pageOutput(customerSchema),
  permission: "read:customers",
  effect: "read",
});

export const customersCapabilities = { "customers.list": customersList } as const;
