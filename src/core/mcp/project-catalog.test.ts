import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { type AnyCapability, defineCapability } from "@/core/capability";
import { type Actor, createClient } from "@/core/client";
import type { BusinessClock } from "@/core/clock";
import { createMockAdapter, createSessionStore, type MockHandler, mockHandler } from "@/core/mock";
import { ok } from "@/core/result";

import { IDEMPOTENCY_META_KEY, type McpManifest, projectCatalog, toolNameOf, toolOf } from "./server";

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
  riskTier: 0,
});

const notesAdd = defineCapability({
  id: "notes.add",
  summary: "Add a note; a note starting with ! waits for approval.",
  input: z.strictObject({ text: z.string().min(1) }),
  output: notesOutput,
  permission: "create:notes",
  effect: "write",
  riskTier: 2,
  mayRequireApproval: true,
  approval: (input) => input.text.startsWith("!"),
});

const notesClear = defineCapability({
  id: "notes.clear",
  summary: "Delete every note.",
  input: z.strictObject({}),
  output: notesOutput,
  permission: "delete:notes",
  effect: "destructive",
  riskTier: 3,
});

const notesCreate = defineCapability({
  id: "notes.create",
  summary: "Create a note; retrying with the same key creates it once.",
  input: z.strictObject({ text: z.string().min(1) }),
  output: notesOutput,
  permission: "create:notes",
  effect: "write",
  riskTier: 2,
  requiresIdempotencyKey: true,
});

const notesExport = defineCapability({
  id: "notes.export",
  summary: "Export every note as a file the browser downloads.",
  input: z.strictObject({}),
  output: notesOutput,
  permission: "read:notes",
  effect: "read",
  riskTier: 0,
});

const catalog = {
  "notes.list": notesList,
  "notes.add": notesAdd,
  "notes.clear": notesClear,
  "notes.create": notesCreate,
  "notes.export": notesExport,
};

const manifest: McpManifest = {
  "notes.list": { expose: true, title: "List notes" },
  "notes.add": { expose: true, title: "Add a note" },
  "notes.clear": { expose: true, title: "Clear the notes" },
  "notes.create": { expose: true, title: "Create a note" },
  "notes.export": { uiOnly: "A browser download; an agent reads the same notes with notes_list" },
};

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
  ...mockHandler(notesCreate, (input, { data }: { data: Notes }) => {
    data.notes.push(input.text);
    return ok({ items: [...data.notes] });
  }),
  ...mockHandler(notesExport, (_input, { data }: { data: Notes }) => ok({ items: [...data.notes] })),
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
const connect = async (actor: Actor, readOnly = false) => {
  const adapter = createMockAdapter({
    handlers,
    store: createSessionStore<Notes>({ notes: ["seeded"] }),
    sessionId: "mcp-test",
    clock,
  });
  const server = projectCatalog({
    catalog,
    manifest,
    actor,
    readOnly,
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
    ["the owner", owner, ["notes_list", "notes_add", "notes_clear", "notes_create"]],
    ["a reader", reader, ["notes_list"]],
    ["an actor without permissions", nobody, []],
  ] as const)("%s lists exactly the tools its permissions reach", async (_label, actor, expected) => {
    expect(await toolNames(actor)).toEqual(expected);
  });

  it("lists only read tools on a read-only server, even for the owner", async () => {
    const { tools } = await (await connect(owner, true)).listTools();
    expect(tools.map((tool) => tool.name)).toEqual(["notes_list"]);
  });

  it("never lists a UI-only capability, even for an actor that holds its permission", async () => {
    expect(await toolNames(owner)).not.toContain("notes_export");
  });

  it.each([
    ["notes.list", "List notes"],
    ["notes.add", "Add a note"],
    ["notes.clear", "Clear the notes"],
  ] as const)("%s carries its manifest title", async (id, title) => {
    const { tools } = await (await connect(owner)).listTools();
    expect(tools.find((tool) => tool.name === toolNameOf(id))?.title).toBe(title);
  });

  it.each([notesList, notesAdd, notesClear] as AnyCapability[])(
    "$id is described by its summary",
    async (capability) => {
      const { tools } = await (await connect(owner)).listTools();
      expect(tools.find((tool) => tool.name === toolNameOf(capability.id))?.description).toBe(capability.summary);
    },
  );

  it.each([
    ["notes.list", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }],
    ["notes.add", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }],
    ["notes.clear", { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false }],
  ] as const)("%s is annotated from its effect", async (id, expected) => {
    const { tools } = await (await connect(owner)).listTools();
    expect(tools.find((tool) => tool.name === toolNameOf(id))?.annotations).toEqual(expected);
  });

  it.each([
    ["notes.list", 0],
    ["notes.add", 2],
    ["notes.clear", 3],
  ] as const)("%s carries its risk tier in _meta", async (id, riskTier) => {
    const { tools } = await (await connect(owner)).listTools();
    expect(tools.find((tool) => tool.name === toolNameOf(id))?._meta).toEqual({ "admin-os/riskTier": riskTier });
  });

  it("advertises in _meta that a capability needs an idempotency key", () => {
    const pay = defineCapability({ ...notesAdd, id: "notes.pay", requiresIdempotencyKey: true });
    expect(toolOf(pay, { expose: true, title: "Pay" })._meta).toEqual({
      "admin-os/riskTier": 2,
      "admin-os/requiresIdempotencyKey": true,
    });
  });

  it("throws when two capabilities project to the same tool name", () => {
    const clash = defineCapability({ ...notesList, id: "notes_list" });
    expect(() =>
      projectCatalog({
        catalog: { "notes.list": notesList, notes_list: clash },
        manifest: { "notes.list": manifest["notes.list"], notes_list: { expose: true, title: "Clash" } },
        actor: owner,
        createClient: () => {
          throw new Error("not called");
        },
      }),
    ).toThrow(/both project to tool "notes_list"/);
  });
});

