import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { type AnyCapability, defineCapability } from "@/core/capability";
import { type Actor, createClient } from "@/core/client";
import type { BusinessClock } from "@/core/clock";
import { createMockAdapter, createSessionStore, type MockHandler, mockHandler } from "@/core/mock";
import { ok } from "@/core/result";

import { IDEMPOTENCY_META_KEY, projectCatalog, toolNameOf } from "./server";

interface Notes {
  readonly notes: string[];
}

const notesOutput = z.object({ items: z.array(z.string()) });

const notesList = defineCapability({
  id: "notes.list",
  summary: "List notes.",
  input: z.strictObject({}),
  output: notesOutput,
  permission: "read:notes",
  effect: "read",
});

const notesAdd = defineCapability({
  id: "notes.add",
  summary: "Add a note; a note starting with ! waits for approval.",
  input: z.strictObject({ text: z.string().min(1) }),
  output: notesOutput,
  permission: "create:notes",
  effect: "write",
  approval: (input) => input.text.startsWith("!"),
});

const notesClear = defineCapability({
  id: "notes.clear",
  summary: "Delete every note.",
  input: z.strictObject({}),
  output: notesOutput,
  permission: "delete:notes",
  effect: "destructive",
});

const catalog = { "notes.list": notesList, "notes.add": notesAdd, "notes.clear": notesClear };

const handlers: Readonly<Record<string, MockHandler<Notes>>> = {
  ...mockHandler(notesList, (_input, { data }: { data: Notes }) => ok({ items: [...data.notes] })),
  ...mockHandler(notesAdd, (input, { data }: { data: Notes }) => {
    data.notes.push(input.text);
    return ok({ items: [...data.notes] });
  }),
  ...mockHandler(notesClear, (_input, { data }: { data: Notes }) => {
    data.notes.splice(0);
    return ok({ items: [] });
  }),
};

const clock: BusinessClock = {
  businessDay: "2026-10-31",
  today: "2026-10-31",
  nowMin: 1240,
  cutoffMin: 300,
  timeZone: "Europe/Madrid",
};

const owner: Actor = {
  actorId: "demo-owner",
  roleId: "owner",
  permissions: ["read:notes", "create:notes", "delete:notes"],
};
const reader: Actor = { actorId: "demo-staff", roleId: "staff", permissions: ["read:notes"] };
const nobody: Actor = { actorId: "anonymous", roleId: "anonymous", permissions: [] };

const open: Client[] = [];

afterEach(async () => {
  await Promise.all(open.splice(0).map((client) => client.close()));
});

/**
 * A real MCP client talking to the projection over the SDK's in-memory transport pair. It lists first, as real
 * clients do, so every later `callTool` validates `structuredContent` against the advertised output schema.
 */
const connect = async (actor: Actor) => {
  const adapter = createMockAdapter({
    handlers,
    store: createSessionStore<Notes>({ notes: ["seeded"] }),
    sessionId: "mcp-test",
    clock,
  });
  const server = projectCatalog({
    catalog,
    actor,
    createClient: (callingActor, correlationId) =>
      createClient(catalog, adapter, {
        actor: callingActor,
        correlationId,
        retryDelayMs: 0,
        logger: () => undefined,
        mode: "production",
      }),
  });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "admin-os-test", version: "0.0.0" });
  await server.connect(serverSide);
  await client.connect(clientSide);
  open.push(client);
  await client.listTools();
  return client;
};

const toolNames = async (actor: Actor) => (await (await connect(actor)).listTools()).tools.map((tool) => tool.name);

describe("tool names", () => {
  it.each([
    ["notes.list", "notes_list"],
    ["customers.profile.get", "customers_profile_get"],
  ])("%s projects to %s", (id, name) => {
    expect(toolNameOf(id)).toBe(name);
  });
});

