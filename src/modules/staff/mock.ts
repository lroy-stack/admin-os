import { type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";

import { staffList } from "./capabilities";
import type { StaffMember } from "./schema";

/** Mock answers for the staff module (ADR 0005); `src/config/data.server.ts` wires them with the preset seed. */
export const staffMockHandlers = {
  ...mockHandler(staffList, (input, { data }: MockContext<{ readonly staff: readonly StaffMember[] }>) =>
    paginate(data.staff, input),
  ),
};
