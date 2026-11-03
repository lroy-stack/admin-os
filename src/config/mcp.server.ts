import "server-only";

import type { Server } from "@modelcontextprotocol/server";

import type { Actor, CallLogLine } from "@/core/client";
import { createClient } from "@/core/client";
import { projectCatalog } from "@/core/mcp/server";
import { parseFaults } from "@/core/mock";

import { CATALOG } from "./catalog";
import { getAdapter } from "./data.server";
import type { VerticalId } from "./vertical";

export interface McpServerOptions {
  /** Resolved by the transport (ADR 0009): a demo bearer token over HTTP, an environment variable over stdio. */
  readonly actor: Actor;
  readonly vertical: VerticalId;
  /** The demo session writes act on; without one, writes answer `transport.unavailable` as in the UI (ADR 0005). */
  readonly sessionId?: string;
  /** Where the client's call lines go; stdio passes a stderr logger, since stdout carries the protocol. */
  readonly logger?: (line: CallLogLine) => void;
}

/** The MCP server for one actor: the merged catalogue through the same client and adapter as the UI (spec D4). */
export function createMcpServer(options: McpServerOptions): Server {
  const adapter = getAdapter({
    vertical: options.vertical,
    sessionId: options.sessionId,
    faults: parseFaults(process.env.MOCK_FAULTS),
  });
  return projectCatalog({
    catalog: CATALOG,
    actor: options.actor,
    createClient: (actor, correlationId) =>
      createClient(CATALOG, adapter, {
        actor,
        correlationId,
        via: "mcp",
        ...(options.logger === undefined ? {} : { logger: options.logger }),
      }),
  });
}
