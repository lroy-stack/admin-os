import { describe, expect, it } from "vitest";

import { errorText } from "@/core/i18n";
import { err, ok } from "@/core/result";
import type { ViewLoaderContext } from "@/core/views";

import { loadGuests, searchGuests } from "./guest-slots";
import { customersErrors } from "./messages";
import { customerSchema } from "./schema";

const customer = (id: string, name: string, patch: Record<string, unknown> = {}) =>
  customerSchema.parse({
    id,
    name,
    phone: "+34600000101",
    tags: [],
    vip: false,
    blocked: false,
    notes: [{ id: "n", text: "Private", authorId: "a", authorName: "A", day: "2026-10-31", minute: 60 }],
    figures: { visits: 3, spend: { amountMinor: 9000, currency: "EUR" }, lastVisit: null, noShows: 0 },
    ...patch,
  });

const contextFor = (answer: Awaited<ReturnType<ViewLoaderContext["call"]>>, locale: "en" | "es" = "en") => {
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

describe("loadGuests (bookings.guests)", () => {
  it("reads the directory once and answers the records of the ids asked, in their order, without notes", async () => {
    const { context, calls } = contextFor(
      ok({ items: [customer("a", "Ada"), customer("b", "Bo", { locale: "es" })], nextCursor: null }),
    );

    const data = await loadGuests(context, { ids: ["b", "a"] });

    expect(calls).toEqual([{ capability: "customers.list", input: { limit: 200 } }]);
    expect(data.state).toEqual({ status: "ready" });
    expect(data.rows.map((row) => (row as { id: string }).id)).toEqual(["b", "a"]);
    expect(JSON.stringify(data.rows)).not.toContain("Private");
  });

  it("reads nothing when no booking names a guest", async () => {
    const { context, calls } = contextFor(ok({ items: [], nextCursor: null }));

    expect(await loadGuests(context, { ids: [] })).toEqual({ state: { status: "empty" }, rows: [] });
    expect(calls).toEqual([]);
  });

  it("fails the read with the translated customers.not_found when an id is not in the directory", async () => {
    const { context } = contextFor(ok({ items: [customer("a", "Ada")], nextCursor: null }), "es");

    const data = await loadGuests(context, { ids: ["a", "gone"] });

    expect(data.state).toEqual({ status: "error", code: "customers.not_found" });
    expect(data.reason).toBe("Este contacto ya no existe.");
    expect(data.rows).toEqual([]);
  });

  it("fails the read when the directory is empty and an id is asked", async () => {
    const data = await loadGuests(contextFor(ok({ items: [], nextCursor: null })).context, { ids: ["a"] });

    expect(data.state).toEqual({ status: "error", code: "customers.not_found" });
  });

  it("says forbidden, never an empty day, when the directory is refused", async () => {
    const data = await loadGuests(contextFor(err("access.forbidden", "no")).context, { ids: ["a"] });

    expect(data.state).toEqual({ status: "forbidden", code: "access.forbidden" });
    expect(data.rows).toEqual([]);
  });

  it("answers an error state with the customers text, never throws, when a page fails its schema", async () => {
    const { context } = contextFor(
      ok({ items: [{ id: "a", name: "Ada", phone: "not-a-phone" }], nextCursor: null }),
      "es",
    );

    const data = await loadGuests(context, { ids: ["a"] });

    expect(data).toEqual({
      state: { status: "error", code: "schema.invalid_output" },
      reason: errorText({ code: "schema.invalid_output" }, customersErrors, "es"),
      rows: [],
    });
  });

  it("words a read error with the customers dictionary", async () => {
    const data = await loadGuests(contextFor(err("customers.not_found", "gone"), "es").context, { ids: ["a"] });

    expect(data.reason).toBe("Este contacto ya no existe.");
  });
});

describe("searchGuests (bookings.guest-search)", () => {
  it("asks customers.search and answers id, name and phone only", async () => {
    const { context, calls } = contextFor(
      ok({
        items: [{ id: "a", name: "Ada", email: "ada@example.com", phone: "+34600000101", vip: true, blocked: false }],
        nextCursor: null,
      }),
    );

    const data = await searchGuests(context, { text: "ad", limit: 8 });

    expect(calls).toEqual([{ capability: "customers.search", input: { text: "ad", limit: 8 } }]);
    expect(data.rows).toEqual([{ id: "a", name: "Ada", phone: "+34600000101" }]);
  });

  it("gives a customer without a phone a null phone", async () => {
    const data = await searchGuests(
      contextFor(ok({ items: [{ id: "a", name: "Ada", vip: false, blocked: false }], nextCursor: null })).context,
      { text: "ad", limit: 8 },
    );

    expect(data.rows).toEqual([{ id: "a", name: "Ada", phone: null }]);
  });

  it("answers the translated reason of a refusal", async () => {
    const data = await searchGuests(contextFor(err("customers.not_found", "gone"), "es").context, {
      text: "ad",
      limit: 8,
    });

    expect(data.state.status).toBe("error");
    expect(data.reason).toBe("Este contacto ya no existe.");
  });

  it("answers an invalid output when the answer does not match the schema", async () => {
    const data = await searchGuests(contextFor(ok({ nope: true })).context, { text: "ad", limit: 8 });

    expect(data.state).toEqual({ status: "error", code: "schema.invalid_output" });
  });
});
