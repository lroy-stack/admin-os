import { describe, expect, it } from "vitest";

import { DEFAULT_ROLES, permissionsOf } from "@/core/access";
import { createClient } from "@/core/client";
import type { CallResult } from "@/core/result";

import { CATALOG } from "./catalog";
import { getAdapter } from "./data.server";
import { VERTICALS, type VerticalId } from "./vertical";

/**
 * The collections each preset's Products views show (spec 010, ADR 0018): a collection is the preset's set of
 * categories, read through `catalog.list` with its category filter on the preset's seed.
 */
const collections = [
  [
    "hospitality",
    ["starters", "mains", "desserts", "menus"],
    ["dish-croquetas", "dish-arroz", "dish-flan", "dish-of-the-day", "menu-tasting"],
  ],
  ["hospitality", ["shop"], ["shop-olive-oil", "shop-red-wine", "shop-paprika"]],
  ["salon", ["shop"], ["retail-shampoo", "retail-conditioner", "retail-wax"]],
  ["workshop", ["parts"], ["part-brake-pads", "part-oil-filter", "part-air-filter", "part-wiper-blades"]],
] as const satisfies readonly (readonly [VerticalId, readonly string[], readonly string[]])[];

const owner = (vertical: VerticalId) =>
  createClient(CATALOG, getAdapter({ vertical, sessionId: crypto.randomUUID() }), {
    actor: {
      actorId: "demo-owner",
      roleId: "owner",
      permissions: permissionsOf(DEFAULT_ROLES[0], CATALOG, VERTICALS[vertical].modules),
    },
    retryDelayMs: 0,
    logger: () => undefined,
    mode: "production",
  });

const idsOf = (result: CallResult<unknown>): string[] => {
  if (!("ok" in result) || !result.ok) throw new Error(`Expected a success, got ${JSON.stringify(result)}`);
  return (result.value as { items: { id: string }[] }).items.map(({ id }) => id);
};

describe("catalog collections on each preset's seed", () => {
  it.each(collections)("%s lists %j as exactly its items", async (vertical, categoryIds, ids) => {
    expect(idsOf(await owner(vertical).call("catalog.list", { categoryIds: [...categoryIds], limit: 200 }))).toEqual(
      ids,
    );
  });
});
