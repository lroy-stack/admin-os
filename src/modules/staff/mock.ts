import { collectionOf, type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";
import { err, ok } from "@/core/result";

import { staffContractGet, staffGet, staffList, staffShiftsList } from "./capabilities";
import type { Shift, StaffMember, StaffRecord } from "./schema";

interface StaffData {
  readonly staff: readonly StaffMember[];
  /** Optional: a preset that plans no shifts seeds none, and a missing collection is empty. */
  readonly shifts?: readonly Shift[];
}

type Context = MockContext<StaffData>;

const notFound = (id: string) => err("staff.not_found", `No team member with id ${id}`, { id });

/** The member without their employment terms, which only `staff.contract.get` returns, and without `ext` (ADR 0020 §4). */
const recordOf = ({ contract: _contract, ext: _ext, ...record }: StaffMember): StaffRecord => record;

const byDayThenStart = (a: Shift, b: Shift) =>
  a.businessDay.localeCompare(b.businessDay) || a.startMin - b.startMin || a.id.localeCompare(b.id);

/** Mock answers for the staff module (ADR 0005); `src/config/data.server.ts` wires them with the preset seed. */
export const staffMockHandlers = {
  ...mockHandler(staffList, (input, { data }: Context) => paginate(data.staff.map(recordOf), input)),

  ...mockHandler(staffGet, ({ id }, { data }: Context) => {
    const member = data.staff.find((candidate) => candidate.id === id);
    return member === undefined ? notFound(id) : ok(recordOf(member));
  }),

  ...mockHandler(staffShiftsList, ({ staffId, from, to, ...page }, { data }: Context) => {
    if (!data.staff.some((member) => member.id === staffId)) return notFound(staffId);
    const shifts = collectionOf(data, "shifts")
      .filter((shift) => shift.staffId === staffId && shift.businessDay >= from && shift.businessDay <= to)
      .toSorted(byDayThenStart);
    return paginate(shifts, page);
  }),

  ...mockHandler(staffContractGet, ({ staffId }, { data }: Context) => {
    const member = data.staff.find((candidate) => candidate.id === staffId);
    return member === undefined ? notFound(staffId) : ok({ contract: member.contract ?? null });
  }),
};
