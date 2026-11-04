/**
 * The demo cookies as the MCP Worker reads and writes them, with the same attributes the web app gives them
 * (`demo-session.server.ts`, `demo-cookie.ts`).
 */

/**
 * The value of cookie `name`, or undefined. When a name appears twice (a host-only cookie beside the domain cookie
 * that replaced it), the last one wins, as in the web app: browsers send older cookies first (ADR 0016, resolution 2).
 */
export const cookieOf = (request: Request, name: string): string | undefined => {
  const values = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`))
    .map((part) => part.slice(name.length + 1));
  const value = values.at(-1);
  if (value === undefined) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
};

/** A `Set-Cookie` value for an httpOnly, `SameSite=Lax` cookie on the whole host, scoped by `demoCookieScope`. */
export const sessionCookieHeader = (
  name: string,
  value: string,
  maxAgeS: number,
  scope: { readonly domain?: string; readonly secure?: true },
): string =>
  [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAgeS}`,
    "HttpOnly",
    "SameSite=Lax",
    ...(scope.domain === undefined ? [] : [`Domain=${scope.domain}`]),
    ...(scope.secure === undefined ? [] : ["Secure"]),
  ].join("; ");
