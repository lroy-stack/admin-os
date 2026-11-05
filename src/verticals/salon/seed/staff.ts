import type { Shift, StaffMember } from "@/modules/staff";

import { at, BUSINESS_DAY } from "./shared";

export const staff: StaffMember[] = [
  {
    id: "stylist-ines",
    name: "Inés",
    roleIds: ["staff"],
    status: "active",
    locationIds: ["salon"],
    skills: ["cut", "colour"],
    contract: { type: "employee", startDate: "2021-09-01" },
    ext: { commissionBp: 4000 },
  },
  {
    id: "stylist-pau",
    name: "Pau",
    roleIds: ["staff"],
    status: "active",
    locationIds: ["salon"],
    skills: ["cut"],
    ext: { commissionBp: 3500 },
  },
];

export const shifts: Shift[] = [
  { id: "shift-ines", staffId: "stylist-ines", businessDay: BUSINESS_DAY, startMin: at(9), endMin: at(17) },
  { id: "shift-pau", staffId: "stylist-pau", businessDay: BUSINESS_DAY, startMin: at(10), endMin: at(18) },
];
