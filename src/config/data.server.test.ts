import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { describeAdapterContract } from "./adapter-contract.testkit";
import { CATALOG } from "./catalog";
import { getAdapter, MOCK_HANDLERS } from "./data.server";
import { durableAdapter } from "./durable-adapter.server";
import { DEMO_ROLE_COOKIE, getRuntime, MOCK_FAULTS_COOKIE } from "./runtime";

/** An in-memory stand-in for `cookies()`; `set` is observed so tests can check the attributes. */
const jar = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    get: (name: string) => (values.has(name) ? { name, value: values.get(name) } : undefined),
    set: vi.fn((name: string, value: string) => values.set(name, value)),
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => jar,
  headers: async () => new Headers({ "accept-language": "en" }),
}));

vi.mock("./durable-adapter.server", () => ({ durableAdapter: vi.fn(() => ({ dispatch: vi.fn() })) }));

beforeEach(() => {
  jar.values.clear();
  jar.set.mockClear();
  vi.mocked(durableAdapter).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

it.each(Object.keys(CATALOG))("%s has a mock handler", (id) => {
  expect(MOCK_HANDLERS).toHaveProperty([id]);
});

describeAdapterContract("in-memory", (vertical, sessionId) => getAdapter({ vertical, sessionId }));

describe("getAdapter and DATA_STORE", () => {
  it("keeps a visitor's session in memory when DATA_STORE is unset", () => {
    getAdapter({ vertical: "hospitality", sessionId: "s-1" });
    expect(durableAdapter).not.toHaveBeenCalled();
  });

  it("sends a visitor with a session to the store when DATA_STORE is durable", () => {
    vi.stubEnv("DATA_STORE", "durable");
    getAdapter({ vertical: "salon", sessionId: "s-1" });
    expect(durableAdapter).toHaveBeenCalledWith(expect.objectContaining({ vertical: "salon", sessionId: "s-1" }));
  });

  it("serves a visitor without a session from the seed in process when DATA_STORE is durable", () => {
    vi.stubEnv("DATA_STORE", "durable");
    getAdapter({ vertical: "salon" });
    expect(durableAdapter).not.toHaveBeenCalled();
  });
});

describe("getRuntime", () => {
  it.each([
    [undefined, "owner"],
    ["staff", "staff"],
    ["manager", "manager"],
    ["superuser", "owner"],
  ])("acts as the role in the demo cookie %s (%s)", async (cookie, roleId) => {
    jar.values.set(DEMO_ROLE_COOKIE, cookie ?? "");
    const { actor } = await getRuntime();
    expect(actor.roleId).toBe(roleId);
  });

  it("forces a visitor's fault from the demo cookie", async () => {
    jar.values.set(MOCK_FAULTS_COOKIE, "clock.get=clock.unavailable");
    const { client } = await getRuntime();
    expect(await client.call("clock.get", {})).toMatchObject({
      ok: false,
      error: { code: "clock.unavailable" },
    });
  });

  it("ignores a malformed fault cookie instead of failing the page", async () => {
    jar.values.set(MOCK_FAULTS_COOKIE, "nonsense");
    const { client } = await getRuntime();
    expect(await client.call("clock.get", {})).toMatchObject({ ok: true });
  });
});
