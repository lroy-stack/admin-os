import {
  ExternalTokenError,
  OAuthProvider,
  type OAuthResourceAuth,
  type OAuthResourceContext,
  type ResolveExternalTokenInput,
  type ResolveExternalTokenResult,
} from "@cloudflare/workers-oauth-provider";
import { createMcpHandler, originValidationResponse } from "@modelcontextprotocol/server";
import { z } from "zod";

import { CATALOG } from "@/config/catalog";
import { DEMO_SESSION_MAX_AGE_S } from "@/config/demo-session";
import { createMcpServerFor, type McpCaller, type McpEnv } from "@/config/mcp.server";
import { callerOfToken } from "@/config/mcp-auth";
import { MCP_PATH } from "@/config/mcp-endpoint";
import { grantReadOnlyFrom, mcpReadOnlyFrom, usesPublicDemoTokens } from "@/config/mcp-env";
import { MCP_MANIFEST } from "@/config/mcp-manifest";
import { roleIdSchema } from "@/core/access";
import { SCOPES, SERVER_NAME, scopesOf, toolListVersion } from "@/core/mcp/server";

import { serveAuthorize } from "./consent";
import { type McpWorkerEnv, rateLimitPeriodOf, variablesOf } from "./env";
import { GRANTS_PATH, serveGrants } from "./grants";
import { allowedOriginsFor, jsonRpcError, preflightResponse, withCors } from "./http";
import { clientIpOf, oauthRefusal, overLimit, type Refusal } from "./limits";
import { callLineOf } from "./log";
import { scopeChallenge } from "./scope-gate";

/** Tool arguments are small; a body past this is refused with `413` before anything is parsed. */
const MAX_REQUEST_BODY_BYTES = 256 * 1024;

/** The authorization server's own endpoints (ADR 0016 D4): the consent page, the token endpoint and DCR. */
const AUTHORIZE_PATH = "/authorize";
const TOKEN_PATH = "/token";
const REGISTER_PATH = "/register";
/** The Worker's own HTML pages: their forms post to themselves, so they accept only the Worker's own Origin. */
const PAGE_PATHS: ReadonlySet<string> = new Set([AUTHORIZE_PATH, GRANTS_PATH]);
/** The pages a person's browser opens and the registration endpoint: tight per-IP limits (`limitBefore`). */
const OAUTH_PATHS: ReadonlySet<string> = new Set([AUTHORIZE_PATH, REGISTER_PATH, GRANTS_PATH]);

/** What every request with a grant or a static token carries (`ctx.props`), parsed before the server is built. */
const propsSchema = z.object({ sessionId: z.string().min(1).max(128), role: roleIdSchema });

/**
 * `MCP_TOKENS` and the public demo tokens, which are not grants: the provider hands every bearer it did not issue to
 * this resolver. A malformed `MCP_TOKENS` is the deployment's fault, logged without the value, and answers `500`.
 */
async function resolveStaticToken({ token, env }: ResolveExternalTokenInput<McpWorkerEnv>, resource: string) {
  let caller: McpCaller | undefined;
  try {
    caller = await callerOfToken(token, variablesOf(env));
  } catch (error) {
    console.error(
      JSON.stringify({ event: "mcp.auth.error", message: error instanceof Error ? error.message : String(error) }),
    );
    throw new ExternalTokenError("server_error", {
      description: "The server's token configuration is invalid.",
      statusCode: 500,
    });
  }
  if (caller === undefined) return null;
  return {
    props: { sessionId: caller.sessionId, role: caller.roleId },
    audience: resource,
  } satisfies ResolveExternalTokenResult;
}

/**
 * The limiter's bucket: one per grant (its visitor's session and client), or, for the static tokens, the token's
 * session, and also the client's IP while the public demo tokens are in force, since every visitor holds those.
 */
const limitKeyOf = (request: Request, variables: McpEnv, caller: McpCaller): string => {
  if (caller.clientId !== undefined) return `grant:${caller.sessionId}:${caller.clientId}`;
  return usesPublicDemoTokens(variables) ? `${caller.sessionId}:${clientIpOf(request)}` : caller.sessionId;
};

