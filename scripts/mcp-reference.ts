/**
 * Writes `docs/mcp/reference.md` from the MCP projection (spec 004 AC10). Run it with `npm run mcp:reference` after
 * any change to the manifest or a capability; `src/config/mcp-reference.test.ts` fails while the file is stale.
 */

import { MCP_REFERENCE_PATH, renderMcpReference } from "@/config/mcp-reference";

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const target = join(fileURLToPath(new URL("..", import.meta.url)), MCP_REFERENCE_PATH);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, renderMcpReference());
process.stderr.write(`Wrote ${MCP_REFERENCE_PATH}\n`);
