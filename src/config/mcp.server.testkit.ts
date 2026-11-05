import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, type Tool } from "@modelcontextprotocol/server";
import { afterEach, expect, it } from "vitest";

import { KERNEL_MODULES, moduleOf } from "@/core/access";
import type { Actor, CallLogLine } from "@/core/client";
import { exposedCapabilities, type RefusalLogLine, toolNameOf } from "@/core/mcp/server";

import { demoActor } from "./actor";
import { CATALOG } from "./catalog";
import { createMcpServer } from "./mcp.server";
import { MCP_MANIFEST } from "./mcp-manifest";
import { VERTICALS } from "./vertical";

/**
 * Shared by `mcp.server.test.ts` (the kernel's generic cases) and one `mcp.server.<module>.test.ts` per module that
 * exposes tools (ADR 0017 §7). A test file that connects must mock `next/headers`, as the session adapter reads it.
 */
const hospitality = VERTICALS.hospitality;

export const owner = demoActor("owner", hospitality);
export const staff = demoActor("staff", hospitality);
export const nobody: Actor = { actorId: "anonymous", roleId: "anonymous", permissions: [] };

export const capabilities = exposedCapabilities(CATALOG, MCP_MANIFEST);

/** What `createMcpServer`'s logger receives: the client's call lines and the projection's refusals. */
export type LogLine = CallLogLine | RefusalLogLine;

const open: Client[] = [];

afterEach(async () => {
  await Promise.all(open.splice(0).map((client) => client.close()));
});

/** An MCP client on the hospitality preset, listing first as real clients do (so calls validate their output). */
export const connect = async (
  actor: Actor,
  logger?: (line: LogLine) => void,
  sessionId?: string,
  readOnly?: boolean,
) => {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "admin-os-test", version: "0.0.0" });
  await createMcpServer({
    actor,
    vertical: "hospitality",
    ...(sessionId === undefined ? {} : { sessionId }),
    ...(logger === undefined ? {} : { logger }),
    ...(readOnly === undefined ? {} : { readOnly }),
  }).connect(serverSide);
  await client.connect(clientSide);
  open.push(client);
  return { client, tools: (await client.listTools()).tools };
};

/** Rows of a list result as plain records. */
export const rowsOf = (result: { structuredContent?: unknown }) =>
  (result.structuredContent as { items: object[] }).items;

/** Every key that appears in any row. */
export const keysOf = (rows: readonly object[]) => [...new Set(rows.flatMap((row) => Object.keys(row)))].sort();

/** The advertised properties of a list tool's rows. */
export const advertisedRowKeys = (tools: readonly Tool[], name: string) => {
  const schema = tools.find((tool) => tool.name === name)?.outputSchema as unknown as {
    properties: { items: { items: { properties: object } } };
  };
  return Object.keys(schema.properties.items.items.properties).sort();
};

/**
 * One tool of the surface an agent sees, pinned (spec 004 AC7): name, readOnlyHint, destructiveHint, idempotentHint,
 * risk tier, and whether the tool requires the idempotencyKey argument. A change here is a change of requirement.
 */
export type PinnedTool = readonly [
  name: string,
  readOnlyHint: boolean,
  destructiveHint: boolean,
  idempotentHint: boolean,
  riskTier: number,
  key: boolean,
];

/** Whether a capability id belongs to the kernel, not to an installed module. */
export const isKernelTool = (id: string): boolean => (KERNEL_MODULES as readonly string[]).includes(moduleOf(id));

/**
 * Registers the pins of the tools one owner exposes: the kernel (no `owner`) or a module. The rows must name exactly
 * the tools that owner exposes, so a new tool cannot be added without a pin.
 */
export const itPinsToolsOf = (pinned: readonly PinnedTool[], owning?: string) => {
  const exposed = capabilities
    .filter((capability) => (owning === undefined ? isKernelTool(capability.id) : moduleOf(capability.id) === owning))
    .map((capability) => toolNameOf(capability.id))
    .sort();

  it("pins exactly the tools it exposes", () => {
    expect(pinned.map(([name]) => name)).toEqual(exposed);
  });

  it("lists them for the hospitality owner", async () => {
    const { tools } = await connect(owner);
    expect(tools.map((tool) => tool.name)).toEqual(expect.arrayContaining(exposed));
  });

  it.each(pinned)(
    "pins %s: readOnly %s, destructive %s, idempotent %s, tier %s, key %s (AC7)",
    async (name, readOnlyHint, destructiveHint, idempotentHint, riskTier, key) => {
      const { tools } = await connect(owner);
      const tool = tools.find((candidate) => candidate.name === name);
      expect([tool?.annotations, tool?._meta, tool?.inputSchema.required?.includes("idempotencyKey") === true]).toEqual(
        [
          { readOnlyHint, destructiveHint, idempotentHint, openWorldHint: false },
          { "admin-os/riskTier": riskTier },
          key,
        ],
      );
    },
  );
};

/** A tool's description names where to find the valid ids of an argument (spec 004 U3): `[tool, "field with tool or tool"]`. */
export const itDescribesWhereToFindIds = (rows: readonly (readonly [tool: string, source: string])[]) => {
  it.each(rows)("describes %s with where to find %s (spec 004 U3)", async (name, source) => {
    const { tools } = await connect(owner);
    expect(tools.find((tool) => tool.name === name)?.description).toMatch(
      new RegExp(`Find valid ids: (?:[^.]+; )?${source}[;.]`),
    );
  });
};
