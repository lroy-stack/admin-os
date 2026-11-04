import { z } from "zod";

/** A bare host name such as `admin-os.lr0y.dev`: no scheme, port, path or leading dot. */
const cookieDomainSchema = z
  .string()
  .regex(/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/, "DEMO_COOKIE_DOMAIN must be a bare host name such as admin-os.lr0y.dev");

/**
 * The scope of the demo cookies (`demo_sid`, `demo_role`). With `DEMO_COOKIE_DOMAIN` they carry a `Domain`, so the
 * apex host and its subdomains (the MCP Worker's consent page) read the same visitor; without it they stay
 * host-only, as on localhost.
 */
export function demoCookieScope(env: Readonly<Record<string, string | undefined>>): { readonly domain?: string } {
  const configured = env.DEMO_COOKIE_DOMAIN;
  if (configured === undefined || configured === "") return {};
  return { domain: cookieDomainSchema.parse(configured) };
}
