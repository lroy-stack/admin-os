import { defineCapability } from "@/core/capability";
import { pageInput, pageOutput } from "@/core/pagination";

import {
  SHIFT_RANGE_RULE,
  shiftSchema,
  staffContractGetInput,
  staffContractOutput,
  staffGetInput,
  staffRecordSchema,
  staffShiftsListInput,
} from "./schema";

export const staffList = defineCapability({
  id: "staff.list",
  summary: "List team members, one page at a time. Employment terms are not included.",
  input: pageInput({ defaultLimit: 50, maxLimit: 200 }),
  output: pageOutput(staffRecordSchema),
  permission: "read:staff",
  effect: "read",
  riskTier: 1,
});

export const staffGet = defineCapability({
  id: "staff.get",
  summary:
    "Get one team member by id: name, roles, status, locations and skills, without employment terms. Fails with staff.not_found when there is none.",
  input: staffGetInput,
  output: staffRecordSchema,
  permission: "read:staff",
  effect: "read",
  riskTier: 1,
});

export const staffShiftsList = defineCapability({
  id: "staff.shifts.list",
  summary: `List one team member's planned shifts from one business day to another, ${SHIFT_RANGE_RULE}, ordered by day and start time, one page at a time. Times are minutes from midnight of the shift's business day. Empty when the business plans no shifts. Fails with staff.not_found for an unknown staffId.`,
  input: staffShiftsListInput,
  output: pageOutput(shiftSchema),
  permission: "read:staff",
  effect: "read",
  riskTier: 1,
});

export const staffContractGet = defineCapability({
  id: "staff.contract.get",
  summary:
    "Get one team member's employment terms: contract type, start date and weekly hours when fixed; contract is null when none is on record. Fails with staff.not_found for an unknown staffId.",
  input: staffContractGetInput,
  output: staffContractOutput,
  permission: "read:staff.contracts",
  effect: "read",
  // Employment terms are for the people who manage the team; staff never hold it (ADR 0020 §4).
  restricted: true,
  riskTier: 1,
});

export const staffCapabilities = {
  "staff.list": staffList,
  "staff.get": staffGet,
  "staff.shifts.list": staffShiftsList,
  "staff.contract.get": staffContractGet,
} as const;
