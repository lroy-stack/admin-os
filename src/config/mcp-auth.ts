import type { RoleId } from "@/core/access";

import type { McpCaller, McpEnv } from "./mcp.server";
import { mcpTokensFrom } from "./mcp-env";

/**
 * The static bearer tokens of the HTTP door (ADR 0009): a token from `MCP_TOKENS`, or a public demo token, names a
 * role and, through its hash, one demo session of its own. OAuth grants (ADR 0016 D4) are the MCP Worker's other way
 * in; `workers-oauth-provider` hands it these tokens when they are not grants (`resolveExternalToken`).
 */

/** The SHA-256 of a token, as hex: what the doors compare and key on, so a raw token is never a map key. */
const digestOf = async (token: string): Promise<string> => {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

/** One demo session per token: the same token sees its own writes, another token never does (ADR 0005). */
export const demoSessionOf = async (token: string): Promise<string> => `mcp-${(await digestOf(token)).slice(0, 32)}`;

/** The token map in force, keyed by each token's digest. */
const rolesByDigest = async (env: McpEnv): Promise<ReadonlyMap<string, RoleId>> =>
  new Map(
    await Promise.all([...mcpTokensFrom(env)].map(async ([token, roleId]) => [await digestOf(token), roleId] as const)),
  );

/**
 * The caller a token stands for, or undefined when the token is not one of `MCP_TOKENS` (or the demo tokens). A
 * malformed `MCP_TOKENS` throws; its message never carries a token.
 */
export async function callerOfToken(token: string, env: McpEnv): Promise<McpCaller | undefined> {
  const digest = await digestOf(token);
  const roleId = (await rolesByDigest(env)).get(digest);
  return roleId === undefined ? undefined : { roleId, sessionId: `mcp-${digest.slice(0, 32)}` };
}
