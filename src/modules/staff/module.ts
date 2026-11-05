import { defineModule } from "@/core/module";

import { staffCapabilities } from "./capabilities";
import { shiftSchema, staffMemberSchema } from "./schema";

const STAFF_IDS = ["staff.list"] as const;

/** The staff module's manifest (ADR 0017 §1). */
export const staffModule = defineModule({
  id: "staff",
  capabilities: staffCapabilities,
  settings: [],
  mcp: {
    noun: "staff",
    idSources: [["team member ids", ["staff.list"]]],
    tools: {
      "staff.list": { expose: true, title: "List staff" },
      "staff.get": { expose: true, title: "Get a team member", ids: { id: STAFF_IDS } },
      "staff.shifts.list": { expose: true, title: "List a team member's shifts", ids: { staffId: STAFF_IDS } },
      "staff.contract.get": { uiOnly: "Employment terms; no assistant job needs them (spec 012)" },
    },
  },
  seed: {
    staff: { schema: staffMemberSchema, required: true, ext: { entity: "staff", optional: false } },
    shifts: { schema: shiftSchema, required: false },
  },
  references: [],
  owns: ["src/app/(main)/dashboard/staff", "src/config/staff.test.ts", "e2e/smoke/staff.spec.ts"],
});
