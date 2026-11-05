import { describe, expect, it } from "vitest";

import { err, ok } from "@/core/result";
import type { ViewLoaderContext } from "@/core/views";

import { loadCatalogCollection } from "./collection-loader";

const item = (id: string, translations: Record<string, string>) => ({
  id,
  kind: "product",
  name: { source: `${id} source`, translations },
  categoryId: "shop",
  price: { amountMinor: 1100, currency: "EUR" },
  status: "active",
  media: [],
  tags: [],
});

const contextFor = (answer: Awaited<ReturnType<ViewLoaderContext["call"]>>, locale: "en" | "de" = "en") => {
  const calls: { capability: string; input: unknown }[] = [];
  const context: ViewLoaderContext = {
    locale,
    call: async (capability, input) => {
      calls.push({ capability, input });
      return answer;
    },
  };
  return { context, calls };
};

describe("loadCatalogCollection", () => {
  it("reads catalog.list for the view's categories and names each item in the locale, else its source", async () => {
    const { context, calls } = contextFor(
      ok({ items: [item("a", { de: "Eins" }), item("b", {})], nextCursor: null }),
      "de",
    );

    const data = await loadCatalogCollection(context, { categoryIds: ["shop"] });

    expect(calls).toEqual([{ capability: "catalog.list", input: { categoryIds: ["shop"], limit: 200 } }]);
    expect(data.rows).toEqual([
      { id: "a", name: "Eins", price: { amountMinor: 1100, currency: "EUR" }, status: "active" },
      { id: "b", name: "b source", price: { amountMinor: 1100, currency: "EUR" }, status: "active" },
    ]);
  });

  it("refuses params its kind does not accept", async () => {
    await expect(loadCatalogCollection(contextFor(ok({ items: [], nextCursor: null })).context, {})).rejects.toThrow();
  });

  it("says error, never empty, when the service is unavailable", async () => {
    const data = await loadCatalogCollection(contextFor(err("transport.unavailable", "down")).context, {
      categoryIds: ["shop"],
    });

    expect(data.state).toEqual({ status: "error", code: "transport.unavailable" });
    expect(data.rows).toEqual([]);
  });
});
