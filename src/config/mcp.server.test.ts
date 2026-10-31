import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AnyCapability } from "@/core/capability";
import type { Actor } from "@/core/client";
import { toolNameOf, toolOf } from "@/core/mcp/server";
import { bookingsList } from "@/modules/bookings";
import { customersList } from "@/modules/customers";

import { demoActor } from "./actor";
import { CATALOG } from "./catalog";
import { createMcpServer } from "./mcp.server";
import { VERTICALS } from "./vertical";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
  headers: async () => new Headers(),
}));

const hospitality = VERTICALS.hospitality;
const owner = demoActor("owner", hospitality);
const staff = demoActor("staff", hospitality);
const nobody: Actor = { actorId: "anonymous", roleId: "anonymous", permissions: [] };
const capabilities = Object.values(CATALOG) as AnyCapability[];
const staffTools = capabilities
  .filter((capability) => staff.permissions.includes(capability.permission))
  .map((capability) => toolNameOf(capability.id));

const open: Client[] = [];

afterEach(async () => {
  await Promise.all(open.splice(0).map((client) => client.close()));
});

/** An MCP client on the hospitality preset, listing first as real clients do (so calls validate their output). */
const connect = async (actor: Actor) => {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "admin-os-test", version: "0.0.0" });
  await createMcpServer({ actor, vertical: "hospitality" }).connect(serverSide);
  await client.connect(clientSide);
  open.push(client);
  return { client, tools: (await client.listTools()).tools };
};

describe("the MCP projection of the catalogue (ADR 0009)", () => {
  it.each(capabilities)("projects $id to one tool with JSON Schemas", (capability) => {
    expect(toolOf(capability)).toMatchObject({
      name: toolNameOf(capability.id),
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
    });
  });

  it("lists every capability the hospitality owner reaches", async () => {
    const { tools } = await connect(owner);
    expect(tools.map((tool) => tool.name)).toEqual([
      "access_me_get",
      "clock_get",
      "bookings_list",
      "catalog_list",
      "customers_list",
      "resources_list",
      "staff_list",
    ]);
  });

  it("lists for staff only the tools its permissions reach", async () => {
    const { tools } = await connect(staff);
    expect(tools.map((tool) => tool.name)).toEqual(staffTools);
  });

  it("lists nothing for an actor without permissions", async () => {
    const { tools } = await connect(nobody);
    expect(tools).toEqual([]);
  });

  it.each(capabilities)("annotates $id from its effect", async (capability) => {
    const { tools } = await connect(owner);
    expect(tools.find((tool) => tool.name === toolNameOf(capability.id))?.annotations).toEqual({
      readOnlyHint: capability.effect === "read",
      destructiveHint: capability.effect === "destructive",
      idempotentHint: capability.effect === "read",
      openWorldHint: false,
    });
  });

  it.each([
    ["bookings_list", bookingsList.output],
    ["customers_list", customersList.output],
  ] as const)("%s returns structured content that matches the capability output", async (name, output) => {
    const { client } = await connect(staff);
    const result = await client.callTool({ name, arguments: { limit: 5 } });
    expect(output.safeParse(result.structuredContent)).toMatchObject({ success: true });
  });

  it("answers a tool the actor was not offered with access.forbidden, as the UI does", async () => {
    const { client } = await connect(nobody);
    const result = await client.callTool({ name: "bookings_list", arguments: {} });
    expect(result).toMatchObject({ isError: true, structuredContent: { code: "access.forbidden" } });
  });
});