/**
 * Who calls: a grant (the provider names its client) acts with the scopes the person consented to, under
 * `MCP_READ_ONLY` only; a static token holds both scopes, under the server's read-only default.
 */
const callerOf = (auth: OAuthResourceAuth, props: unknown, variables: McpEnv) => {
  const { sessionId, role } = propsSchema.parse(props);
  if (auth.clientId === undefined) {
    return {
      caller: { roleId: role, sessionId, scopes: SCOPES } satisfies McpCaller,
      readOnly: mcpReadOnlyFrom(variables),
    };
  }
  return {
    caller: { roleId: role, sessionId, scopes: scopesOf(auth.scope), clientId: auth.clientId } satisfies McpCaller,
    readOnly: grantReadOnlyFrom(variables),
  };
};

/**
 * Streamable HTTP at `/mcp` (ADR 0016, request path), after the provider has verified the bearer for this resource:
 * the rate limit, the step-up gate for a grant, then the SDK's stateless handler over the composition root.
 * `legacy: "stateless"` keeps 2025-era clients (most clients today) working from the same factory; `reject` would
 * refuse them.
 */
async function serveMcp(request: Request, env: McpWorkerEnv, ctx: ExecutionContext): Promise<Response> {
  // OAuthProvider sets `ctx.auth` beside `ctx.props` for its API handler (docs/resource-servers.md).
  const { auth, props } = ctx as OAuthResourceContext<unknown>;
  const variables = variablesOf(env);
  const { caller, readOnly } = callerOf(auth, props, variables);
  const refused = await overLimit(
    env.MCP_LIMITER,
    limitKeyOf(request, variables, caller),
    rateLimitPeriodOf(variables),
    (status, message, headers) => jsonRpcError(status, message, headers),
  );
  if (refused !== undefined) return refused;
  const clientId = caller.clientId ?? `demo-${caller.roleId}`;
  // Under MCP_READ_ONLY no scope helps, so a write keeps its read-only answer; a static token cannot step up.
  if (!readOnly && caller.clientId !== undefined) {
    const challenge = await scopeChallenge(request, caller, variables, auth, MAX_REQUEST_BODY_BYTES);
    if (challenge !== undefined) {
      // A challenged call is audited like the projection's refusals: one line, no arguments.
      const refusal = {
        event: "mcp.refused",
        tool: challenge.tool,
        status: "insufficient_scope",
        correlationId: crypto.randomUUID(),
        actorRole: caller.roleId,
        via: "mcp",
      } as const;
      console.log(JSON.stringify(callLineOf(refusal, clientId)));
      return challenge.response;
    }
  }
  const handler = createMcpHandler(
    () =>
      createMcpServerFor(caller, {
        env: variables,
        readOnly,
        store: () => env.DEMO_STORE,
        logger: (line) => console.log(JSON.stringify(callLineOf(line, clientId))),
      }),
    {
      legacy: "stateless",
      maxRequestBodySize: MAX_REQUEST_BODY_BYTES,
      onerror: (error) => console.error(JSON.stringify({ event: "mcp.http.error", message: error.message })),
    },
  );
  return handler.fetch(request);
}

/** `GET /`: what this is, the tool-list version an OAuth client is served, and where to connect. */
const health = (url: URL, env: McpWorkerEnv): Response =>
  Response.json({
    name: SERVER_NAME,
    version: toolListVersion(CATALOG, MCP_MANIFEST, grantReadOnlyFrom(variablesOf(env))),
    mcp: new URL(MCP_PATH, url).href,
  });

/** Everything the provider does not own: the consent and grants pages, the health answer, a pointer to `/mcp`. */
const serveDefault = async (request: Request, env: McpWorkerEnv): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const page = request.method === "GET" || request.method === "POST";
  if (page && path === AUTHORIZE_PATH) return serveAuthorize(request, env);
  if (page && path === GRANTS_PATH) return serveGrants(request, env);
  if (request.method === "GET" && path === "/") return health(url, env);
  return jsonRpcError(404, `Nothing here; MCP is served at ${new URL(MCP_PATH, url).href}.`);
};

/**
 * One authorization server and one resource per origin the Worker answers on: `https://mcp.admin-os.lr0y.dev` in
 * production, `http://localhost:<port>` under `wrangler dev`. The resource is that origin's `/mcp`, so every token is
 * bound to it (RFC 8707) and its metadata is served at `/.well-known/oauth-protected-resource/mcp` (RFC 9728).
 */
