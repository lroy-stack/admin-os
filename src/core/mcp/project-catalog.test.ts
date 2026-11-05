import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { type ApprovalPolicy, approvalsSettings } from "@/core/approvals";
import { type AnyCapability, defineCapability } from "@/core/capability";
import { type Actor, type CallLogLine, createClient } from "@/core/client";
import type { BusinessClock } from "@/core/clock";
import { createMockAdapter, createSessionStore, type MockHandler, mockHandler } from "@/core/mock";
import { err, ok } from "@/core/result";
import { createSettingsReader, mergeSettings } from "@/core/settings";

import {
  annotationsOf,
  CORRELATION_META_KEY,
  IDEMPOTENCY_META_KEY,
  type McpManifest,
  type ProjectionOptions,
  projectCatalog,
  type RefusalLogLine,
  toolListVersion,
  toolNameOf,
  toolOf,
} from "./server";

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
  summary: "Add a note.",
  input: z.strictObject({ text: z.string().min(1) }),
  output: notesOutput,
  permission: "create:notes",
  effect: "write",
  riskTier: 2,
  change: "add",
  idempotency: "key",
  requiresIdempotencyKey: true,
});

const notesClear = defineCapability({
  id: "notes.clear",
  summary: "Delete every note.",
  input: z.strictObject({}),
  output: notesOutput,
  permission: "delete:notes",
  effect: "destructive",
  riskTier: 3,
  change: "remove",
  idempotency: "target-state",
});

const notesCreate = defineCapability({
  id: "notes.create",
  summary:
    "Create a note, then read it with notes.list (up to notes.list_limit). Retrying with the same key creates it once.",
  input: z.strictObject({ text: z.string().min(1) }),
  output: notesOutput,
  permission: "create:notes",
  effect: "write",
  riskTier: 2,
  change: "add",
  idempotency: "key",
  requiresIdempotencyKey: true,
});

