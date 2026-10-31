import { type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";

import { customersList } from "./capabilities";
import type { Customer } from "./schema";

/** Mock answers for the customers module (ADR 0005); `src/config/data.server.ts` wires them with the preset seed. */
export const customersMockHandlers = {
  ...mockHandler(customersList, (input, { data }: MockContext<{ readonly customers: readonly Customer[] }>) =>
    paginate(data.customers, input),
  ),
};
