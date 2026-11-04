import { MCP_PUBLIC_URL } from "@/config/mcp-endpoint";

/**
 * MCP moved to its own Worker (ADR 0016, plan W3). For one release this route answers every method with `410 Gone` and
 * a JSON-RPC error that names the new endpoint, so a client shows the user where to add the server again.
 */
const gone = (): Response =>
  Response.json(
    {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32000,
        message: `This MCP endpoint has moved to ${MCP_PUBLIC_URL}; add the server again at that URL.`,
        data: { url: MCP_PUBLIC_URL },
      },
    },
    { status: 410, headers: { "Access-Control-Allow-Origin": "*" } },
  );

/**
 * A preflight must answer 2xx or the browser never sends the request, so it could not read the 410 that names the new
 * URL: OPTIONS allows the MCP request headers, and every other method answers 410.
 */
const preflight = (): Response =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version, Mcp-Method, Mcp-Name",
    },
  });

export const GET = gone;
export const POST = gone;
export const PUT = gone;
export const PATCH = gone;
export const DELETE = gone;
export const OPTIONS = preflight;
