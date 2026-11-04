import "server-only";

import type { Server } from "@modelcontextprotocol/server";

import type { RoleId } from "@/core/access";
import type { Actor, CallLogLine } from "@/core/client";
import { createClient } from "@/core/client";
import { effectivePermissions, projectCatalog, type RefusalLogLine, type Scope } from "@/core/mcp/server";
import { parseFaults } from "@/core/mock";

import { demoActor } from "./actor";
import { CATALOG } from "./catalog";
import { getAdapter } from "./data.server";
import type { StoreLookup } from "./durable-adapter.server";
import { mcpInstructions } from "./mcp-instructions";
import { MCP_MANIFEST } from "./mcp-manifest";
import { resolveVertical, type VerticalId } from "./vertical";

/**
 * The composition root of the MCP server (ADR 0016, plan W0): the catalogue, the manifest, the demo actor and the
 * adapter, wired once for every door (the MCP Worker and stdio). It imports neither Next nor React; a
 * dependency-cruiser rule and the Workers' bundle test hold it to that.
 */

/** The variables the MCP server reads: `process.env` over stdio, the Worker's `env` in the Worker. */
export type McpEnv = Readonly<Record<string, string | undefined>>;

/** Where the call lines go, the client's and the projection's refusals; stdio and the Worker log them as one line. */
export type McpLogLine = CallLogLine | RefusalLogLine;

export interface McpServerOptions {
  /** Resolved by the door (ADR 0009): a demo bearer token in the Worker, an environment variable over stdio. */
  readonly actor: Actor;
  readonly vertical: VerticalId;
  /** The demo session writes act on; without one, writes answer `transport.unavailable` as in the UI (ADR 0005). */
  readonly sessionId?: string;
  readonly logger?: (line: McpLogLine) => void;
  /** Read tools only (`MCP_READ_ONLY`, see `mcp-env.ts`). */
  readonly readOnly?: boolean;
  /** `DATA_STORE`, `MOCK_CLOCK` and `MOCK_FAULTS`; `process.env` when left out. */
  readonly env?: McpEnv;
  /** The `DEMO_STORE` binding a writable server's session lives in (`DATA_STORE=durable`). */
  readonly store?: StoreLookup;
}

/**
 * The MCP server for one actor: the merged catalogue, as the manifest presents it, through the same client and
 * adapter as the UI (spec D4).
 */
export function createMcpServer(options: McpServerOptions): Server {
  const env = options.env ?? process.env;
  const adapter = getAdapter(
    {
      vertical: options.vertical,
      // A read-only server never writes, so it needs no session: its reads are served from the seed in process, with
      // no Durable Object request and no object left behind per token.
      sessionId: options.readOnly === true ? undefined : options.sessionId,
      faults: parseFaults(env.MOCK_FAULTS),
      ...(options.store === undefined ? {} : { store: options.store }),
    },
    env,
  );
  return projectCatalog({
    catalog: CATALOG,
    manifest: MCP_MANIFEST,
    actor: options.actor,
    readOnly: options.readOnly === true,
    instructions: mcpInstructions,
    ...(options.logger === undefined ? {} : { logRefusal: options.logger }),
    createClient: (actor, correlationId) =>
      createClient(CATALOG, adapter, {
        actor,
        correlationId,
        via: "mcp",
        ...(options.logger === undefined ? {} : { logger: options.logger }),
      }),
  });
}

/**
 * Who a door serves: the role it acts as and the demo session it acts on. An OAuth grant names both from the
 * visitor's demo cookies (ADR 0016 D4); a demo token, `MCP_TOKENS` or the stdio environment name them otherwise.
 */
export interface McpCaller {
  readonly roleId: RoleId;
  readonly sessionId: string;
  /** What the caller was granted (spec 004 D3): `read`, or `read` and `write`. */
  readonly scopes: readonly Scope[];
  /** The OAuth client a grant was issued to; a write held for a person records it as who asked. */
  readonly clientId?: string;
}

/**
 * The server a door hands its caller: the deployment's preset (`VERTICAL`) and the demo actor of the caller's role,
 * acting with the role's permissions ∩ the caller's scopes, so a caller without `write` is never offered a write.
 */
export function createMcpServerFor(
  caller: McpCaller,
  door: Omit<McpServerOptions, "actor" | "vertical" | "sessionId"> & { readonly env: McpEnv },
): Server {
  // MCP clients carry no demo cookies, so the preset is the deployment's (VERTICAL).
  const vertical = resolveVertical(door.env.VERTICAL);
  const role = demoActor(caller.roleId, vertical);
  const actor = { ...role, permissions: effectivePermissions(CATALOG, role.permissions, caller.scopes) };
  return createMcpServer({
    ...door,
    actor: caller.clientId === undefined ? actor : { ...actor, clientId: caller.clientId },
    vertical: vertical.id,
    sessionId: caller.sessionId,
  });
}
