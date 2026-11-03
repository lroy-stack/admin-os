import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_SESSION_COOKIE } from "./demo-session.server";
import { runWrite } from "./write-action.server";

/** An in-memory `cookies()`: like a Server Action's, a `set` is readable by a later `get` in the same request. */
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
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

beforeEach(() => {
  jar.values.clear();
  jar.set.mockClear();
});

describe("runWrite with a visitor who has no demo session yet (ADR 0005)", () => {
  it("starts the session and the first write succeeds against the mock adapter", async () => {
    const result = await runWrite("customers.create", { name: "First Write", phone: "+34611111111" }, "attempt-1");

    expect(result.status).toBe("ok");
    expect(jar.set).toHaveBeenCalledWith(DEMO_SESSION_COOKIE, expect.any(String), expect.any(Object));
  });
});
