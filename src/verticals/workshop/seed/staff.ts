import type { StaffMember } from "@/modules/staff";

export const staff: StaffMember[] = [
  {
    id: "mech-rafa",
    name: "Rafa",
    roleIds: ["staff"],
    status: "active",
    locationIds: ["branch"],
    skills: ["brakes", "diagnostics"],
    contract: { type: "employee", startDate: "2019-05-13", hoursPerWeek: 40 },
    ext: { certifications: ["EV safety"] },
  },
];
