import { describe, expect, it } from "vitest";

import { demoCookieScope } from "./demo-cookie";

describe("demoCookieScope", () => {
  it.each([
    ["unset", {}],
    ["empty", { DEMO_COOKIE_DOMAIN: "" }],
  ])("keeps the cookies host-only and plain outside production when the domain is %s", (_label, env) => {
    expect(demoCookieScope(env)).toEqual({});
  });

  it("shares the cookies with the domain's subdomains, Secure, when it is set", () => {
    expect(demoCookieScope({ DEMO_COOKIE_DOMAIN: "admin-os.lr0y.dev" })).toEqual({
      domain: "admin-os.lr0y.dev",
      secure: true,
    });
  });

  it("makes host-only cookies Secure in production", () => {
    expect(demoCookieScope({ NODE_ENV: "production" })).toEqual({ secure: true });
  });

  it("keeps both the domain and Secure in production", () => {
    expect(demoCookieScope({ NODE_ENV: "production", DEMO_COOKIE_DOMAIN: "admin-os.lr0y.dev" })).toEqual({
      domain: "admin-os.lr0y.dev",
      secure: true,
    });
  });

  it.each(["https://admin-os.lr0y.dev", ".admin-os.lr0y.dev", "admin-os.lr0y.dev:443", "localhost", "a b.dev"])(
    "rejects %s with a message that names the variable",
    (domain) => {
      expect(() => demoCookieScope({ DEMO_COOKIE_DOMAIN: domain })).toThrow(/DEMO_COOKIE_DOMAIN/);
    },
  );
});
