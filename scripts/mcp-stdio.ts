/**
 * The stdio door of the MCP server (ADR 0009, 0016): one caller per process, from `MCP_ROLE` (default `staff`) on the
 * `VERTICAL` preset, with its own demo session, through the same composition root as the MCP Worker
 * (`createMcpServerFor` in `src/config/mcp.server.ts`). Run it with `npm run --silent mcp:stdio` (`--silent` keeps
 * npm's banner off stdout).
 *
 * `tsx` loads the TypeScript. `scripts/server-only-hook.mjs`, wired by the `mcp:stdio` script, stays for as long as
 * the composition reaches modules' `server.ts` entries and `src/config/*.server.ts`, which import `server-only` to
 * keep them out of client bundles; that package throws outside a `react-server` bundle. The Workers alias it to an
 * empty stub (`workers/stubs/server-only.ts`) instead.
 *
 * stdout carries the protocol and nothing else: every log line, ours or a dependency's, goes to stderr.
 */
import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { createMcpServerFor } from "@/config/mcp.server";
import { mcpRoleFrom, parseReadOnly } from "@/config/mcp-env";
import { resolveVertical } from "@/config/vertical";
import { SCOPES } from "@/core/mcp/server";

const toStderr = (...values: unknown[]) => console.error(...values);
console.log = toStderr;
console.info = toStderr;
console.debug = toStderr;

const log = (line: object) => process.stderr.write(`${JSON.stringify(line)}\n`);

const caller = {
  roleId: mcpRoleFrom(process.env.MCP_ROLE),
  sessionId: `stdio-${crypto.randomUUID()}`,
  scopes: SCOPES,
};
// A stdio process is the developer's own session, so it writes unless MCP_READ_ONLY=true.
const readOnly = parseReadOnly(process.env.MCP_READ_ONLY) ?? false;

serveStdio(() => createMcpServerFor(caller, { env: process.env, readOnly, logger: log }), {
  onerror: (error) => log({ event: "mcp.stdio.error", message: error.message }),
});

log({
  event: "mcp.stdio.ready",
  vertical: resolveVertical(process.env.VERTICAL).id,
  actorRole: caller.roleId,
  readOnly,
});
