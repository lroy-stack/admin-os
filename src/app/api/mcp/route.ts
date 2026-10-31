import { handleMcpRequest } from "@/config/mcp-http.server";

/**
 * MCP over Streamable HTTP (ADR 0009). Node runtime: the demo sessions live in this process's memory, shared with
 * the UI's Server Actions, and OpenNext on Cloudflare serves Node routes, not the edge runtime.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleMcpRequest;
export const POST = handleMcpRequest;
export const DELETE = handleMcpRequest;
