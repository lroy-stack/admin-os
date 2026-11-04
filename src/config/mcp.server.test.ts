import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Actor, CallLogLine } from "@/core/client";
import { type ExposedEntry, exposedCapabilities, toolNameOf, toolOf } from "@/core/mcp/server";
import { bookingSchema, bookingsList } from "@/modules/bookings";
import { customersList } from "@/modules/customers";
import { notificationsList, notificationsRead } from "@/modules/notifications";

import { demoActor } from "./actor";
import { CATALOG } from "./catalog";
import { createMcpServer } from "./mcp.server";
import { MCP_MANIFEST } from "./mcp-manifest";
import { VERTICALS } from "./vertical";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
  headers: async () => new Headers(),
}));

const hospitality = VERTICALS.hospitality;
const owner = demoActor("owner", hospitality);
const staff = demoActor("staff", hospitality);
const nobody: Actor = { actorId: "anonymous", roleId: "anonymous", permissions: [] };
const capabilities = exposedCapabilities(CATALOG, MCP_MANIFEST);
const staffTools = capabilities
  .filter((capability) => staff.permissions.includes(capability.permission))
  .map((capability) => toolNameOf(capability.id))
  .sort();

/**
 * The surface an agent sees, pinned per tool (spec 004 AC7): name, readOnlyHint, destructiveHint, idempotentHint,
 * risk tier, and whether the tool requires the idempotencyKey argument. A change here is a change of requirement.
 */
const PINNED = [
  ["access_me_get", true, false, true, 1, false],
  ["bookings_availability_get", true, false, true, 0, false],
  ["bookings_cancel", false, true, true, 2, false],
  ["bookings_create", false, false, true, 2, true],
  ["bookings_list", true, false, true, 1, false],
  ["bookings_no_show_mark", false, true, true, 2, false],
  ["bookings_status_advance", false, false, true, 2, false],
  ["bookings_update", false, true, true, 2, false],
  ["bookings_walk_in_seat", false, false, true, 2, true],
  ["catalog_list", true, false, true, 0, false],
  ["clock_get", true, false, true, 0, false],
  ["customers_block", false, true, true, 2, false],
  ["customers_create", false, false, true, 2, true],
  ["customers_duplicates_check", true, false, true, 1, false],
  ["customers_get", true, false, true, 1, false],
  ["customers_list", true, false, true, 1, false],
  ["customers_notes_add", false, false, true, 2, true],
  ["customers_unblock", false, true, true, 2, false],
  ["customers_update", false, true, true, 2, false],
  ["notifications_list", true, false, true, 1, false],
  ["notifications_read", false, false, true, 1, false],
  ["notifications_read_all", false, false, true, 1, false],
  ["notifications_unread_count", true, false, true, 1, false],
  ["resources_list", true, false, true, 0, false],
  ["settings_values_get", true, false, true, 0, false],
  ["staff_list", true, false, true, 1, false],
] as const;

const open: Client[] = [];

afterEach(async () => {
  await Promise.all(open.splice(0).map((client) => client.close()));
});

/** An MCP client on the hospitality preset, listing first as real clients do (so calls validate their output). */
const connect = async (actor: Actor, logger?: (line: CallLogLine) => void, sessionId?: string) => {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "admin-os-test", version: "0.0.0" });
  await createMcpServer({
    actor,
    vertical: "hospitality",
    ...(sessionId === undefined ? {} : { sessionId }),
    ...(logger === undefined ? {} : { logger }),
  }).connect(serverSide);
  await client.connect(clientSide);
  open.push(client);
  return { client, tools: (await client.listTools()).tools };
};

