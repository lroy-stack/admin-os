import { type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";

import { catalogList } from "./capabilities";
import type { CatalogItem } from "./schema";

/** Mock answers for the catalog module (ADR 0005); `src/config/data.server.ts` wires them with the preset seed. */
export const catalogMockHandlers = {
  ...mockHandler(
    catalogList,
    ({ categoryIds, ...page }, { data }: MockContext<{ readonly catalog: readonly CatalogItem[] }>) => {
      const items =
        categoryIds === undefined ? data.catalog : data.catalog.filter((item) => categoryIds.includes(item.categoryId));
      return paginate(items, page);
    },
  ),
};