const notesGet = defineCapability({
  id: "notes.get",
  summary: "Get one note by its text. Fails with notes.not_found when there is none.",
  input: z.strictObject({ id: z.string().min(1) }),
  output: notesOutput,
  permission: "read:notes",
  effect: "read",
  riskTier: 0,
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
  "notes.get": notesGet,
  "notes.export": notesExport,
};

const manifest: McpManifest = {
  "notes.list": { expose: true, title: "List notes" },
  "notes.add": { expose: true, title: "Add a note" },
  "notes.clear": { expose: true, title: "Clear the notes" },
  "notes.create": { expose: true, title: "Create a note" },
  "notes.get": { expose: true, title: "Get a note", ids: { id: ["notes.list"] } },
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
  ...mockHandler(notesGet, ({ id }, { data }: { data: Notes }) =>
    data.notes.includes(id) ? ok({ items: [id] }) : err("notes.not_found", `No note "${id}"`, { id }),
  ),
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

/** An agent's key argument is a UUID (D2); `_meta` keys come from the host and keep the client's rule. */
const KEY = "6f1c7a52-3b8e-4d0a-9c4e-2a7b5d9e1f30";

const open: Client[] = [];

afterEach(async () => {
  await Promise.all(open.splice(0).map((client) => client.close()));
});

interface ConnectOptions {
  readonly manifest?: McpManifest;
  readonly instructions?: ProjectionOptions["instructions"];
  readonly logger?: (line: CallLogLine) => void;
  readonly logRefusal?: (line: RefusalLogLine) => void;
  /** Which assistant writes wait for a person; the default is none, so a write runs. */
  readonly policy?: ApprovalPolicy;
}

/**
 * A real MCP client talking to the projection over the SDK's in-memory transport pair. It lists first, as real
 * clients do, so every later `callTool` validates `structuredContent` against the advertised output schema.
 */
const connect = async (actor: Actor, readOnly = false, options: ConnectOptions = {}) => {
  const adapter = createMockAdapter({
    handlers,
    store: createSessionStore<Notes>({ notes: ["seeded"] }),
    sessionId: "mcp-test",
    clock,
    settings: createSettingsReader(mergeSettings(...approvalsSettings), {
      "approvals.policy": options.policy ?? "none",
    }),
  });
  const server = projectCatalog({
    catalog,
    manifest: options.manifest ?? manifest,
    actor,
    readOnly,
    ...(options.instructions === undefined ? {} : { instructions: options.instructions }),
    logRefusal: options.logRefusal ?? (() => undefined),
    createClient: (callingActor, correlationId) =>
      createClient(catalog, adapter, {
        actor: callingActor,
        correlationId,
        via: "mcp",
        retryDelayMs: 0,
        logger: options.logger ?? (() => undefined),
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
    ["the owner", owner, ["notes_add", "notes_clear", "notes_create", "notes_get", "notes_list"]],
    ["a reader", reader, ["notes_get", "notes_list"]],
    ["an actor without permissions", nobody, []],
  ] as const)("%s lists exactly the tools its permissions reach, in name order", async (_label, actor, expected) => {
    expect(await toolNames(actor)).toEqual(expected);
  });

  it("lists only read tools on a read-only server, even for the owner", async () => {
    const { tools } = await (await connect(owner, true)).listTools();
    expect(tools.map((tool) => tool.name)).toEqual(["notes_get", "notes_list"]);
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
    ["notes.add", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }],
    ["notes.clear", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }],
    ["notes.create", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }],
  ] as const)("%s is annotated from its effect, change and key", async (id, expected) => {
    const { tools } = await (await connect(owner)).listTools();
    expect(tools.find((tool) => tool.name === toolNameOf(id))?.annotations).toEqual(expected);
  });

  it.each([
    ["set", "target-state", { destructiveHint: false, idempotentHint: true }],
    ["overwrite", "target-state", { destructiveHint: true, idempotentHint: true }],
    ["remove", "target-state", { destructiveHint: true, idempotentHint: true }],
    ["add", undefined, { destructiveHint: false, idempotentHint: false }],
    [undefined, undefined, { destructiveHint: true, idempotentHint: false }],
  ] as const)("annotates a write whose change is %s and idempotency %s", (change, idempotency, expected) => {
    const write = defineCapability({ ...notesCreate, requiresIdempotencyKey: false, change, idempotency });
    expect(annotationsOf(write)).toMatchObject(expected);
  });

  it("annotates a set-state destructive write as destructive", () => {
    const cancel = defineCapability({ ...notesClear, change: "set" });
    expect(annotationsOf(cancel)).toMatchObject({ destructiveHint: true, idempotentHint: true });
  });

  it.each([
    ["notes.list", 0],
    ["notes.add", 2],
    ["notes.clear", 3],
  ] as const)("%s carries its risk tier in _meta", async (id, riskTier) => {
    const { tools } = await (await connect(owner)).listTools();
    expect(tools.find((tool) => tool.name === toolNameOf(id))?._meta).toEqual({ "admin-os/riskTier": riskTier });
  });

  it("keeps only the risk tier in a keyed tool's _meta: the required argument states the key (ADR 0016)", () => {
    expect(toolOf(notesCreate, { expose: true, title: "Create a note" })._meta).toEqual({ "admin-os/riskTier": 2 });
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

describe("descriptions and errors that say how to fix the call (spec 004 U3)", () => {
  const descriptionOf = async (name: string) =>
    (await (await connect(owner)).listTools()).tools.find((tool) => tool.name === name)?.description;

  it("names the tool that lists valid ids", async () => {
    expect(await descriptionOf("notes_get")).toBe(
      "Get one note by its text. Fails with notes.not_found when there is none. Find valid ids: id with notes_list.",
    );
  });

  it("writes the capabilities a summary names as tool names, and leaves a longer dotted name alone", async () => {
    expect(await descriptionOf("notes_create")).toBe(
      "Create a note, then read it with notes_list (up to notes.list_limit). Retrying with the same key creates it once.",
    );
  });

  it("explains schema.invalid_input field by field and keeps the failing paths", async () => {
    const result = await (await connect(owner)).callTool({
      name: "notes_add",
      arguments: { text: "", extra: 1, idempotencyKey: KEY },
    });
    expect(result).toMatchObject({
      isError: true,
      structuredContent: {
        code: "schema.invalid_input",
        message: expect.stringMatching(
          /^notes_add rejected its arguments: text: .+; \(arguments\): .+extra.+ Fix these fields/,
        ),
        details: { paths: ["text", ""] },
      },
    });
  });

  it("points a bad id to the tool that lists valid ones", async () => {
    const result = await (await connect(owner)).callTool({ name: "notes_get", arguments: { id: 42 } });
    expect(result).toMatchObject({
      isError: true,
      structuredContent: {
        code: "schema.invalid_input",
        message: expect.stringMatching(
          /^notes_get rejected its arguments: id: .+ Find valid ids: id with notes_list\.$/,
        ),
      },
    });
  });

  it("points a not-found id to the tool that lists valid ones, and keeps the code and details", async () => {
    const result = await (await connect(owner)).callTool({ name: "notes_get", arguments: { id: "missing" } });
    expect(result).toMatchObject({
      isError: true,
      structuredContent: {
        code: "notes.not_found",
        message: 'No note "missing". Find valid ids: id with notes_list.',
        details: { id: "missing" },
      },
    });
  });

  it("says how to send the key when a create has none", async () => {
    const result = await (await connect(owner)).callTool({ name: "notes_create", arguments: { text: "no key" } });
    expect(result).toMatchObject({
      structuredContent: {
        code: "client.idempotency_required",
        message: expect.stringMatching(/needs the idempotencyKey argument.+new UUID.+same one if you retry/),
      },
    });
  });

  it.each([
    ["a success", "notes_list", {}],
    ["a domain error", "notes_get", { id: "missing" }],
    ["a refusal before dispatch", "notes_create", { text: "no key" }],
    ["an unknown tool", "billing_export", {}],
  ] as const)("returns a correlation id in _meta on %s", async (_label, name, args) => {
    const result = await (await connect(owner)).callTool({ name, arguments: args });
    expect(result._meta?.[CORRELATION_META_KEY]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("returns the correlation id of the server's call log line", async () => {
    const lines: CallLogLine[] = [];
    const client = await connect(owner, false, { logger: (line) => lines.push(line) });
    const result = await client.callTool({ name: "notes_list", arguments: {} });
    expect(result._meta?.[CORRELATION_META_KEY]).toBe(lines[0]?.correlationId);
  });
});

describe("server metadata (spec 004 D8)", () => {
  it("reports the tool-list version as serverInfo.version", async () => {
    const client = await connect(owner);
    expect(client.getServerVersion()).toEqual({ name: "admin-os", version: toolListVersion(catalog, manifest) });
  });

  it("reports the same version to every actor of one deployment", async () => {
    const [ownerClient, readerClient] = await Promise.all([connect(owner), connect(reader)]);
    expect(readerClient.getServerVersion()?.version).toBe(ownerClient.getServerVersion()?.version);
  });

  it("changes the version when a deploy only flips the read-only switch", () => {
    expect(toolListVersion(catalog, manifest, true)).not.toBe(toolListVersion(catalog, manifest, false));
  });

  it("reports the read-only version on a read-only server", async () => {
    const client = await connect(owner, true);
    expect(client.getServerVersion()?.version).toBe(toolListVersion(catalog, manifest, true));
  });

  it.each([
    ["a title changes", { ...manifest, "notes.list": { expose: true, title: "All notes" } }],
    ["a tool becomes UI-only", { ...manifest, "notes.clear": { uiOnly: "Only a person clears every note" } }],
  ] as const)("changes the version when %s", (_label, changed) => {
    expect(toolListVersion(catalog, changed)).not.toBe(toolListVersion(catalog, manifest));
  });

  it("keeps the version stable for an equal manifest", () => {
    expect(toolListVersion(catalog, { ...manifest })).toBe(toolListVersion(catalog, manifest));
  });

  it.each([
    ["the owner", owner, false, "notes.add,notes.clear,notes.create,notes.get,notes.list read-only=false"],
    ["a reader", reader, false, "notes.get,notes.list read-only=false"],
    ["the owner on a read-only server", owner, true, "notes.get,notes.list read-only=true"],
  ] as const)("builds the instructions from the tools %s sees", async (_label, actor, readOnly, expected) => {
    const client = await connect(actor, readOnly, {
      instructions: ({ toolIds, readOnly: only }) => `${[...toolIds].sort().join(",")} read-only=${only}`,
    });
    expect(client.getInstructions()).toBe(expected);
  });
});

describe("refusals are logged (spec 004 U3)", () => {
  it.each([
    ["an unknown tool", false, "billing_export", {}, "access.forbidden"],
    ["a write on a read-only server", true, "notes_clear", {}, "access.forbidden"],
    ["a create without a key", false, "notes_create", { text: "no key" }, "client.idempotency_required"],
    ["a malformed key", false, "notes_create", { text: "bad key", idempotencyKey: "" }, "schema.invalid_input"],
    [
      "a key that is not a UUID (D2)",
      false,
      "notes_create",
      { text: "short key", idempotencyKey: "k-1" },
      "schema.invalid_input",
    ],
  ] as const)(
    "writes one line for %s, with the result's correlation id",
    async (_label, readOnly, name, args, code) => {
      const lines: RefusalLogLine[] = [];
      const client = await connect(owner, readOnly, { logRefusal: (line) => lines.push(line) });
      const result = await client.callTool({ name, arguments: args });
      expect(lines).toEqual([
        {
          event: "mcp.refused",
          tool: name,
          status: code,
          correlationId: result._meta?.[CORRELATION_META_KEY],
          actorRole: "owner",
          via: "mcp",
        },
      ]);
    },
  );

  it("writes no refusal line for a call the client dispatches", async () => {
    const lines: RefusalLogLine[] = [];
    const client = await connect(owner, false, { logRefusal: (line) => lines.push(line) });
    await client.callTool({ name: "notes_list", arguments: {} });
    expect(lines).toEqual([]);
  });
});

describe("the manifest", () => {
  const { "notes.export": _omitted, ...unclassified } = manifest;

  it.each([
    ["a capability without an entry", catalog, unclassified, /without an MCP manifest entry: notes\.export/],
    ["an entry for no capability", { "notes.list": notesList }, manifest, /entries for no capability: notes\.add/],
    ["an empty title", catalog, { ...manifest, "notes.list": { expose: true, title: " " } }, /notes\.list/],
    ["an empty reason", catalog, { ...manifest, "notes.export": { uiOnly: "" } }, /notes\.export/],
    [
      "an id hint that names no tool",
      catalog,
      { ...manifest, "notes.get": { expose: true, title: "Get a note", ids: { id: ["notes.export"] } } },
      /id hints that name no exposed tool: notes\.get/,
    ],
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
    const result = await (await connect(owner)).callTool({
      name: "notes_add",
      arguments: { text: "hello", idempotencyKey: crypto.randomUUID() },
    });
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
    const result = await (await connect(owner)).callTool({
      name: "notes_add",
      arguments: { text: "", idempotencyKey: crypto.randomUUID() },
    });
    expect(result).toMatchObject({
      isError: true,
      structuredContent: { code: "schema.invalid_input", details: { paths: ["text"] } },
    });
  });

  it("answers a write the policy holds with awaiting_approval, not an error", async () => {
    const result = await (await connect(owner, false, { policy: "all" })).callTool({
      name: "notes_add",
      arguments: { text: "urgent", idempotencyKey: crypto.randomUUID() },
    });
    expect(result).toMatchObject({
      structuredContent: { status: "awaiting_approval", approvalId: expect.any(String) },
    });
  });

  it("tells the agent not to retry a held write in the structured content too (D2)", async () => {
    const result = await (await connect(owner, false, { policy: "all" })).callTool({
      name: "notes_add",
      arguments: { text: "urgent", idempotencyKey: crypto.randomUUID() },
    });
    expect(result).toMatchObject({
      structuredContent: { status: "awaiting_approval", message: expect.stringContaining("Do not retry") },
    });
  });

  it("keeps a held write out of the error channel", async () => {
    const result = await (await connect(owner, false, { policy: "all" })).callTool({
      name: "notes_add",
      arguments: { text: "urgent", idempotencyKey: crypto.randomUUID() },
    });
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
      properties: { text: { type: "string" }, idempotencyKey: { type: "string", format: "uuid" } },
      required: ["text", "idempotencyKey"],
    });
  });

  it("advertises no idempotencyKey argument on a write that needs no key", async () => {
    const { tools } = await (await connect(owner)).listTools();
    expect(tools.find((tool) => tool.name === "notes_clear")?.inputSchema.properties).not.toHaveProperty(
      "idempotencyKey",
    );
  });

  it("applies a create retried with the same idempotencyKey argument once", async () => {
    const client = await connect(owner);
    const call = { name: "notes_create", arguments: { text: "once", idempotencyKey: KEY } };
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
      arguments: { text: "both", idempotencyKey: KEY },
      _meta: { [IDEMPOTENCY_META_KEY]: KEY },
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
      arguments: { text: "two keys", idempotencyKey: KEY },
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
    await client.callTool({ name: "notes_create", arguments: { text: "first", idempotencyKey: KEY } });
    const reused = await client.callTool({ name: "notes_create", arguments: { text: "other", idempotencyKey: KEY } });
    expect(reused).toMatchObject({ isError: true, structuredContent: { code: "client.idempotency_conflict" } });
  });

  it("refuses an idempotencyKey argument on a tool that takes none, as an unknown field", async () => {
    const result = await (await connect(owner)).callTool({
      name: "notes_clear",
      arguments: { idempotencyKey: "k-1" },
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
