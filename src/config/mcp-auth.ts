import {
  type AuthInfo,
  bearerAuthChallengeResponse,
  getOAuthProtectedResourceMetadataUrl,
  OAuthError,
  OAuthErrorCode,
  type OAuthProtectedResourceMetadata,
  type OAuthTokenVerifier,
  verifyBearerToken,
} from "@modelcontextprotocol/server";
import { z } from "zod";

import { ROLE_IDS, type RoleId } from "@/core/access";

import type { McpCaller, McpEnv } from "./mcp.server";
import { mcpTokensFrom } from "./mcp-env";

/**
 * How an HTTP door learns who calls (ADR 0009): a bearer demo token names a role and, through its hash, one demo
 * session. This is the one place that decides it, so plan A1a swaps it for `workers-oauth-provider` grants
 * (`{sessionId, role, scopes}`) without touching the server it hands the caller to.
 */

/** A demo token never expires, but the SDK refuses an `AuthInfo` without `expiresAt`: it holds for this request. */
const VERIFIED_FOR_S = 60 * 60;

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

/** The caller a token stands for, or undefined when the token is not one of `MCP_TOKENS` (or the demo tokens). */
export async function callerOfToken(token: string, env: McpEnv): Promise<McpCaller | undefined> {
  const digest = await digestOf(token);
  const roleId = (await rolesByDigest(env)).get(digest);
  return roleId === undefined ? undefined : { roleId, sessionId: `mcp-${digest.slice(0, 32)}` };
}

/** What the verifier puts in `AuthInfo.extra`; the server factory never runs without it. */
const callerSchema = z.object({ roleId: z.enum(ROLE_IDS), sessionId: z.string().min(1) });

/** The caller the SDK hands back to the server factory, read from the `AuthInfo` `authenticate` produced. */
export const callerOfAuthInfo = (authInfo: AuthInfo | undefined): McpCaller => callerSchema.parse(authInfo?.extra);

export type Authentication =
  | { readonly ok: true; readonly caller: McpCaller; readonly authInfo: AuthInfo }
  | { readonly ok: false; readonly response: Response };

/**
 * Verifies the request's bearer token for `resource`. A missing, malformed or unknown token is a `401` whose
 * `WWW-Authenticate` names the protected-resource metadata; no token never falls back to a role.
 */
export async function authenticate(request: Request, env: McpEnv, resource: URL): Promise<Authentication> {
  const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(resource);
  const verifier: OAuthTokenVerifier = {
    async verifyAccessToken(token) {
      const caller = await callerOfToken(token, env);
      if (caller === undefined) {
        throw new OAuthError(
          OAuthErrorCode.InvalidToken,
          "Unknown token; use a token from MCP_TOKENS (see .env.example)",
        );
      }
      return {
        token,
        clientId: `demo-${caller.roleId}`,
        scopes: [],
        expiresAt: Math.floor(Date.now() / 1000) + VERIFIED_FOR_S,
        extra: { ...caller },
      };
    },
  };
  try {
    const authInfo = await verifyBearerToken(request.headers.get("authorization"), { verifier, resourceMetadataUrl });
    return { ok: true, caller: callerOfAuthInfo(authInfo), authInfo };
  } catch (error) {
    // A token the server refuses is an OAuthError and the client's problem; anything else (a malformed MCP_TOKENS)
    // is the deployment's, and must reach the logs. parseMcpTokens never puts a token in its message.
    if (!(error instanceof OAuthError)) {
      console.error(
        JSON.stringify({ event: "mcp.auth.error", message: error instanceof Error ? error.message : String(error) }),
      );
    }
    return { ok: false, response: bearerAuthChallengeResponse(error, { resourceMetadataUrl }) };
  }
}

/**
 * RFC 9728 protected-resource metadata for `resource`. No `authorization_servers`: the demo tokens are static bearer
 * tokens, not OAuth-issued; plan A1a adds the authorization server with `workers-oauth-provider`.
 */
export function protectedResourceMetadata(resource: URL): Response {
  const document: OAuthProtectedResourceMetadata = {
    resource: resource.href,
    bearer_methods_supported: ["header"],
    resource_name: "admin-OS",
    resource_documentation: "https://github.com/lroy-stack/admin-os#mcp",
  };
  return Response.json(document, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" },
  });
}