describe("listing", () => {
  it.each([
    ["the owner", owner, ["notes_list", "notes_add", "notes_clear"]],
    ["a reader", reader, ["notes_list"]],
    ["an actor without permissions", nobody, []],
  ] as const)("%s lists exactly the tools its permissions reach", async (_label, actor, expected) => {
    expect(await toolNames(actor)).toEqual(expected);
  });

  it.each(Object.values(catalog) as AnyCapability[])("$id is described by its summary", async (capability) => {
    const { tools } = await (await connect(owner)).listTools();
    expect(tools.find((tool) => tool.name === toolNameOf(capability.id))?.description).toBe(capability.summary);
  });

  it.each([
    ["notes.list", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }],
    ["notes.add", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }],
    ["notes.clear", { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false }],
  ] as const)("%s is annotated from its effect", async (id, expected) => {
    const { tools } = await (await connect(owner)).listTools();
    expect(tools.find((tool) => tool.name === toolNameOf(id))?.annotations).toEqual(expected);
  });

  it("throws when two capabilities project to the same tool name", () => {
    const clash = defineCapability({ ...notesList, id: "notes_list" });
    expect(() =>
      projectCatalog({
        catalog: { "notes.list": notesList, notes_list: clash },
        actor: owner,
        createClient: () => {
          throw new Error("not called");
        },
      }),
    ).toThrow(/both project to tool "notes_list"/);
  });
});

describe("calls", () => {
  it("returns a read's value as structured content that matches the capability output", async () => {
    const result = await (await connect(reader)).callTool({ name: "notes_list", arguments: {} });
    expect(notesOutput.parse(result.structuredContent)).toEqual({ items: ["seeded"] });
  });

  it("returns a write's value as structured content", async () => {
    const result = await (await connect(owner)).callTool({ name: "notes_add", arguments: { text: "hello" } });
    expect(result).toMatchObject({ structuredContent: { items: ["seeded", "hello"] } });
  });

  it("mirrors the structured content as text for clients that read only content", async () => {
    const result = await (await connect(reader)).callTool({ name: "notes_list", arguments: {} });
    expect(result.content).toEqual([{ type: "text", text: JSON.stringify({ items: ["seeded"] }) }]);
  });

  it.each([
    ["a tool outside the actor's permissions", "notes_add"],
    ["a destructive tool for a reader", "notes_clear"],
    ["a name that is no tool at all", "billing_export"],
  ])("answers %s with access.forbidden", async (_label, name) => {
    const result = await (await connect(reader)).callTool({ name, arguments: { text: "x" } });
    expect(result).toMatchObject({ isError: true, structuredContent: { code: "access.forbidden" } });
  });

  it("answers invalid input with schema.invalid_input and the failing paths", async () => {
    const result = await (await connect(owner)).callTool({ name: "notes_add", arguments: { text: "" } });
    expect(result).toMatchObject({
      isError: true,
      structuredContent: { code: "schema.invalid_input", details: { paths: ["text"] } },
    });
  });

  it("answers an approval-gated write with awaiting_approval, not an error", async () => {
    const result = await (await connect(owner)).callTool({ name: "notes_add", arguments: { text: "!urgent" } });
    expect(result).toMatchObject({
      structuredContent: { status: "awaiting_approval", approvalId: expect.any(String) },
    });
  });

  it("keeps an approval-gated write out of the error channel", async () => {
    const result = await (await connect(owner)).callTool({ name: "notes_add", arguments: { text: "!urgent" } });
    expect(result.isError).not.toBe(true);
  });

  it("replays a write retried with the same idempotency key instead of applying it twice", async () => {
    const client = await connect(owner);
    const call = { name: "notes_add", arguments: { text: "once" }, _meta: { [IDEMPOTENCY_META_KEY]: "k-1" } };
    await client.callTool(call);
    await client.callTool(call);
    const listed = await client.callTool({ name: "notes_list", arguments: {} });
    expect(listed.structuredContent).toEqual({ items: ["seeded", "once"] });
  });

  it("rejects a malformed idempotency key with schema.invalid_input", async () => {
    const result = await (await connect(owner)).callTool({
      name: "notes_add",
      arguments: { text: "hello" },
      _meta: { [IDEMPOTENCY_META_KEY]: 42 },
    });
    expect(result).toMatchObject({ isError: true, structuredContent: { code: "schema.invalid_input" } });
  });
});
