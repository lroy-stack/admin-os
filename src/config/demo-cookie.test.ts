import { describe, expect, it } from "vitest";

import { demoCookieScope } from "./demo-cookie";

const DOMAIN = { DEMO_COOKIE_DOMAIN: "admin-os.lr0y.dev" };

describe("demoCookieScope", () => {
  it.each([
    ["unset", {}],
    ["empty", { DEMO_COOKIE_DOMAIN: "" }],
  ])("keeps the cookies host-only and plain outside production when the domain is %s", (_label, env) => {
    expect(demoCookieScope(env, "admin-os.lr0y.dev")).toEqual({});
  });

  it.each([
    ["the apex", "admin-os.lr0y.dev"],
    ["the apex with a port", "admin-os.lr0y.dev:8443"],
    ["the apex in capitals", "Admin-OS.lr0y.dev"],
    ["a subdomain", "mcp.admin-os.lr0y.dev"],
  ])("shares the cookies, Secure, on %s", (_label, host) => {
    expect(demoCookieScope(DOMAIN, host)).toEqual({ domain: "admin-os.lr0y.dev", secure: true });
  });

  it.each([
    ["localhost", "localhost:8788"],
    ["an unrelated host", "example.com"],
    ["a host that only ends with the same letters", "evil-admin-os.lr0y.dev"],
    ["a workers.dev preview", "admin-os.l-roy-lwe.workers.dev"],
    ["no host", null],
  ])("keeps the cookies host-only and plain on %s", (_label, host) => {
    expect(demoCookieScope(DOMAIN, host)).toEqual({});
  });

  it("makes host-only cookies Secure in production", () => {
    expect(demoCookieScope({ NODE_ENV: "production" }, "localhost")).toEqual({ secure: true });
  });

  it("keeps both the domain and Secure in production on the domain's host", () => {
    expect(demoCookieScope({ ...DOMAIN, NODE_ENV: "production" }, "admin-os.lr0y.dev")).toEqual({
      domain: "admin-os.lr0y.dev",
      secure: true,
    });
  });

  it.each(["https://admin-os.lr0y.dev", ".admin-os.lr0y.dev", "admin-os.lr0y.dev:443", "localhost", "a b.dev"])(
    "rejects %s with a message that names the variable",
    (domain) => {
      expect(() => demoCookieScope({ DEMO_COOKIE_DOMAIN: domain }, "admin-os.lr0y.dev")).toThrow(/DEMO_COOKIE_DOMAIN/);
    },
  );
});
