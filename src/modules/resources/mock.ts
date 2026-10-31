import { type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";

import { resourcesList } from "./capabilities";
import type { Resource } from "./schema";

/** Mock answers for the resources module (ADR 0005); `src/config/data.server.ts` wires them with the preset seed. */
export const resourcesMockHandlers = {
  ...mockHandler(resourcesList, (input, { data }: MockContext<{ readonly resources: readonly Resource[] }>) =>
    paginate(data.resources, input),
  ),
};
