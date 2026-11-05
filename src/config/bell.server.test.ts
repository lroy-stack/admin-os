import { describe, expect, it } from "vitest";

import type { ModuleManifest, ModuleServer } from "@/core/module";
import { type CallResult, err, ok } from "@/core/result";

import {
  type BellModules,
  type BellRuntime,
  bellErrors,
  bellRequestSchema,
  bellUnread,
  bellWriteOf,
  loadBell,
} from "./bell.server";

describe("the bell's one request (ADR 0017 'The bell')", () => {
  it.each([
    [{ op: "load" }],
    [{ op: "read", feed: "notifications", input: { ids: ["booking.new:R-1"] } }],
    [{ op: "readAll", feed: "notifications", input: { upTo: "booking.new:R-1" } }],
    [{ op: "approve", input: { approvalId: "a-1" } }],
    [{ op: "reject", input: { approvalId: "a-1", reason: "no" } }],
  ])("accepts %j", (request) => {
    expect(bellRequestSchema.safeParse(request).success).toBe(true);
  });

  it.each([
    ["an operation it does not have", { op: "delete", feed: "notifications", input: {} }],
    ["a read without a feed", { op: "read", input: {} }],
    ["a load with a payload", { op: "load", input: {} }],
    ["an approval with a feed", { op: "approve", feed: "approvals", input: {} }],
    ["something that is not an object", "load"],
  ])("refuses %s", (_case, request) => {
    expect(bellRequestSchema.safeParse(request).success).toBe(false);
  });
});

describe("the capability a write request runs", () => {
  it("runs the kernel's approvals.approve and approvals.reject for a decision", () => {
    expect([bellWriteOf({ op: "approve", input: {} }), bellWriteOf({ op: "reject", input: {} })]).toEqual([
      "approvals.approve",
      "approvals.reject",
    ]);
  });

  it("names nothing for a feed no installed module declares", () => {
    expect(bellWriteOf({ op: "read", feed: "no-such-feed", input: {} })).toBeUndefined();
  });
});

const feedManifest = (id: string, permission: string): ModuleManifest =>
  ({
    id,
    capabilities: {
      [`${id}.list`]: { permission },
      [`${id}.unread`]: { permission },
      [`${id}.write`]: { permission: "write:x", effect: "write" },
    },
    feeds: [{ feed: id, list: `${id}.list`, unread: `${id}.unread`, read: `${id}.read`, readAll: `${id}.read_all` }],
  }) as unknown as ModuleManifest;

const feedServer = (id: string, errors?: ModuleServer["errors"]): ModuleServer =>
  ({
    id,
    feeds: {
      [id]: {
        rows: (page: unknown) =>
          (page as { items?: { id: string }[] }).items?.map((item) => ({
            id: item.id,
            kind: "k",
            title: item.id,
            body: "",
            unread: true,
          })),
      },
    },
    ...(errors === undefined ? {} : { errors }),
  }) as unknown as ModuleServer;

const modulesOf = (...ids: string[]): BellModules => ({
  manifests: ids.map((id) => feedManifest(id, `read:${id}`)),
  servers: ids.map((id) => feedServer(id)),
});

const runtimeOf = (
  answers: Record<string, CallResult<unknown>>,
  permissions: readonly string[],
): { runtime: BellRuntime; calls: string[] } => {
  const calls: string[] = [];
  return {
    calls,
    runtime: {
      permissions,
      locale: "en",
      call: async (id) => {
        calls.push(id);
        return answers[id] ?? err("unavailable", "no answer");
      },
    },
  };
};

const EMPTY_APPROVALS = ok({ items: [], nextCursor: null });

describe("what the bell asks of whom", () => {
  it("lists approvals only for an actor who may review them", async () => {
    const { runtime, calls } = runtimeOf({ "approvals.list": EMPTY_APPROVALS }, ["decide:approvals"]);

    await bellUnread(runtime, modulesOf());
    await loadBell(runtime, modulesOf());

    expect(calls).toEqual([]);
  });

  it("lists approvals for an actor who reviews, and counts none unread", async () => {
    const { runtime, calls } = runtimeOf({ "approvals.list": EMPTY_APPROVALS }, ["review:approvals"]);

    const unread = await bellUnread(runtime, modulesOf());

    expect([calls, unread]).toEqual([["approvals.list"], 0]);
  });
});

