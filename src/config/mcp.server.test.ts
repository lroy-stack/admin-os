import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AnyCapability } from "@/core/capability";
import type { Actor, CallLogLine } from "@/core/client";
import { toolNameOf, toolOf } from "@/core/mcp/server";
import { bookingSchema, bookingsList } from "@/modules/bookings";
import { customersList } from "@/modules/customers";
import { notificationsList, notificationsRead } from "@/modules/notifications";

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
      "settings_values_get",
      "bookings_list",
      "bookings_availability_get",
      "bookings_create",
      "bookings_update",
      "bookings_status_advance",
      "bookings_status_undo",
      "bookings_cancel",
      "bookings_no_show_mark",
      "bookings_walk_in_seat",
      "bookings_walk_in_undo",
      "catalog_list",
      "customers_list",
      "customers_get",
      "customers_duplicates_check",
      "customers_create",
      "customers_update",
      "customers_notes_add",
      "customers_block",
      "customers_unblock",
      "notifications_list",
      "notifications_unread_count",
      "notifications_read",
      "notifications_read_all",
      "resources_list",
      "staff_list",
    ]);
  });

  it.each([
    ["bookings.availability.get", 0],
    ["bookings.create", 2],
    ["bookings.update", 2],
    ["bookings.status.advance", 2],
    ["bookings.status.undo", 2],
    ["bookings.cancel", 2],
    ["bookings.no_show.mark", 2],
    ["bookings.walk_in.seat", 2],
    ["bookings.walk_in.undo", 2],
    ["customers.get", 1],
    ["customers.duplicates.check", 1],
    ["customers.create", 2],
    ["customers.update", 2],
    ["customers.notes.add", 2],
    ["customers.block", 2],
    ["customers.unblock", 2],
    ["notifications.list", 1],
    ["notifications.read", 1],
    ["notifications.read_all", 1],
  ] as const)("lists %s as a tool with risk tier %s", async (id, riskTier) => {
    const { tools } = await connect(owner);
    expect(tools.find((tool) => tool.name === toolNameOf(id))?._meta).toMatchObject({ "admin-os/riskTier": riskTier });
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

  it("creates its clients for the MCP surface, so the call line says via mcp", async () => {
    const lines: CallLogLine[] = [];
    const { client } = await connect(staff, (line) => lines.push(line));
    await client.callTool({ name: "bookings_list", arguments: {} });
    expect(lines).toMatchObject([{ capability: "bookings.list", riskTier: 1, via: "mcp" }]);
  });

  it.each(capabilities.filter((capability) => capability.requiresIdempotencyKey === true))(
    "marks the write tool $id as needing an idempotency key",
    async (capability) => {
      const { tools } = await connect(owner);
      expect(tools.find((tool) => tool.name === toolNameOf(capability.id))?._meta).toMatchObject({
        "admin-os/requiresIdempotencyKey": true,
      });
    },
  );

  it("seats a walk-in through bookings_walk_in_seat and shows it in bookings_list", async () => {
    const { client } = await connect(owner, undefined, crypto.randomUUID());
    const seated = await client.callTool({
      name: "bookings_walk_in_seat",
      arguments: { partySize: 2, resourceIds: ["S8"] },
      _meta: { "admin-os/idempotencyKey": crypto.randomUUID() },
    });
    const listed = await client.callTool({ name: "bookings_list", arguments: { limit: 200 } });
    const ids = bookingsList.output.parse(listed.structuredContent).items.map((booking) => booking.id);
    expect(ids).toContain(bookingSchema.parse(seated.structuredContent).id);
  });

  it("marks a notification read through notifications_read and lowers the unread count", async () => {
    const { client } = await connect(owner, undefined, crypto.randomUUID());
    const before = notificationsList.output.parse(
      (await client.callTool({ name: "notifications_list", arguments: { limit: 50 } })).structuredContent,
    );
    const marked = await client.callTool({
      name: "notifications_read",
      arguments: { ids: before.items.map((item) => item.id).slice(0, 1) },
      _meta: { "admin-os/idempotencyKey": crypto.randomUUID() },
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
      _meta: { "admin-os/idempotencyKey": crypto.randomUUID() },
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
      _meta: { "admin-os/idempotencyKey": crypto.randomUUID() },
    });
    expect(result).toMatchObject({ isError: true, structuredContent: { code: "access.forbidden" } });
  });

  it("refuses bookings_walk_in_seat without an idempotency key", async () => {
    const { client } = await connect(owner, undefined, crypto.randomUUID());
    const result = await client.callTool({
      name: "bookings_walk_in_seat",
      arguments: { partySize: 2, resourceIds: ["S8"] },
    });
    expect(result).toMatchObject({ isError: true, structuredContent: { code: "client.idempotency_required" } });
  });

  it("answers a tool the actor was not offered with access.forbidden, as the UI does", async () => {
    const { client } = await connect(nobody);
    const result = await client.callTool({ name: "bookings_list", arguments: {} });
    expect(result).toMatchObject({ isError: true, structuredContent: { code: "access.forbidden" } });
  });
});
