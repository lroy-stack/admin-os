import {
  createMcpHandler,
  getOAuthProtectedResourceMetadataUrl,
  originValidationResponse,
} from "@modelcontextprotocol/server";

import { CATALOG } from "@/config/catalog";
import { createMcpServerFor } from "@/config/mcp.server";
import { authenticate, callerOfAuthInfo, protectedResourceMetadata } from "@/config/mcp-auth";
import { MCP_PATH } from "@/config/mcp-endpoint";
import { mcpReadOnlyFrom, usesPublicDemoTokens } from "@/config/mcp-env";
import { MCP_MANIFEST } from "@/config/mcp-manifest";
import { SERVER_NAME, toolListVersion } from "@/core/mcp/server";

import { type McpWorkerEnv, rateLimitPeriodOf, variablesOf } from "./env";
import { allowedOriginsFor, jsonRpcError, preflightResponse, withCors } from "./http";
import { callLineOf } from "./log";

/** Tool arguments are small; a body past this is refused with `413` before anything is parsed. */
const MAX_REQUEST_BODY_BYTES = 256 * 1024;

/**
 * The limiter's bucket: the token's session, or, while the public demo tokens are in force, the session and the
 * client's IP, since every visitor holds those tokens and one client must not lock the others out.
 */
const limitKeyOf = (request: Request, variables: Readonly<Record<string, string | undefined>>, sessionId: string) =>
  usesPublicDemoTokens(variables) ? `${sessionId}:${request.headers.get("cf-connecting-ip") ?? "unknown"}` : sessionId;

/** `429` with `Retry-After` past the limit, `503` when the limiter itself fails; undefined when the call may go on. */
async function rateLimited(
  request: Request,
  env: McpWorkerEnv,
  variables: Readonly<Record<string, string | undefined>>,
  sessionId: string,
): Promise<Response | undefined> {
  const periodS = rateLimitPeriodOf(variables);
  try {
    const { success } = await env.MCP_LIMITER.limit({ key: limitKeyOf(request, variables, sessionId) });
    if (success) return undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ event: "mcp.limiter.error", message }));
    return jsonRpcError(503, "The rate limiter is unavailable; retry the request shortly.", { "Retry-After": "1" });
  }
  return jsonRpcError(429, `Too many requests for this token; retry after ${periodS} seconds.`, {
    "Retry-After": String(periodS),
  });
}

/**
 * Streamable HTTP at `/mcp` (ADR 0016, request path): Origin, CORS, the bearer token, the rate limit, then the SDK's
 * stateless handler over the composition root. `legacy: "stateless"` keeps 2025-era clients (most clients today)
 * working from the same factory; `reject` would refuse them.
 */
async function serveMcp(request: Request, env: McpWorkerEnv, resource: URL): Promise<Response> {
  const variables = variablesOf(env);
  const authentication = await authenticate(request, variables, resource);
  if (!authentication.ok) return authentication.response;
  const refused = await rateLimited(request, env, variables, authentication.caller.sessionId);
  if (refused !== undefined) return refused;
  const clientId = authentication.authInfo.clientId;
  const handler = createMcpHandler(
    ({ authInfo }) =>
      createMcpServerFor(callerOfAuthInfo(authInfo), {
        env: variables,
        readOnly: mcpReadOnlyFrom(variables),
        store: () => env.DEMO_STORE,
        logger: (line) => console.log(JSON.stringify(callLineOf(line, clientId))),
      }),
    {
      legacy: "stateless",
      maxRequestBodySize: MAX_REQUEST_BODY_BYTES,
      onerror: (error) => console.error(JSON.stringify({ event: "mcp.http.error", message: error.message })),
    },
  );
  return handler.fetch(request, { authInfo: authentication.authInfo });
}

/** `GET /`: what this is and where to connect. */
const health = (url: URL, env: McpWorkerEnv): Response =>
  Response.json({
    name: SERVER_NAME,
    version: toolListVersion(CATALOG, MCP_MANIFEST, mcpReadOnlyFrom(variablesOf(env))),
    mcp: new URL(MCP_PATH, url).href,
  });

const route = async (request: Request, env: McpWorkerEnv, url: URL): Promise<Response> => {
  const resource = new URL(MCP_PATH, url);
  // `/mcp/` is `/mcp`: a client that adds a slash still reaches the endpoint.
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (request.method === "OPTIONS") return preflightResponse(request);
  if (path === MCP_PATH) return serveMcp(request, env, resource);
  if (request.method === "GET" && path === "/") return health(url, env);
  if (request.method === "GET" && path === new URL(getOAuthProtectedResourceMetadataUrl(resource)).pathname) {
    return protectedResourceMetadata(resource);
  }
  return jsonRpcError(404, `Nothing here; MCP is served at ${resource.href}.`);
};

export default {
  async fetch(request: Request, env: McpWorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    // A present Origin that is not allowed is a 403 before anything else runs (Streamable HTTP, 2026-07-28: MUST).
    const rejected = originValidationResponse(request, allowedOriginsFor(url));
    if (rejected !== undefined) return rejected;
    return withCors(request, await route(request, env, url));
  },
} satisfies ExportedHandler<McpWorkerEnv>;
