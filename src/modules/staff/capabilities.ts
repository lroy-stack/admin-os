import { defineCapability } from "@/core/capability";
import { pageInput, pageOutput } from "@/core/pagination";

import { staffMemberSchema } from "./schema";

export const staffList = defineCapability({
  id: "staff.list",
  summary: "List staff members, one page at a time.",
  input: pageInput({ defaultLimit: 50, maxLimit: 200 }),
  output: pageOutput(staffMemberSchema),
  permission: "read:staff",
  effect: "read",
});

export const staffCapabilities = { "staff.list": staffList } as const;