describe("bellUnread when a feed fails", () => {
  it("sums the feeds that answered and keeps the bell", async () => {
    const { runtime } = runtimeOf({ "a.unread": ok({ unreadCount: 2 }), "b.unread": err("unavailable", "down") }, [
      "read:a",
      "read:b",
    ]);

    expect(await bellUnread(runtime, modulesOf("a", "b"))).toBe(2);
  });

  it("keeps the bell for the approvals when the only feed fails", async () => {
    const { runtime } = runtimeOf({ "a.unread": err("unavailable", "down"), "approvals.list": EMPTY_APPROVALS }, [
      "read:a",
      "review:approvals",
    ]);

    expect(await bellUnread(runtime, modulesOf("a"))).toBe(0);
  });

  it("hides the bell when nothing answered", async () => {
    const { runtime } = runtimeOf({ "a.unread": err("unavailable", "down") }, ["read:a"]);

    expect(await bellUnread(runtime, modulesOf("a"))).toBeUndefined();
  });

  it("hides the bell when the actor sees no feed and cannot review", async () => {
    const { runtime } = runtimeOf({}, []);

    expect(await bellUnread(runtime, modulesOf("a"))).toBeUndefined();
  });
});

describe("loadBell when a feed fails", () => {
  it("shows the rows that answered and the worded error of the feed that did not", async () => {
    const { runtime } = runtimeOf({ "a.list": ok({ items: [{ id: "x" }] }), "b.list": err("b.broken", "down") }, [
      "read:a",
      "read:b",
    ]);
    const installed: BellModules = {
      manifests: modulesOf("a", "b").manifests,
      servers: [feedServer("a"), feedServer("b", { en: { "b.broken": "B is broken." }, es: {}, de: {}, fr: {} })],
    };

    const panel = await loadBell(runtime, installed);

    expect(panel).toEqual(ok({ items: [expect.objectContaining({ id: "x", feed: "a" })], failures: ["B is broken."] }));
  });

  it("words a page that fails its shape as an invalid output", async () => {
    const { runtime } = runtimeOf({ "a.list": ok({ nothing: true }) }, ["read:a"]);

    const panel = await loadBell(runtime, modulesOf("a"));

    expect(panel).toMatchObject({ ok: true, value: { items: [], failures: [expect.any(String)] } });
  });

  it("words an approvals.list that waits for approval as unavailable", async () => {
    const { runtime } = runtimeOf({ "approvals.list": { status: "awaiting_approval" } as never }, ["review:approvals"]);

    const panel = await loadBell(runtime, modulesOf());

    expect(panel).toMatchObject({ ok: true, value: { items: [], failures: [expect.any(String)] } });
  });
});

describe("the error dictionary of the panel", () => {
  it("merges the approvals texts with the modules that declare feeds or write", () => {
    const installed: BellModules = {
      manifests: [feedManifest("a", "read:a"), { id: "w", capabilities: { "w.do": { effect: "write" } } } as never],
      servers: [
        feedServer("a", { en: { "a.code": "A" }, es: {}, de: {}, fr: {} }),
        { id: "w", errors: { en: { "w.start_passed": "W" }, es: {}, de: {}, fr: {} } } as never,
        { id: "z", errors: { en: { "z.code": "Z" }, es: {}, de: {}, fr: {} } } as never,
      ],
    };

    const english = bellErrors(installed).en;

    expect([
      english["a.code"],
      english["w.start_passed"],
      english["z.code"],
      "approvals.not_pending" in english,
    ]).toEqual(["A", "W", undefined, true]);
  });
});

describe("the words of a waiting write (ADR 0017 'The bell')", () => {
  const held = (capabilityId: string) => ({
    items: [
      {
        approvalId: "apr-1",
        capabilityId,
        status: "pending",
        requestedBy: { actorId: "a", role: "owner", via: "mcp" },
        requestedAt: "2026-10-31T12:00:00.000Z",
        expiresAt: "2026-11-01T12:00:00.000Z",
        input: { id: "W-7" },
      },
    ],
    nextCursor: null,
  });
  const reviewer = (capabilityId: string): BellRuntime => ({
    call: async () => ok(held(capabilityId)),
    permissions: ["review:approvals"],
    locale: "es",
  });
  const widgetServer = {
    id: "widgets",
    approvals: {
      en: { "widgets.retire": "An assistant asks to retire widget {target}." },
      es: { "widgets.retire": "Un asistente pide retirar el widget {target}." },
      de: { "widgets.retire": "Ein Assistent möchte das Widget {target} stilllegen." },
      fr: { "widgets.retire": "Un assistant demande de retirer le widget {target}." },
    },
  } as unknown as ModuleServer;
  const installed: BellModules = { manifests: [], servers: [widgetServer] };

  it("words a held write of a module capability with the sentence of the module that owns it", async () => {
    const panel = await loadBell(reviewer("widgets.retire"), installed);
    expect(panel).toMatchObject({ ok: true, value: { items: [{ body: "Un asistente pide retirar el widget W-7." }] } });
  });

  it("words a held write no installed module has a sentence for with the generic text", async () => {
    const panel = await loadBell(reviewer("gadgets.scrap"), installed);
    expect(panel).toMatchObject({
      ok: true,
      value: { items: [{ body: "Un asistente pide hacer un cambio en W-7." }] },
    });
  });
});
