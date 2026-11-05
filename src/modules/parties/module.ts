import { defineModule } from "@/core/module";

import { partiesCapabilities } from "./capabilities";
import { partySchema } from "./schema";

const PARTY_IDS = ["parties.list"] as const;

/** The parties module's manifest (ADR 0017 §1, ADR 0019): the fiscal directory of clients and suppliers. */
export const partiesModule = defineModule({
  id: "parties",
  capabilities: partiesCapabilities,
  settings: [],
  mcp: {
    noun: "parties",
    idSources: [["party ids", ["parties.list"]]],
    tools: {
      "parties.list": { expose: true, title: "List clients and suppliers", untrusted: ["items[].notes"] },
      "parties.get": { expose: true, title: "Get a client or supplier", ids: { id: PARTY_IDS }, untrusted: ["notes"] },
      "parties.create": { expose: true, title: "Create a client or supplier", untrusted: ["notes"] },
      "parties.update": {
        expose: true,
        title: "Change a client or supplier",
        ids: { id: PARTY_IDS },
        untrusted: ["notes"],
      },
    },
  },
  seed: {
    parties: { schema: partySchema, required: true, ext: { entity: "party", optional: true } },
  },
  references: [],
  owns: [
    "src/app/(main)/dashboard/invoice",
    "src/config/approvals.parties.test.ts",
    "src/config/mcp.server.parties.test.ts",
    "e2e/smoke/invoice.spec.ts",
  ],
});
