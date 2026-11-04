import "server-only";

import type { Server } from "@modelcontextprotocol/server";

import type { Actor, CallLogLine } from "@/core/client";
import { createClient } from "@/core/client";
import { projectCatalog } from "@/core/mcp/server";
import { parseFaults } from "@/core/mock";

import { CATALOG } from "./catalog";
import { getAdapter } from "./data.server";
import { MCP_MANIFEST, mcpInstructions } from "./mcp-manifest";
import type { VerticalId } from "./vertical";

export interface McpServerOptions {
  /** Resolved by the transport (ADR 0009): a demo bearer token over HTTP, an environment variable over stdio. */
  readonly actor: Actor;
  readonly vertical: VerticalId;
  /** The demo session writes act on; without one, writes answer `transport.unavailable` as in the UI (ADR 0005). */
  readonly sessionId?: string;
  /** Where the client's call lines go; stdio passes a stderr logger, since stdout carries the protocol. */
  readonly logger?: (line: CallLogLine) => void;
  /** Read tools only (`MCP_READ_ONLY`, see `mcp-env.ts`). */
  readonly readOnly?: boolean;
}

/**
 * The MCP server for one actor: the merged catalogue, as the manifest presents it, through the same client and
 * adapter as the UI (spec D4).
 */
export function createMcpServer(options: McpServerOptions): Server {
  const adapter = getAdapter({
    vertical: options.vertical,
    sessionId: options.sessionId,
    faults: parseFaults(process.env.MOCK_FAULTS),
  });
  return projectCatalog({
    catalog: CATALOG,
    manifest: MCP_MANIFEST,
    actor: options.actor,
    readOnly: options.readOnly === true,
    instructions: mcpInstructions(options.readOnly === true),
    createClient: (actor, correlationId) =>
      createClient(CATALOG, adapter, {
        actor,
        correlationId,
        via: "mcp",
        ...(options.logger === undefined ? {} : { logger: options.logger }),
      }),
  });
}