const providers = new Map<string, OAuthProvider<McpWorkerEnv>>();

const providerFor = (origin: string): OAuthProvider<McpWorkerEnv> => {
  const known = providers.get(origin);
  if (known !== undefined) return known;
  const resource = new URL(MCP_PATH, origin).href;
  const provider = new OAuthProvider<McpWorkerEnv>({
    apiRoute: MCP_PATH,
    apiHandler: { fetch: serveMcp },
    defaultHandler: { fetch: serveDefault },
    authorizeEndpoint: AUTHORIZE_PATH,
    tokenEndpoint: TOKEN_PATH,
    clientRegistrationEndpoint: REGISTER_PATH,
    clientIdMetadataDocumentEnabled: true,
    scopesSupported: ["read", "write"],
    requiredScopes: ["read"],
    resourceMetadata: { resource, resource_name: "admin-OS", bearer_methods_supported: ["header"] },
    // A grant acts on a demo session, which the store drops after two idle hours: an idle grant ends with it.
    refreshTokenTTL: DEMO_SESSION_MAX_AGE_S,
    refreshTokenIdleTTL: DEMO_SESSION_MAX_AGE_S,
    resolveExternalToken: (input) => resolveStaticToken(input, resource),
  });
  providers.set(origin, provider);
  return provider;
};

/**
 * The per-IP limit a request meets before the provider reads KV for it, or undefined for routes without one:
 * - `/authorize`, `/grants` and `/register` are a person's browser and a client's one-time registration, and each
 *   registration writes KV, so they share the tight `OAUTH_LIMITER`;
 * - `/token` and `/mcp` are what a client does all day, and a hosted client (claude.ai) calls them for all its users
 *   from a few egress IPs, so they take the wide `EDGE_LIMITER`. It bounds the KV reads an unauthenticated bearer
 *   costs; a valid grant then meets its own bucket in `serveMcp`. A CIMD client's id is shared by every installation,
 *   so keying `/token` by client would be no narrower than by IP.
 */
const limitBefore = (
  path: string,
  env: McpWorkerEnv,
): { limiter: RateLimit; bucket: string; refuse: Refusal } | undefined => {
  if (OAUTH_PATHS.has(path)) return { limiter: env.OAUTH_LIMITER, bucket: path, refuse: oauthRefusal };
  if (path === TOKEN_PATH) return { limiter: env.EDGE_LIMITER, bucket: path, refuse: oauthRefusal };
  // The provider routes the resource's path-boundary descendants to the API handler too (`/mcp/…`), so they share
  // `/mcp`'s rule and its one bucket: a sub-path never buys a fresh window or an unlimited KV read.
  if (path === MCP_PATH || path.startsWith(`${MCP_PATH}/`)) {
    return { limiter: env.EDGE_LIMITER, bucket: MCP_PATH, refuse: jsonRpcError };
  }
  return undefined;
};

const route = async (request: Request, env: McpWorkerEnv, ctx: ExecutionContext, url: URL): Promise<Response> => {
  if (request.method === "OPTIONS") return preflightResponse(request);
  const path = url.pathname.replace(/\/+$/, "");
  const limit = limitBefore(path, env);
  if (limit !== undefined) {
    const key = `${limit.bucket}:${clientIpOf(request)}`;
    const refused = await overLimit(limit.limiter, key, rateLimitPeriodOf(variablesOf(env)), limit.refuse);
    if (refused !== undefined) return refused;
  }
  return providerFor(url.origin).fetch(request, env, ctx);
};

export default {
  async fetch(request: Request, env: McpWorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    // A present Origin that is not allowed is a 403 before anything else runs (Streamable HTTP, 2026-07-28: MUST).
    const ownPage = PAGE_PATHS.has(url.pathname.replace(/\/+$/, ""));
    const rejected = originValidationResponse(request, allowedOriginsFor(url, ownPage));
    if (rejected !== undefined) return rejected;
    return withCors(request, await route(request, env, ctx, url));
  },
} satisfies ExportedHandler<McpWorkerEnv>;
