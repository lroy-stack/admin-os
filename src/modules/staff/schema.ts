import { z } from "zod";

import { businessDaySchema, endAfterStart, endAfterStartIssue, minuteOfDaySchema } from "@/core/clock";
import { pageInput } from "@/core/pagination";

export const staffStatuses = ["active", "inactive"] as const;
export const leaveKinds = ["vacation", "sick", "other"] as const;
export const leaveStatuses = ["requested", "approved", "rejected"] as const;

/** Employment terms: a free-text type (the preset's vocabulary), when it started, and the weekly hours if fixed. */
export const contractSchema = z.object({
  type: z.string().min(1),
  startDate: businessDaySchema,
  hoursPerWeek: z.number().positive().optional(),
});

export const staffMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  roleIds: z.array(z.string().min(1)),
  status: z.enum(staffStatuses),
  locationIds: z.array(z.string().min(1)),
  skills: z.array(z.string().min(1)),
  contract: contractSchema.optional(),
  ext: z.record(z.string(), z.unknown()).optional(),
});

/**
 * A team member as every staff read returns them, on the web and the MCP alike (ADR 0020 §4). The contract needs
 * `read:staff.contracts` and is read through `staff.contract.get`; `ext` holds the preset's own fields, pay among
 * them, which no generic screen or assistant reads, so it stays in the seed. Picked, so a new field is left out until
 * it is added here.
 */
export const staffRecordSchema = staffMemberSchema.pick({
  id: true,
  name: true,
  roleIds: true,
  status: true,
  locationIds: true,
  skills: true,
});

/** Planned work, in minutes from midnight of `businessDay`. The unrefined object stays `.omit`-able. */
export const shiftObject = z.object({
  id: z.string().min(1),
  staffId: z.string().min(1),
  businessDay: businessDaySchema,
  startMin: minuteOfDaySchema,
  endMin: minuteOfDaySchema,
});

export const shiftSchema = shiftObject.refine(endAfterStart, endAfterStartIssue);

const staffIdInput = z.string().min(1).max(128);

export const staffGetInput = z.strictObject({ id: staffIdInput });

export const staffContractGetInput = z.strictObject({ staffId: staffIdInput });

/** `null` when no employment terms are on record for the member. */
export const staffContractOutput = z.object({ contract: contractSchema.nullable() });

/** The widest range one shift list covers, both ends included: a month, so `to` is at most 30 days after `from`. */
export const SHIFT_RANGE_MAX_DAYS = 31;

const DAY_MS = 86_400_000;

const midnightOf = (day: string) => Date.parse(`${day}T00:00:00Z`);

/** A day that exists: `Date.parse` rolls 2026-02-30 over to March, so the date must read back as written. */
const isCalendarDay = (day: string) => {
  const ms = midnightOf(day);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === day;
};

const isCalendarRange = ({ from, to }: { from: string; to: string }) => isCalendarDay(from) && isCalendarDay(to);

const calendarDaySchema = businessDaySchema.refine(isCalendarDay, { message: "must be a calendar day that exists" });

/** The range rule, worded once for the summary and the error. */
export const SHIFT_RANGE_RULE = `covering at most ${SHIFT_RANGE_MAX_DAYS} days, both ends included (to at most ${SHIFT_RANGE_MAX_DAYS - 1} days after from)`;

/** One team member's shifts over an inclusive range of business days, at most `SHIFT_RANGE_MAX_DAYS` long. */
export const staffShiftsListInput = pageInput({ defaultLimit: 50, maxLimit: 100 })
  .extend({ staffId: staffIdInput, from: calendarDaySchema, to: calendarDaySchema })
  // A day that does not exist already fails on its own field, so the range rules leave it out.
  .refine((input) => !isCalendarRange(input) || input.from <= input.to, {
    message: "from must not be after to",
    path: ["from"],
  })
  .refine(
    (input) =>
      !isCalendarRange(input) ||
      input.from > input.to ||
      (midnightOf(input.to) - midnightOf(input.from)) / DAY_MS < SHIFT_RANGE_MAX_DAYS,
    { message: `from and to must be a range ${SHIFT_RANGE_RULE}; ask for a shorter range`, path: ["to"] },
  );

/** Worked time: the clock-out stays empty while the person is still in. */
export const attendanceSchema = z.object({
  id: z.string().min(1),
  staffId: z.string().min(1),
  shiftId: z.string().min(1).optional(),
  businessDay: businessDaySchema,
  clockInMin: minuteOfDaySchema,
  clockOutMin: minuteOfDaySchema.optional(),
});

export const leaveSchema = z.object({
  id: z.string().min(1),
  staffId: z.string().min(1),
  kind: z.enum(leaveKinds),
  fromDay: businessDaySchema,
  toDay: businessDaySchema,
  status: z.enum(leaveStatuses),
});

export type StaffMember = z.infer<typeof staffMemberSchema>;
export type StaffRecord = z.infer<typeof staffRecordSchema>;
export type Shift = z.infer<typeof shiftSchema>;
export type Attendance = z.infer<typeof attendanceSchema>;
export type Leave = z.infer<typeof leaveSchema>;
