import { defineModule } from "@/core/module";
import { pageOutput } from "@/core/pagination";

import { staffCapabilities } from "./capabilities";
import { shiftSchema, staffMemberSchema } from "./schema";

/** A staff member as a list shows them: no contract terms and no `ext`. */
const staffRow = staffMemberSchema.omit({ contract: true, ext: true });

/** The staff module's manifest (ADR 0017 §1). */
export const staffModule = defineModule({
  id: "staff",
  capabilities: staffCapabilities,
  settings: [],
  mcp: {
    noun: "staff",
    idSources: [],
    tools: {
      "staff.list": { expose: true, title: "List staff", concise: pageOutput(staffRow) },
    },
  },
  seed: {
    staff: { schema: staffMemberSchema, required: true, ext: { entity: "staff", optional: false } },
    shifts: { schema: shiftSchema, required: false },
  },
  references: [],
  owns: [],
});
