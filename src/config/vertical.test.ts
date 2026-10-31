import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveVertical, VERTICALS } from "./vertical";
import { getVertical } from "./vertical.server";

describe("resolveVertical", () => {
  it.each([[undefined], [""]])("falls back to hospitality for %j", (raw) => {
    expect(resolveVertical(raw)).toBe(VERTICALS.hospitality);
  });

  it("resolves a known id", () => {
    expect(resolveVertical("salon")).toBe(VERTICALS.salon);
  });

  it.each([["Salon"], ["foo"]])("rejects %j and names the allowed values", (raw) => {
    expect(() => resolveVertical(raw)).toThrow(/VERTICAL must be one of hospitality, salon, workshop/);
  });
});

const cookieStore = vi.hoisted(() => ({ value: undefined as string | undefined }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookieStore.value === undefined ? undefined : { value: cookieStore.value }) }),
}));

describe("getVertical", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    cookieStore.value = undefined;
  });

  it("reads VERTICAL on every call", async () => {
    vi.stubEnv("VERTICAL", "workshop");
    const first = await getVertical();
    vi.stubEnv("VERTICAL", "salon");
    const second = await getVertical();
    expect([first.id, second.id]).toEqual(["workshop", "salon"]);
  });

  it.each([
    ["salon", "workshop", "salon"],
    ["workshop", "", "workshop"],
    ["nonsense", "workshop", "workshop"],
    ["", "salon", "salon"],
    ["nonsense", "", "hospitality"],
  ])("with demo cookie %j and VERTICAL %j picks %s", async (cookie, env, expected) => {
    vi.stubEnv("VERTICAL", env);
    cookieStore.value = cookie;
    expect((await getVertical()).id).toBe(expected);
  });
});

describe("resolveVertical with a preferred preset", () => {
  it.each([
    ["salon", undefined, "salon"],
    ["workshop", "salon", "workshop"],
    ["nope", "salon", "salon"],
    [undefined, undefined, "hospitality"],
  ])("prefers %j over %j: %s", (preferred, env, expected) => {
    expect(resolveVertical(env, preferred).id).toBe(expected);
  });
});
