import "server-only";

import {
  type AuthInfo,
  bearerAuthChallengeResponse,
  createMcpHandler,
  getOAuthProtectedResourceMetadataUrl,
  OAuthError,
  OAuthErrorCode,
  type OAuthProtectedResourceMetadata,
  type OAuthTokenVerifier,
  verifyBearerToken,
} from "@modelcontextprotocol/server";
import { z } from "zod";

import { ROLE_IDS } from "@/core/access";

import { demoActor } from "./actor";
import { createMcpServer } from "./mcp.server";
import { mcpReadOnlyFrom, mcpTokensFrom } from "./mcp-env";
import { resolveVertical } from "./vertical";

/**
 * The Streamable HTTP door of the MCP server (ADR 0009): a bearer demo token resolves the actor and its demo
 * session, then the SDK's per-request handler serves both protocol eras from one factory.
 */

/** The route that serves MCP; the RFC 9728 document lives at its path-aware well-known location. */
export const MCP_PATH = "/api/mcp";

/** A demo token never expires, but the SDK refuses an `AuthInfo` without `expiresAt`: it holds for this request. */
const VERIFIED_FOR_S = 60 * 60;

const resourceUrlOf = (request: Request): URL => new URL(MCP_PATH, request.url);

export const resourceMetadataUrlOf = (request: Request): string =>
  getOAuthProtectedResourceMetadataUrl(resourceUrlOf(request));

/** One demo session per token: the same token sees its own writes, another token never does (ADR 0005). */
const sessionIdOf = async (token: string): Promise<string> => {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
  const hex = Array.from(digest.subarray(0, 16), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `mcp-${hex}`;
};

const verifier: OAuthTokenVerifier = {
  async verifyAccessToken(token) {
    const roleId = mcpTokensFrom(process.env).get(token);
    if (roleId === undefined) {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        "Unknown token; use a token from MCP_TOKENS (see .env.example)",
      );
    }
    return {
      token,
      clientId: `demo-${roleId}`,
      scopes: [],
      expiresAt: Math.floor(Date.now() / 1000) + VERIFIED_FOR_S,
      extra: { roleId, sessionId: await sessionIdOf(token) },
    };
  },
};

/** What the verifier puts in `AuthInfo.extra`; the factory never runs without it. */
const verifiedSchema = z.object({ roleId: z.enum(ROLE_IDS), sessionId: z.string().min(1) });

const handler = createMcpHandler(
  ({ authInfo }) => {
    const { roleId, sessionId } = verifiedSchema.parse(authInfo?.extra);
    // MCP clients carry no demo cookies, so the preset is the deployment's (VERTICAL), as over stdio.
    const vertical = resolveVertical(process.env.VERTICAL);
    return createMcpServer({
      actor: demoActor(roleId, vertical),
      vertical: vertical.id,
      sessionId,
      readOnly: mcpReadOnlyFrom(process.env),
    });
  },
  { onerror: (error) => console.error(JSON.stringify({ event: "mcp.http.error", message: error.message })) },
);

/**
 * GET, POST and DELETE on `/api/mcp`. A missing, malformed or unknown token is a `401` whose `WWW-Authenticate`
 * names the protected-resource metadata; no token never falls back to a role.
 */
export async function handleMcpRequest(request: Request): Promise<Response> {
  const resourceMetadataUrl = resourceMetadataUrlOf(request);
  let authInfo: AuthInfo;
  try {
    authInfo = await verifyBearerToken(request.headers.get("authorization"), { verifier, resourceMetadataUrl });
  } catch (error) {
    return bearerAuthChallengeResponse(error, { resourceMetadataUrl });
  }
  return handler.fetch(request, { authInfo });
}

/**
 * RFC 9728 protected-resource metadata. No `authorization_servers`: the demo tokens are static bearer tokens, not
 * OAuth-issued; a real deployment adds its authorization server here and swaps the verifier (ADR 0009).
 */
export function protectedResourceMetadata(request: Request): Response {
  const document: OAuthProtectedResourceMetadata = {
    resource: resourceUrlOf(request).href,
    bearer_methods_supported: ["header"],
    resource_name: "admin-OS",
    resource_documentation: "https://github.com/lroy-stack/admin-os#mcp",
  };
  return Response.json(document, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" },
  });
}
