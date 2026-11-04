import { localhostAllowedHostnames, localhostAllowedOrigins } from "@modelcontextprotocol/server";

/**
 * The browser-facing edge of the MCP Worker (ADR 0016, request path): which origins may call it, and the CORS headers
 * a browser-based client needs to read the answers.
 */

/** Browser origins allowed in production, by hostname: the demo web app and Claude on the web. */
const PRODUCTION_ORIGINS = ["admin-os.lr0y.dev", "claude.ai"];

/**
 * The `Origin` hostnames this request may carry. The Worker's own pages (`ownPage`: the consent page, whose form posts
 * to itself) accept only the Worker's own host. Everything else also accepts the production origins, and localhost
 * origins only while the Worker itself is served on localhost (`wrangler dev`), so production never trusts a page on
 * the visitor's own machine. A request without an `Origin` (Claude Code and other non-browser clients) always passes
 * the SDK's check; the opaque `null` Origin never does.
 */
export const allowedOriginsFor = (url: URL, ownPage = false): string[] => {
  if (ownPage) return [url.hostname];
  return localhostAllowedHostnames().includes(url.hostname)
    ? [...PRODUCTION_ORIGINS, ...localhostAllowedOrigins()]
    : [url.hostname, ...PRODUCTION_ORIGINS];
};

const ALLOWED_HEADERS = ["Authorization", "Content-Type", "MCP-Protocol-Version", "Mcp-Method", "Mcp-Name"];
const EXPOSED_HEADERS = ["WWW-Authenticate", "Mcp-Protocol-Version", "Retry-After"];
const ALLOWED_METHODS = ["GET", "POST", "DELETE", "OPTIONS"];

/**
 * The CORS headers for a request whose `Origin` already passed validation. Without an `Origin` there is no browser to
 * tell, so only `Vary` is set.
 */
const corsHeadersFor = (request: Request): Record<string, string> => {
  const origin = request.headers.get("origin");
  if (origin === null) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Expose-Headers": EXPOSED_HEADERS.join(", "),
    Vary: "Origin",
  };
};

/** The answer to a CORS preflight from an allowed origin. */
export const preflightResponse = (request: Request): Response =>
  new Response(null, {
    status: 204,
    headers: {
      ...corsHeadersFor(request),
      "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
      "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
      "Access-Control-Max-Age": "86400",
    },
  });

/** `response` with the CORS headers of `request`; the body streams through untouched. */
export const withCors = (request: Request, response: Response): Response => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeadersFor(request))) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

/** A JSON-RPC error with no request id, as the transport answers before a message is read. */
export const jsonRpcError = (status: number, message: string, headers: Record<string, string> = {}): Response =>
  Response.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message } }, { status, headers });
