import { z } from "zod";

import { businessDaySchema, endAfterStart, endAfterStartIssue, minuteOfDaySchema } from "@/core/clock";

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

/** Planned work, in minutes from midnight of `businessDay`. The unrefined object stays `.omit`-able. */
export const shiftObject = z.object({
  id: z.string().min(1),
  staffId: z.string().min(1),
  businessDay: businessDaySchema,
  startMin: minuteOfDaySchema,
  endMin: minuteOfDaySchema,
});

export const shiftSchema = shiftObject.refine(endAfterStart, endAfterStartIssue);

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
export type Shift = z.infer<typeof shiftSchema>;
export type Attendance = z.infer<typeof attendanceSchema>;
export type Leave = z.infer<typeof leaveSchema>;
