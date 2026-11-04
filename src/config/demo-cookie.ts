import { z } from "zod";

/** A bare host name such as `admin-os.lr0y.dev`: no scheme, port, path or leading dot. */
const cookieDomainSchema = z
  .string()
  .regex(/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/, "DEMO_COOKIE_DOMAIN must be a bare host name such as admin-os.lr0y.dev");

/** Whether `host` (with or without a port) is `domain` or one of its subdomains. */
const isWithin = (host: string, domain: string): boolean => {
  const bare = host.toLowerCase().replace(/:[0-9]+$/, "");
  return bare === domain || bare.endsWith(`.${domain}`);
};

/**
 * The scope of the demo cookies (`demo_sid`, `demo_role`). With `DEMO_COOKIE_DOMAIN` set and the request served on
 * that domain or a subdomain of it, they carry a `Domain`, so the apex host and its subdomains (the MCP Worker's
 * consent page) read the same visitor; on any other host (localhost, a workers.dev preview) they stay host-only,
 * since a browser drops a cookie for a foreign domain. They are `Secure` when they carry a domain or this is a
 * production build; plain-http localhost keeps them readable.
 */
export function demoCookieScope(
  env: Readonly<Record<string, string | undefined>>,
  host: string | null | undefined,
): { readonly domain?: string; readonly secure?: true } {
  const configured = env.DEMO_COOKIE_DOMAIN;
  const configuredDomain =
    configured === undefined || configured === "" ? undefined : cookieDomainSchema.parse(configured);
  const domain =
    configuredDomain !== undefined && host && isWithin(host, configuredDomain) ? configuredDomain : undefined;
  const secure = domain !== undefined || env.NODE_ENV === "production";
  return { ...(domain === undefined ? {} : { domain }), ...(secure ? { secure: true as const } : {}) };
}
