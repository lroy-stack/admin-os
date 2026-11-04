import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, type Tool } from "@modelcontextprotocol/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ROLE_IDS } from "@/core/access";
import { type Adapter, createClient } from "@/core/client";
import { MAX_RESULT_BYTES, projectCatalog, resultBytes, toolNameOf, visibleCapabilities } from "@/core/mcp/server";

import { demoActor } from "./actor";
import { inputBeforeCall, ownerOf } from "./adapter-contract.testkit";
import { CATALOG } from "./catalog";
import { getAdapter } from "./data.server";
import { MCP_MANIFEST } from "./mcp-manifest";
import { VERTICALS, type VerticalId } from "./vertical";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
  headers: async () => new Headers(),
}));

const verticalIds = Object.keys(VERTICALS) as VerticalId[];

/** Every preset and role with the tools it is offered: the cases of the size test (spec 004, AC8). */
const groups = verticalIds.flatMap((vertical) =>
  ROLE_IDS.map((role) => {
    const actor = demoActor(role, VERTICALS[vertical]);
    const ids = visibleCapabilities(CATALOG, MCP_MANIFEST, actor).map((capability) => capability.id);
    return [vertical, role, ids] as const;
  }),
);

/**
 * The tool's arguments, read from its advertised schema: the contract testkit's valid input, a list at the largest
 * `limit` the schema allows, and a key when the tool requires one. A tool that asks about a held write gets a
 * write held for a person first, in the same session.
 */
const argumentsFor = async (
  adapter: Adapter,
  id: string,
  vertical: VerticalId,
  tool: Tool | undefined,
): Promise<Record<string, unknown>> => {
  const properties = (tool?.inputSchema.properties ?? {}) as Partial<Record<string, { maximum?: number }>>;
  const maxLimit = properties.limit?.maximum;
  return {
    ...(await inputBeforeCall(
      createClient(CATALOG, adapter, { actor: ownerOf(vertical), via: "mcp", logger: () => undefined }),
      id,
      vertical,
      adapter,
    )),
    ...(maxLimit === undefined ? {} : { limit: maxLimit }),
    ...(Object.hasOwn(properties, "idempotencyKey") ? { idempotencyKey: crypto.randomUUID() } : {}),
  };
};

describe("the size of a tool result (spec 004, AC8)", () => {
  it("covers every exposed tool of every preset and role", () => {
    expect(new Set(groups.flatMap(([, , ids]) => ids)).size).toBe(
      Object.values(MCP_MANIFEST).filter((entry) => "expose" in entry).length,
    );
  });

  describe.each(groups)("%s / %s", (vertical, role, ids) => {
    const actor = demoActor(role, VERTICALS[vertical]);
    // One server and client per preset and role; every case gets a fresh demo session, so a write never leaks into
    // the next case.
    let adapter: Adapter;
    let client: Client;
    let tools: readonly Tool[];
    const clientFor = () => createClient(CATALOG, adapter, { actor, via: "mcp", logger: () => undefined });

    beforeAll(async () => {
      const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
      client = new Client({ name: "admin-os-size-test", version: "0.0.0" });
      await projectCatalog({ catalog: CATALOG, manifest: MCP_MANIFEST, actor, createClient: clientFor }).connect(
        serverSide,
      );
      await client.connect(clientSide);
      tools = (await client.listTools()).tools;
    });

    beforeEach(() => {
      adapter = getAdapter({ vertical, sessionId: crypto.randomUUID() });
    });

    afterAll(async () => {
      await client.close();
    });

    it.each(ids)("keeps %s under its byte bound with valid inputs at the largest limit", async (id) => {
      const name = toolNameOf(id);
      const result = await client.callTool({
        name,
        arguments: await argumentsFor(
          adapter,
          id,
          vertical,
          tools.find((tool) => tool.name === name),
        ),
      });

      expect({ error: result.isError ?? false, withinBound: resultBytes(result as never) <= MAX_RESULT_BYTES }).toEqual(
        {
          error: false,
          withinBound: true,
        },
      );
    });
  });
});
