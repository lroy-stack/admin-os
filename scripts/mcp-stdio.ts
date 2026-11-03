/**
 * The stdio door of the MCP server (ADR 0009): one actor per process, from `MCP_ROLE` (default `staff`) on the
 * `VERTICAL` preset, with its own demo session. Run it with `npm run --silent mcp:stdio` (`--silent` keeps npm's
 * banner off stdout): `tsx` loads the TypeScript and `server-only-hook.mjs` lets the `server-only` markers load
 * outside Next.
 *
 * stdout carries the protocol and nothing else: every log line, ours or a dependency's, goes to stderr.
 */
import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { demoActor } from "@/config/actor";
import { createMcpServer } from "@/config/mcp.server";
import { mcpRoleFrom, parseReadOnly } from "@/config/mcp-env";
import { resolveVertical } from "@/config/vertical";

const toStderr = (...values: unknown[]) => console.error(...values);
console.log = toStderr;
console.info = toStderr;
console.debug = toStderr;

const log = (line: object) => process.stderr.write(`${JSON.stringify(line)}\n`);

// No request here, so no demo cookie: the preset is the deployment's (VERTICAL).
const vertical = resolveVertical(process.env.VERTICAL);
const roleId = mcpRoleFrom(process.env.MCP_ROLE);
const actor = demoActor(roleId, vertical);
const sessionId = `stdio-${crypto.randomUUID()}`;
// A stdio process is the developer's own session, so it writes unless MCP_READ_ONLY=true.
const readOnly = parseReadOnly(process.env.MCP_READ_ONLY) ?? false;

serveStdio(() => createMcpServer({ actor, vertical: vertical.id, sessionId, logger: log, readOnly }), {
  onerror: (error) => log({ event: "mcp.stdio.error", message: error.message }),
});

log({ event: "mcp.stdio.ready", vertical: vertical.id, actorRole: roleId, readOnly });