describe("the manifest", () => {
  const { "notes.export": _omitted, ...unclassified } = manifest;

  it.each([
    ["a capability without an entry", catalog, unclassified, /without an MCP manifest entry: notes\.export/],
    ["an entry for no capability", { "notes.list": notesList }, manifest, /entries for no capability: notes\.add/],
    ["an empty title", catalog, { ...manifest, "notes.list": { expose: true, title: " " } }, /notes\.list/],
    ["an empty reason", catalog, { ...manifest, "notes.export": { uiOnly: "" } }, /notes\.export/],
  ] as const)("refuses %s", (_label, testCatalog, testManifest, message) => {
    expect(() =>
      projectCatalog({
        catalog: testCatalog,
        manifest: testManifest,
        actor: owner,
        createClient: () => {
          throw new Error("not called");
        },
      }),
    ).toThrow(message);
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
    ["a UI-only capability", "notes_export"],
  ])("answers %s with access.forbidden", async (_label, name) => {
    const result = await (await connect(reader)).callTool({ name, arguments: { text: "x" } });
    expect(result).toMatchObject({ isError: true, structuredContent: { code: "access.forbidden" } });
  });

  it.each(["notes_add", "notes_clear"])(
    "answers %s on a read-only server with access.forbidden that says the server is read-only",
    async (name) => {
      const client = await connect(owner, true);
      const result = await client.callTool({ name, arguments: { text: "x" } });
      const read = await client.callTool({ name: "notes_list", arguments: {} });
      expect([result, notesOutput.parse(read.structuredContent)]).toMatchObject([
        { isError: true, structuredContent: { code: "access.forbidden", message: expect.stringMatching(/read-only/) } },
        { items: ["seeded"] },
      ]);
    },
  );

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

describe("idempotency by operation (spec 004 D6)", () => {
  const notesAfter = async (client: Client) =>
    notesOutput.parse((await client.callTool({ name: "notes_list", arguments: {} })).structuredContent).items;

  it("advertises a required idempotencyKey argument on a create", async () => {
    const { tools } = await (await connect(owner)).listTools();
    expect(tools.find((tool) => tool.name === "notes_create")?.inputSchema).toMatchObject({
      properties: { text: { type: "string" }, idempotencyKey: { type: "string", minLength: 1, maxLength: 128 } },
      required: ["text", "idempotencyKey"],
    });
  });

  it("advertises no idempotencyKey argument on a write that needs no key", async () => {
    const { tools } = await (await connect(owner)).listTools();
    expect(tools.find((tool) => tool.name === "notes_add")?.inputSchema.properties).not.toHaveProperty(
      "idempotencyKey",
    );
  });

  it("applies a create retried with the same idempotencyKey argument once", async () => {
    const client = await connect(owner);
    const call = { name: "notes_create", arguments: { text: "once", idempotencyKey: "k-1" } };
    const first = await client.callTool(call);
    const retry = await client.callTool(call);
    expect([retry.structuredContent, await notesAfter(client)]).toEqual([first.structuredContent, ["seeded", "once"]]);
  });

  it("applies a create once when the host sends the key in _meta only", async () => {
    const client = await connect(owner);
    const call = { name: "notes_create", arguments: { text: "once" }, _meta: { [IDEMPOTENCY_META_KEY]: "k-1" } };
    await client.callTool(call);
    await client.callTool(call);
    expect(await notesAfter(client)).toEqual(["seeded", "once"]);
  });

  it("accepts the same key in the argument and in _meta", async () => {
    const result = await (await connect(owner)).callTool({
      name: "notes_create",
      arguments: { text: "both", idempotencyKey: "k-1" },
      _meta: { [IDEMPOTENCY_META_KEY]: "k-1" },
    });
    expect(result).toMatchObject({ structuredContent: { items: ["seeded", "both"] } });
  });

  it("refuses a create without a key with client.idempotency_required on the idempotencyKey path", async () => {
    const client = await connect(owner);
    const result = await client.callTool({ name: "notes_create", arguments: { text: "no key" } });
    expect([result, await notesAfter(client)]).toMatchObject([
      {
        isError: true,
        structuredContent: { code: "client.idempotency_required", details: { paths: ["idempotencyKey"] } },
      },
      ["seeded"],
    ]);
  });

  it("refuses different keys in the argument and in _meta", async () => {
    const result = await (await connect(owner)).callTool({
      name: "notes_create",
      arguments: { text: "two keys", idempotencyKey: "k-1" },
      _meta: { [IDEMPOTENCY_META_KEY]: "k-2" },
    });
    expect(result).toMatchObject({
      isError: true,
      structuredContent: {
        code: "schema.invalid_input",
        details: { paths: ["idempotencyKey", `_meta.${IDEMPOTENCY_META_KEY}`] },
      },
    });
  });

  it.each([42, "", "k".repeat(129)])("refuses the idempotencyKey argument %j", async (idempotencyKey) => {
    const result = await (await connect(owner)).callTool({
      name: "notes_create",
      arguments: { text: "bad key", idempotencyKey },
    });
    expect(result).toMatchObject({
      isError: true,
      structuredContent: { code: "schema.invalid_input", details: { paths: ["idempotencyKey"] } },
    });
  });

  it("answers the same key with other arguments with client.idempotency_conflict", async () => {
    const client = await connect(owner);
    await client.callTool({ name: "notes_create", arguments: { text: "first", idempotencyKey: "k-1" } });
    const reused = await client.callTool({ name: "notes_create", arguments: { text: "other", idempotencyKey: "k-1" } });
    expect(reused).toMatchObject({ isError: true, structuredContent: { code: "client.idempotency_conflict" } });
  });

  it("refuses an idempotencyKey argument on a tool that takes none, as an unknown field", async () => {
    const result = await (await connect(owner)).callTool({
      name: "notes_add",
      arguments: { text: "hello", idempotencyKey: "k-1" },
    });
    expect(result).toMatchObject({ isError: true, structuredContent: { code: "schema.invalid_input" } });
  });

  it("throws when a keyed capability already has an input named idempotencyKey", () => {
    const clash = defineCapability({
      id: "notes.clash",
      summary: "A create whose own input already uses the key's name.",
      input: z.strictObject({ idempotencyKey: z.string() }),
      output: notesOutput,
      permission: "create:notes",
      effect: "write",
      riskTier: 2,
      requiresIdempotencyKey: true,
    });
    expect(() => toolOf(clash, { expose: true, title: "Clash" })).toThrow(/without a field named "idempotencyKey"/);
  });
});
