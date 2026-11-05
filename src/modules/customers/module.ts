import { z } from "zod";

import { defineModule } from "@/core/module";
import { pageOutput } from "@/core/pagination";

import { customersCapabilities, duplicateMatchSchema } from "./capabilities";
import { assetSchema, customerSchema, customerSummarySchema } from "./schema";

const CUSTOMER_IDS = ["customers.search", "customers.duplicates.check"] as const;

/** A customer's free text: the staff's dated notes, and why the customer is blocked. */
const CUSTOMER_TEXT = ["notes[].text", "blockReason"] as const;

/** A possible duplicate as the check shows it: enough to recognise the person, not their notes or consent. */
const duplicateRow = z.object({ matches: z.array(duplicateMatchSchema.extend({ customer: customerSummarySchema })) });

/** The customers module's manifest (ADR 0017 §1). */
export const customersModule = defineModule({
  id: "customers",
  capabilities: customersCapabilities,
  settings: [],
  mcp: {
    tools: {
      "customers.list": { expose: true, title: "List customers", concise: pageOutput(customerSummarySchema) },
      "customers.search": { expose: true, title: "Search customers" },
      "customers.get": {
        expose: true,
        title: "Get a customer",
        ids: { id: CUSTOMER_IDS },
        untrusted: CUSTOMER_TEXT,
      },
      "customers.duplicates.check": { expose: true, title: "Check for duplicate customers", concise: duplicateRow },
      "customers.create": { expose: true, title: "Create a customer", untrusted: CUSTOMER_TEXT },
      "customers.contact.update": {
        expose: true,
        title: "Change a customer's contact details",
        ids: { id: CUSTOMER_IDS },
        untrusted: CUSTOMER_TEXT,
      },
      "customers.notes.add": {
        expose: true,
        title: "Add a customer note",
        ids: { id: CUSTOMER_IDS },
        untrusted: CUSTOMER_TEXT,
      },
      "customers.block": {
        expose: true,
        title: "Block a customer",
        ids: { id: CUSTOMER_IDS },
        untrusted: CUSTOMER_TEXT,
      },
      "customers.unblock": {
        expose: true,
        title: "Unblock a customer",
        ids: { id: CUSTOMER_IDS },
        untrusted: CUSTOMER_TEXT,
      },
    },
  },
  seed: {
    customers: { schema: customerSchema, required: true, ext: { entity: "customer", optional: false } },
    assets: { schema: assetSchema, required: false, ext: { entity: "asset", optional: false } },
  },
  references: [],
  owns: ["src/app/(main)/dashboard/customers", "src/config/customers.test.ts", "e2e/smoke/customers.spec.ts"],
});