describe("the MCP projection of the catalogue (ADR 0009)", () => {
  it.each(capabilities)("projects $id to one tool with JSON Schemas", (capability) => {
    const entry = MCP_MANIFEST[capability.id as keyof typeof MCP_MANIFEST] as ExposedEntry;
    expect(toolOf(capability, entry)).toMatchObject({
      name: toolNameOf(capability.id),
      title: entry.title,
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
    });
  });

  it("lists every capability the hospitality owner reaches, in name order", async () => {
    const { tools } = await connect(owner);
    expect(tools.map((tool) => tool.name)).toEqual(PINNED.map(([name]) => name));
  });

  it.each(PINNED)(
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

  it.each(["bookings_status_undo", "bookings_walk_in_undo"])(
    "answers the UI-only %s with access.forbidden (ADR 0016, resolution 3)",
    async (name) => {
      const { client } = await connect(owner, undefined, crypto.randomUUID());
      const result = await client.callTool({ name, arguments: { id: "R-1046" } });
      expect(result).toMatchObject({ isError: true, structuredContent: { code: "access.forbidden" } });
    },
  );

  it("lists for staff only the tools its permissions reach", async () => {
    const { tools } = await connect(staff);
    expect(tools.map((tool) => tool.name)).toEqual(staffTools);
  });

  it("lists nothing for an actor without permissions", async () => {
    const { tools } = await connect(nobody);
    expect(tools).toEqual([]);
  });

  it.each([
    ["a writable server", false, /idempotencyKey/],
    ["a read-only server", true, /read-only/],
  ] as const)("tells the agent how to find ids on %s", async (_label, readOnly, rest) => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "admin-os-test", version: "0.0.0" });
    await createMcpServer({ actor: owner, vertical: "hospitality", readOnly }).connect(serverSide);
    await client.connect(clientSide);
    open.push(client);
    expect([client.getInstructions(), client.getInstructions()]).toEqual([
      expect.stringContaining("booking ids with bookings_list"),
      expect.stringMatching(rest),
    ]);
  });

  it.each([
    ["bookings_list", bookingsList.output],
    ["customers_list", customersList.output],
  ] as const)("%s returns structured content that matches the capability output", async (name, output) => {
    const { client } = await connect(staff);
    const result = await client.callTool({ name, arguments: { limit: 5 } });
    expect(output.safeParse(result.structuredContent)).toMatchObject({ success: true });
  });

  it("creates its clients for the MCP surface, so the call line says via mcp", async () => {
    const lines: CallLogLine[] = [];
    const { client } = await connect(staff, (line) => lines.push(line));
    await client.callTool({ name: "bookings_list", arguments: {} });
    expect(lines).toMatchObject([{ capability: "bookings.list", riskTier: 1, via: "mcp" }]);
  });

  it("seats a walk-in with arguments only and shows it in bookings_list (AC4)", async () => {
    const { client } = await connect(owner, undefined, crypto.randomUUID());
    const seated = await client.callTool({
      name: "bookings_walk_in_seat",
      arguments: { partySize: 2, resourceIds: ["S8"], idempotencyKey: crypto.randomUUID() },
    });
    const listed = await client.callTool({ name: "bookings_list", arguments: { limit: 200 } });
    const ids = bookingsList.output.parse(listed.structuredContent).items.map((booking) => booking.id);
    expect(ids).toContain(bookingSchema.parse(seated.structuredContent).id);
  });

  it("seats a walk-in retried with the same idempotencyKey once (AC4)", async () => {
    const { client } = await connect(owner, undefined, crypto.randomUUID());
    const call = {
      name: "bookings_walk_in_seat",
      arguments: { partySize: 2, resourceIds: ["S8"], idempotencyKey: crypto.randomUUID() },
    };
    const first = bookingSchema.parse((await client.callTool(call)).structuredContent);
    const retry = bookingSchema.parse((await client.callTool(call)).structuredContent);
    const listed = await client.callTool({ name: "bookings_list", arguments: { limit: 200 } });
    const walkIns = bookingsList.output
      .parse(listed.structuredContent)
      .items.filter((booking) => booking.resourceIds.includes("S8") && booking.origin === "walk_in");
    expect([retry.id, walkIns.map((booking) => booking.id)]).toEqual([first.id, [first.id]]);
  });

  it("advances a booking's status without a key, and a repeated advance changes nothing (AC4)", async () => {
    const { client } = await connect(owner, undefined, crypto.randomUUID());
    const call = { name: "bookings_status_advance", arguments: { id: "R-1046", to: "in_progress" } };
    const advanced = await client.callTool(call);
    const repeated = await client.callTool(call);
    const listed = await client.callTool({ name: "bookings_list", arguments: { limit: 200 } });
    const found = bookingsList.output.parse(listed.structuredContent).items.find((booking) => booking.id === "R-1046");
    expect([advanced.structuredContent, repeated, found?.status]).toMatchObject([
      { status: "in_progress" },
      { isError: true, structuredContent: { code: "bookings.invalid_transition" } },
      "in_progress",
    ]);
  });

  it("marks a notification read through notifications_read and lowers the unread count", async () => {
    const { client } = await connect(owner, undefined, crypto.randomUUID());
    const before = notificationsList.output.parse(
      (await client.callTool({ name: "notifications_list", arguments: { limit: 50 } })).structuredContent,
    );
    const marked = await client.callTool({
      name: "notifications_read",
      arguments: { ids: before.items.map((item) => item.id).slice(0, 1) },
    });
    const after = notificationsList.output.parse(
      (await client.callTool({ name: "notifications_list", arguments: { limit: 50 } })).structuredContent,
    );
    expect([notificationsRead.output.parse(marked.structuredContent).marked, after.unreadCount]).toEqual([
      1,
      before.unreadCount - 1,
    ]);
  });

  it("cancels a booking through bookings_cancel with a reason and shows it cancelled in bookings_list", async () => {
    const { client } = await connect(owner, undefined, crypto.randomUUID());
    const cancelled = await client.callTool({
      name: "bookings_cancel",
      arguments: { id: "R-1046", reason: "Guest called" },
    });
    const listed = await client.callTool({ name: "bookings_list", arguments: { limit: 200 } });
    const found = bookingsList.output.parse(listed.structuredContent).items.find((booking) => booking.id === "R-1046");
    expect([bookingSchema.parse(cancelled.structuredContent).status, found?.status, found?.cancelReason]).toEqual([
      "cancelled",
      "cancelled",
      "Guest called",
    ]);
  });

  it("refuses bookings_cancel for staff, who do not hold cancel:bookings", async () => {
    const { client } = await connect(staff, undefined, crypto.randomUUID());
    const result = await client.callTool({
      name: "bookings_cancel",
      arguments: { id: "R-1046", reason: "Guest called" },
    });
    expect(result).toMatchObject({ isError: true, structuredContent: { code: "access.forbidden" } });
  });

  it("refuses bookings_walk_in_seat without an idempotency key", async () => {
    const { client } = await connect(owner, undefined, crypto.randomUUID());
    const result = await client.callTool({
      name: "bookings_walk_in_seat",
      arguments: { partySize: 2, resourceIds: ["S8"] },
    });
    expect(result).toMatchObject({
      isError: true,
      structuredContent: {
        code: "client.idempotency_required",
        message: expect.stringContaining("bookings_walk_in_seat needs the idempotencyKey argument"),
        details: { paths: ["idempotencyKey"] },
      },
    });
  });

  it.each([
    ["bookings_create", "customerId with customers_list or customers_duplicates_check"],
    ["bookings_create", "resourceIds with bookings_availability_get or resources_list"],
    ["bookings_cancel", "id with bookings_list"],
    ["customers_notes_add", "id with customers_list or customers_duplicates_check"],
    ["notifications_read", "ids with notifications_list"],
  ] as const)("describes %s with where to find %s (spec 004 U3)", async (name, source) => {
    const { tools } = await connect(owner);
    expect(tools.find((tool) => tool.name === name)?.description).toMatch(
      new RegExp(`Find valid ids: (?:[^.]+; )?${source}[;.]`),
    );
  });

  it("names tools, not capability ids, in a description", async () => {
    const { tools } = await connect(owner);
    expect(tools.find((tool) => tool.name === "customers_duplicates_check")?.description).toContain(
      "Use it before customers_create.",
    );
  });

  it("answers a bookings_cancel without an id with the field and the tool that lists booking ids", async () => {
    const { client } = await connect(owner, undefined, crypto.randomUUID());
    const result = await client.callTool({ name: "bookings_cancel", arguments: { reason: "Guest called" } });
    expect(result).toMatchObject({
      isError: true,
      structuredContent: {
        code: "schema.invalid_input",
        message: expect.stringMatching(
          /^bookings_cancel rejected its arguments: id: .+ Find valid ids: id with bookings_list\.$/,
        ),
        details: { paths: ["id"] },
      },
    });
  });

  it("answers an unknown customer with customers.not_found and the tools that list customer ids", async () => {
    const { client } = await connect(owner, undefined, crypto.randomUUID());
    const result = await client.callTool({ name: "customers_get", arguments: { id: "C-404" } });
    expect(result).toMatchObject({
      isError: true,
      structuredContent: {
        code: "customers.not_found",
        message: expect.stringMatching(/Find valid ids: id with customers_list or customers_duplicates_check\.$/),
      },
    });
  });

  it("returns the call's correlation id in _meta, as in the call log line", async () => {
    const lines: CallLogLine[] = [];
    const { client } = await connect(staff, (line) => lines.push(line));
    const result = await client.callTool({ name: "bookings_list", arguments: { limit: 1 } });
    expect(result._meta?.["admin-os/correlationId"]).toBe(lines[0]?.correlationId);
  });

  it("answers a tool the actor was not offered with access.forbidden, as the UI does", async () => {
    const { client } = await connect(nobody);
    const result = await client.callTool({ name: "bookings_list", arguments: {} });
    expect(result).toMatchObject({ isError: true, structuredContent: { code: "access.forbidden" } });
  });
});
