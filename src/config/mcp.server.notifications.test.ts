import { describe, expect, it, vi } from "vitest";

import { notificationsList, notificationsRead } from "@/modules/notifications";

import { connect, itDescribesWhereToFindIds, itPinsToolsOf, owner, type PinnedTool } from "./mcp.server.testkit";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
  headers: async () => new Headers(),
}));

/** What an agent gets from the `notifications` module's tools (ADR 0017 §7; the generic cases are in mcp.server.test.ts). */
const PINNED = [
  ["notifications_list", true, false, true, 1, false],
  ["notifications_read", false, false, true, 1, false],
  ["notifications_read_all", false, false, true, 1, false],
  ["notifications_unread_count", true, false, true, 1, false],
] as const satisfies readonly PinnedTool[];

describe("the notifications tools (ADR 0009)", () => {
  itPinsToolsOf(PINNED, "notifications");

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

  itDescribesWhereToFindIds([["notifications_read", "ids with notifications_list"]]);

  it("tells agents to bound notifications_read_all with upTo from notifications_list", async () => {
    const { tools } = await connect(owner);
    expect(tools.find((tool) => tool.name === "notifications_read_all")?.description).toContain(
      "Pass upTo, the id of the newest notification you saw in notifications_list",
    );
  });
});
