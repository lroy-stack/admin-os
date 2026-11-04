import "server-only";

import { createMcpHandler } from "@modelcontextprotocol/server";

import { createMcpServerFor } from "./mcp.server";
import { authenticate, callerOfAuthInfo, protectedResourceMetadata as metadataFor } from "./mcp-auth";
import { mcpReadOnlyFrom } from "./mcp-env";
import { webStoreNamespace } from "./web-store.server";

/**
 * The Streamable HTTP door of the MCP server inside the web app (ADR 0009): a bearer demo token resolves the actor and
 * its demo session, then the SDK's per-request handler serves both protocol eras from one factory.
 */

/** The route that serves MCP; the RFC 9728 document lives at its path-aware well-known location. */
export const MCP_PATH = "/api/mcp";

const resourceUrlOf = (request: Request): URL => new URL(MCP_PATH, request.url);

const handler = createMcpHandler(
  ({ authInfo }) =>
    createMcpServerFor(callerOfAuthInfo(authInfo), {
      env: process.env,
      readOnly: mcpReadOnlyFrom(process.env),
      store: webStoreNamespace,
    }),
  { onerror: (error) => console.error(JSON.stringify({ event: "mcp.http.error", message: error.message })) },
);

/** GET, POST and DELETE on `/api/mcp`. */
export async function handleMcpRequest(request: Request): Promise<Response> {
  const authentication = await authenticate(request, process.env, resourceUrlOf(request));
  if (!authentication.ok) return authentication.response;
  return handler.fetch(request, { authInfo: authentication.authInfo });
}

/** RFC 9728 protected-resource metadata for `/api/mcp`. */
export const protectedResourceMetadata = (request: Request): Response => metadataFor(resourceUrlOf(request));
