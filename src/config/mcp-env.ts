import { z } from "zod";

import { ROLE_IDS, type RoleId } from "@/core/access";

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

/** The token map in force: `MCP_TOKENS` when set, the demo tokens on the mock adapter, otherwise none. */
export function mcpTokensFrom(env: Readonly<Record<string, string | undefined>>): ReadonlyMap<string, RoleId> {
  const raw = env.MCP_TOKENS?.trim();
  if (raw) return parseMcpTokens(raw);
  // An empty DATA_ADAPTER is unset, as in getAdapter: the mock adapter.
  const onMock = [undefined, "", "mock"].includes(env.DATA_ADAPTER);
  return onMock ? parseMcpTokens(DEMO_MCP_TOKENS) : new Map();
}

const stdioRoleSchema = z.enum(ROLE_IDS).default("staff");

/** The stdio actor's role: `MCP_ROLE`, `staff` (the least privilege) when unset. */
export function mcpRoleFrom(raw: string | undefined): RoleId {
  const parsed = stdioRoleSchema.safeParse(raw === "" ? undefined : raw);
  if (!parsed.success) throw new Error(`MCP_ROLE must be one of ${ROLE_IDS.join(", ")}; got "${String(raw)}".`);
  return parsed.data;
}
