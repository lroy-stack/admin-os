import { z } from "zod";

import { ROLE_IDS, type RoleId } from "@/core/access";
import { SCOPES, type Scope, scopesOf } from "@/core/mcp/server";

/**
 * The MCP transports' environment (ADR 0009): which bearer token acts as which role over HTTP (`MCP_TOKENS`) and
 * which role the stdio process acts as (`MCP_ROLE`). Parsed at the boundary; a malformed value fails loudly.
 */

/**
 * The public demo tokens, used only while `MCP_TOKENS` is unset and the adapter is the mock one: they reach demo
 * data only, and each token gets its own demo session. A real backend sets `MCP_TOKENS` or gets no token at all.
 */
export const DEMO_MCP_TOKENS = "demo-owner-token:owner,demo-manager-token:manager,demo-staff-token:staff";

/** RFC 6750 `b64token`, 8 to 256 characters. */
const tokenSchema = z
  .string()
  .min(8)
  .max(256)
  .regex(/^[A-Za-z0-9\-._~+/]+=*$/);

const entrySchema = z.tuple([tokenSchema, z.enum(ROLE_IDS)]);

/** `"<token>:<role>,<token>:<role>"` → token → role. The error never echoes a token: they are secrets. */
export function parseMcpTokens(raw: string): ReadonlyMap<string, RoleId> {
  const tokens = new Map<string, RoleId>();
  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
  entries.forEach((entry, index) => {
    const separator = entry.lastIndexOf(":");
    const parsed = entrySchema.safeParse(
      separator < 0 ? [entry] : [entry.slice(0, separator), entry.slice(separator + 1)],
    );
    if (!parsed.success) {
      throw new Error(
        `MCP_TOKENS entry ${index + 1} must be "<token>:<role>": a token of 8 to 256 characters [A-Za-z0-9-._~+/] and a role in ${ROLE_IDS.join(", ")}.`,
      );
    }
    const [token, roleId] = parsed.data;
    if (tokens.has(token))
      throw new Error(`MCP_TOKENS entry ${index + 1} repeats an earlier token; each token maps to one role.`);
    tokens.set(token, roleId);
  });
  return tokens;
}

type Env = Readonly<Record<string, string | undefined>>;

/** The public demo tokens are in force: no `MCP_TOKENS`, and the mock adapter (an empty value is unset, as in getAdapter). */
export const usesPublicDemoTokens = (env: Env): boolean =>
  !env.MCP_TOKENS?.trim() && [undefined, "", "mock"].includes(env.DATA_ADAPTER);

/** The token map in force: `MCP_TOKENS` when set, the demo tokens on the mock adapter, otherwise none. */
export function mcpTokensFrom(env: Env): ReadonlyMap<string, RoleId> {
  const raw = env.MCP_TOKENS?.trim();
  if (raw) return parseMcpTokens(raw);
  return usesPublicDemoTokens(env) ? parseMcpTokens(DEMO_MCP_TOKENS) : new Map();
}

const readOnlySchema = z.enum(["true", "false"]);

/** `MCP_READ_ONLY` as written: `true`, `false`, or unset (`undefined`). A malformed value fails loudly. */
export function parseReadOnly(raw: string | undefined): boolean | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  const parsed = readOnlySchema.safeParse(value);
  if (!parsed.success) throw new Error(`MCP_READ_ONLY must be "true" or "false"; got "${value}".`);
  return parsed.data === "true";
}

/**
 * Whether the HTTP server offers read tools only: `MCP_READ_ONLY` when set, otherwise read-only exactly while the
 * public demo tokens are in force. Anyone holds those tokens and every holder shares one demo session, so a write
 * one visitor makes would reach the next visitor's agent (spec 004).
 */
export function mcpReadOnlyFrom(env: Env): boolean {
  return parseReadOnly(env.MCP_READ_ONLY) ?? usesPublicDemoTokens(env);
}

/**
 * Whether the server of an OAuth grant offers read tools only: `MCP_READ_ONLY` when set, otherwise not. A grant is one
 * person's consent on their own demo session, and its scopes already keep writes out until that person grants
 * `write` (spec 004 D3), so the public tokens' default does not apply to it.
 */
export function grantReadOnlyFrom(env: Env): boolean {
  return parseReadOnly(env.MCP_READ_ONLY) ?? false;
}

const stdioRoleSchema = z.enum(ROLE_IDS).default("staff");

/** The stdio actor's role: `MCP_ROLE`, `staff` (the least privilege) when unset. */
export function mcpRoleFrom(raw: string | undefined): RoleId {
  const parsed = stdioRoleSchema.safeParse(raw === "" ? undefined : raw);
  if (!parsed.success) throw new Error(`MCP_ROLE must be one of ${ROLE_IDS.join(", ")}; got "${String(raw)}".`);
  return parsed.data;
}

/** Scopes separated by spaces or commas, as OAuth writes them (`"read write"`) or as a list (`"read,write"`). */
const stdioScopesSchema = z
  .string()
  .transform((text) => text.split(/[\s,]+/).filter((scope) => scope !== ""))
  .pipe(z.array(z.enum(SCOPES)).min(1));

/**
 * The stdio actor's scopes (spec 004 D3, plan A2): `MCP_SCOPES`, `read` when unset, so a stdio process reads unless
 * its developer grants `write` as a person grants it over OAuth. A malformed value fails loudly.
 */
export function mcpScopesFrom(raw: string | undefined): readonly Scope[] {
  if (raw === undefined || raw.trim() === "") return ["read"];
  const parsed = stdioScopesSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`MCP_SCOPES must be scopes from ${SCOPES.join(", ")}, such as "read write"; got "${raw}".`);
  }
  return scopesOf(parsed.data);
}
