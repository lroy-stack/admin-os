import "server-only";

import { cookies } from "next/headers";

export interface CookieWriteOptions {
  readonly maxAge: number;
  readonly sameSite?: "lax" | "strict";
  readonly httpOnly?: boolean;
  /** Shares the cookie with the subdomains of this host; unset keeps it host-only. */
  readonly domain?: string;
  /** Forces `Secure` outside production, for a cookie that is served over https there. */
  readonly secure?: boolean;
}

/**
 * Reads a cookie in a Server Component or Server Action. This module is deliberately not `"use server"`: a Server
 * Action is a public endpoint, and a generic reader there would hand any cookie, httpOnly session cookies included,
 * to whoever calls it. Wrap it in code that decides which cookie to read; never pass a name that came from the client.
 */
export async function readCookie(name: string): Promise<string | undefined> {
  return (await cookies()).get(name)?.value;
}

/**
 * Writes a cookie from a Server Action. Same rule as `readCookie`: only a Server Action that validates both the name
 * and the value may call it. Site-wide, and `secure` in production.
 */
export async function writeCookie(name: string, value: string, options: CookieWriteOptions): Promise<void> {
  (await cookies()).set(name, value, {
    path: "/",
    maxAge: options.maxAge,
    ...(options.sameSite ? { sameSite: options.sameSite } : {}),
    ...(options.httpOnly ? { httpOnly: true } : {}),
    ...(options.domain ? { domain: options.domain } : {}),
    ...(options.secure || process.env.NODE_ENV === "production" ? { secure: true } : {}),
  });
}
