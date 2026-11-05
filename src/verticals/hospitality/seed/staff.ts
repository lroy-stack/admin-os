import type { Shift, StaffMember } from "@/modules/staff";

import { at, BUSINESS_DAY } from "./shared";

export const staff: StaffMember[] = [
  {
    id: "staff-marta",
    name: "Marta",
    roleIds: ["manager"],
    status: "active",
    locationIds: ["venue"],
    skills: ["host", "sommelier"],
    contract: { type: "full_time", startDate: "2022-03-01", hoursPerWeek: 40 },
    ext: { crew: "floor" },
  },
  {
    id: "staff-iker",
    name: "Iker",
    roleIds: ["staff"],
    status: "active",
    locationIds: ["venue"],
    skills: ["waiter"],
    ext: { crew: "floor" },
  },
  {
    id: "staff-lucia",
    name: "Lucía",
    roleIds: ["staff"],
    status: "active",
    locationIds: ["venue"],
    skills: ["grill", "pastry"],
    ext: { crew: "kitchen" },
  },
];

export const shifts: Shift[] = [
  { id: "shift-marta", staffId: "staff-marta", businessDay: BUSINESS_DAY, startMin: at(17), endMin: at(24) },
  { id: "shift-iker", staffId: "staff-iker", businessDay: BUSINESS_DAY, startMin: at(18, 30), endMin: at(24) },
  { id: "shift-lucia", staffId: "staff-lucia", businessDay: BUSINESS_DAY, startMin: at(17, 30), endMin: at(23, 30) },
];
