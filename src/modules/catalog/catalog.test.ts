import { describe, expect, it } from "vitest";

import { descriptorViolations } from "@/core/capability";
import { createClient } from "@/core/client";
import type { BusinessClock } from "@/core/clock";
import { createMockAdapter, createSessionStore } from "@/core/mock";
import type { CallResult } from "@/core/result";

import { catalogCapabilities, catalogList } from "./capabilities";
import { catalogMockHandlers } from "./mock";
import type { CatalogItem } from "./schema";

const clock: BusinessClock = {
  businessDay: "2026-10-31",
  today: "2026-10-31",
  nowMin: 600,
  cutoffMin: 0,
  timeZone: "Europe/Madrid",
};

const item = (id: string, categoryId: string): CatalogItem => ({
  id,
  kind: "product",
  name: { source: id, translations: { en: id } },
  categoryId,
  price: { amountMinor: 1000, currency: "EUR" },
  status: "active",
  media: [],
  tags: [],
});

const fixture = [item("first", "alpha"), item("second", "shop"), item("third", "beta"), item("fourth", "shop")];

const client = createClient(
  catalogCapabilities,
  createMockAdapter({ handlers: catalogMockHandlers, store: createSessionStore({ catalog: fixture }), clock }),
  {
    actor: { actorId: "demo-staff", roleId: "staff", permissions: ["read:catalog"] },
    retryDelayMs: 0,
    logger: () => undefined,
    mode: "production",
  },
);

const idsOf = (result: CallResult<unknown>): string[] => {
  if (!("ok" in result) || !result.ok) throw new Error(`Expected a success, got ${JSON.stringify(result)}`);
  return (result.value as { items: { id: string }[] }).items.map(({ id }) => id);
};

describe("catalog.list", () => {
  it("passes the descriptor rules", () => {
    expect(descriptorViolations(catalogList)).toEqual([]);
  });

  it("lists every item when no category is asked for", async () => {
    expect(idsOf(await client.call("catalog.list", {}))).toEqual(["first", "second", "third", "fourth"]);
  });

  it("keeps only the items of the asked categories, in catalog order", async () => {
    expect(idsOf(await client.call("catalog.list", { categoryIds: ["shop", "alpha"] }))).toEqual([
      "first",
      "second",
      "fourth",
    ]);
  });

  it("answers an empty page for a category that holds no item", async () => {
    expect(idsOf(await client.call("catalog.list", { categoryIds: ["gamma"] }))).toEqual([]);
  });

  it("refuses an empty category list", async () => {
    expect(await client.call("catalog.list", { categoryIds: [] })).toMatchObject({
      ok: false,
      error: { code: "schema.invalid_input" },
    });
  });
});
