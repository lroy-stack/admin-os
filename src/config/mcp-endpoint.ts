/** Where the MCP server answers (ADR 0016): its own Worker, on its own host. */

/** The path the MCP Worker serves Streamable HTTP on. */
export const MCP_PATH = "/mcp";

/** The public demo's MCP endpoint, as clients add it. */
export const MCP_PUBLIC_URL = `https://mcp.admin-os.lr0y.dev${MCP_PATH}`;

/** The stdio door, as a client launches it from a checkout. */
export const MCP_STDIO_COMMAND = "npm run --silent mcp:stdio";
