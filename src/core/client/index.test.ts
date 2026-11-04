import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { type ApprovalContext, type Catalog, defineCapability } from "@/core/capability";
import { err, ok } from "@/core/result";

import { type Adapter, type CallLogLine, createClient } from "./index";

const getThing = defineCapability({
  id: "things.thing.get",
  summary: "Get a thing",
  input: z.object({ id: z.string().min(1) }),
  output: z.object({ name: z.string() }),
  permission: "read:things",
  effect: "read",
  riskTier: 0,
});

const saveThing = defineCapability({
  id: "things.thing.save",
  summary: "Save a thing",
  input: z.object({ name: z.string(), secret: z.string().optional() }),
  output: z.object({ name: z.string() }),
  permission: "write:things",
  effect: "write",
  riskTier: 2,
});

const payThing = defineCapability({
  id: "things.thing.pay",
  summary: "Pay for a thing",
  input: z.object({ id: z.string().min(1) }),
  output: z.object({ name: z.string() }),
  permission: "write:things",
  effect: "destructive",
  riskTier: 3,
  requiresIdempotencyKey: true,
});

const catalog = {
  [getThing.id]: getThing,
  [saveThing.id]: saveThing,
  [payThing.id]: payThing,
} satisfies Catalog;

const actor = { actorId: "u1", roleId: "manager", permissions: ["read:things"] };

const setup = (
  dispatch: Adapter["dispatch"],
  mode: "development" | "production" = "production",
  timeoutMs = 5,
  via?: ApprovalContext["via"],
) => {
  const logs: CallLogLine[] = [];
  const adapter = { dispatch: vi.fn(dispatch) };
  const client = createClient(catalog, adapter, {
    actor,
    correlationId: "corr-1",
    timeoutMs,
    mode,
    retryDelayMs: 0,
    logger: (line) => logs.push(line),
    ...(via === undefined ? {} : { via }),
  });
  return { client, adapter, logs };
};

const unavailable = async () => err("transport.unavailable", "down");
const never = () => new Promise<never>(() => undefined);

describe("createClient idempotency", () => {
  it("refuses a keyless call to a capability that requires a key, before dispatch", async () => {
    const { client, adapter } = setup(async () => ok({ name: "x" }));
    const result = await client.call("things.thing.pay", { id: "a" });
    expect(result).toMatchObject({ ok: false, error: { code: "client.idempotency_required" } });
    expect(adapter.dispatch).not.toHaveBeenCalled();
  });

  it.each([
    ["an empty key", ""],
    ["a missing key", undefined],
  ] as const)("refuses %s as client.idempotency_required", async (_label, key) => {
    const { client, adapter } = setup(async () => ok({ name: "x" }));
    const result = await client.call("things.thing.pay", { id: "a" }, key === undefined ? {} : { idempotencyKey: key });
    expect(result).toMatchObject({ ok: false, error: { code: "client.idempotency_required" } });
    expect(adapter.dispatch).not.toHaveBeenCalled();
  });

  it("rejects an over-long key as schema.invalid_input with the key path", async () => {
    const { client, adapter } = setup(async () => ok({ name: "x" }));
    const result = await client.call("things.thing.pay", { id: "a" }, { idempotencyKey: "k".repeat(129) });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "schema.invalid_input", details: { paths: ["idempotencyKey"] } },
    });
    expect(adapter.dispatch).not.toHaveBeenCalled();
  });

  it("logs a call refused for a missing key with its code, tier and surface", async () => {
    const { client, logs } = setup(async () => ok({ name: "x" }), "production", 5, "mcp");
    await client.call("things.thing.pay", { id: "a" });
    expect(logs[0]).toMatchObject({
      status: "error",
      code: "client.idempotency_required",
      riskTier: 3,
      via: "mcp",
    });
  });

  it("dispatches the same call when a key is given", async () => {
    const { client, adapter } = setup(async () => ok({ name: "x" }));
    const result = await client.call("things.thing.pay", { id: "a" }, { idempotencyKey: "k1" });
    expect(result).toEqual({ ok: true, value: { name: "x" } });
    expect(adapter.dispatch).toHaveBeenCalledTimes(1);
  });
});

describe("createClient validation", () => {
  it("rejects invalid input with schema.invalid_input and the issue paths", async () => {
    const { client, adapter } = setup(async () => ok({ name: "x" }));
    const result = await client.call("things.thing.get", { id: "" });
    expect(result).toMatchObject({ ok: false, error: { code: "schema.invalid_input", details: { paths: ["id"] } } });
    expect(adapter.dispatch).not.toHaveBeenCalled();
  });

  it("returns client.unknown_capability for an id outside the catalog", async () => {
    const { client } = setup(async () => ok({}));
    const result = await (client as unknown as { call: (id: string, input: unknown) => Promise<unknown> }).call(
      "nope.nope.nope",
      {},
    );
    expect(result).toMatchObject({ ok: false, error: { code: "client.unknown_capability" } });
  });

  it("returns schema.invalid_output in production", async () => {
    const { client } = setup(async () => ok({ name: 1 }));
    const result = await client.call("things.thing.get", { id: "a" });
    expect(result).toMatchObject({ ok: false, error: { code: "schema.invalid_output" } });
  });

  it("throws in development and names the capability", async () => {
    const { client } = setup(async () => ok({ name: 1 }), "development");
    await expect(client.call("things.thing.get", { id: "a" })).rejects.toThrow("things.thing.get");
  });

  it("passes the parsed output through on success", async () => {
    const { client } = setup(async () => ok({ name: "ok", extra: true }));
    expect(await client.call("things.thing.get", { id: "a" })).toEqual({ ok: true, value: { name: "ok" } });
  });

  it("passes an error result through without output validation", async () => {
    const { client } = setup(async () => err("things.not_found", "gone"));
    expect(await client.call("things.thing.get", { id: "a" })).toMatchObject({ error: { code: "things.not_found" } });
  });

  it("passes AwaitingApproval through without output validation", async () => {
    const { client } = setup(async () => ({ status: "awaiting_approval", approvalId: "p1" }));
    expect(await client.call("things.thing.save", { name: "big" })).toEqual({
      status: "awaiting_approval",
      approvalId: "p1",
    });
  });
});

describe("createClient transport", () => {
  it("returns transport.timeout when the adapter never answers", async () => {
    const { client } = setup(never);
    const result = await client.call("things.thing.save", { name: "a" });
    expect(result).toMatchObject({ ok: false, error: { code: "transport.timeout" } });
  });

  it("returns transport.timeout when the caller aborts", async () => {
    const { client } = setup(never, "production", 5000);
    const result = await client.call("things.thing.save", { name: "a" }, { signal: AbortSignal.abort() });
    expect(result).toMatchObject({ ok: false, error: { code: "transport.timeout" } });
  });

  it("returns transport.unavailable when the adapter throws", async () => {
    const { client } = setup(async () => {
      throw new Error("boom");
    });
    const result = await client.call("things.thing.save", { name: "a" });
    expect(result).toMatchObject({ ok: false, error: { code: "transport.unavailable" } });
  });

  it("forwards actor, correlation id and idempotency key to the adapter", async () => {
    const { client, adapter } = setup(async () => ok({ name: "a" }));
    await client.call("things.thing.save", { name: "a" }, { idempotencyKey: "k1" });
    expect(adapter.dispatch.mock.calls[0]?.[2]).toMatchObject({ actor, correlationId: "corr-1", idempotencyKey: "k1" });
  });
});

describe("createClient retry", () => {
  it("retries a read once and returns the later success", async () => {
    let calls = 0;
    const { client, adapter } = setup(async () =>
      ++calls === 1 ? err("transport.unavailable", "down") : ok({ name: "a" }),
    );
    expect(await client.call("things.thing.get", { id: "a" })).toEqual({ ok: true, value: { name: "a" } });
    expect(adapter.dispatch).toHaveBeenCalledTimes(2);
  });

  it("does not retry a read twice", async () => {
    const { client, adapter } = setup(unavailable);
    await client.call("things.thing.get", { id: "a" });
    expect(adapter.dispatch).toHaveBeenCalledTimes(2);
  });

  it("does not retry a read on a domain error", async () => {
    const { client, adapter } = setup(async () => err("things.not_found", "gone"));
    await client.call("things.thing.get", { id: "a" });
    expect(adapter.dispatch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a write without an idempotency key", async () => {
    const { client, adapter } = setup(unavailable);
    await client.call("things.thing.save", { name: "a" });
    expect(adapter.dispatch).toHaveBeenCalledTimes(1);
  });

  it("retries a write that carries an idempotency key", async () => {
    const { client, adapter } = setup(unavailable);
    await client.call("things.thing.save", { name: "a" }, { idempotencyKey: "k1" });
    expect(adapter.dispatch).toHaveBeenCalledTimes(2);
  });
});

describe("createClient logging", () => {
  it("logs one line with the contract fields", async () => {
    const { client, logs } = setup(async () => ok({ name: "a" }));
    await client.call("things.thing.get", { id: "a" });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      capability: "things.thing.get",
      effect: "read",
      status: "ok",
      correlationId: "corr-1",
      actorRole: "manager",
    });
  });

  it("logs the risk tier and the surface, defaulting to the UI", async () => {
    const { client, logs } = setup(async () => ok({ name: "a" }));
    await client.call("things.thing.get", { id: "a" });
    expect(logs[0]).toMatchObject({ riskTier: 0, via: "ui" });
  });

  it("logs the surface the client was created for", async () => {
    const { client, logs } = setup(async () => ok({ name: "a" }), "production", 5, "mcp");
    await client.call("things.thing.get", { id: "a" });
    expect(logs[0]).toMatchObject({ via: "mcp" });
  });

  it("logs an unknown risk tier for an id outside the catalog", async () => {
    const { client, logs } = setup(async () => ok({}));
    await (client as unknown as { call: (id: string, input: unknown) => Promise<unknown> }).call("nope.nope.nope", {});
    expect(logs[0]).toMatchObject({ effect: "unknown", riskTier: "unknown" });
  });

  it("logs the error code on failure", async () => {
    const { client, logs } = setup(async () => err("things.not_found", "gone"));
    await client.call("things.thing.get", { id: "a" });
    expect(logs[0]).toMatchObject({ status: "error", code: "things.not_found" });
  });

  it("logs awaiting_approval status", async () => {
    const { client, logs } = setup(async () => ({ status: "awaiting_approval", approvalId: "p1" }));
    await client.call("things.thing.save", { name: "big" });
    expect(logs[0]?.status).toBe("awaiting_approval");
  });

  it("never logs input values", async () => {
    const { client, logs } = setup(async () => ok({ name: "a" }));
    await client.call("things.thing.save", { name: "Ada Lovelace", secret: "hunter2" });
    const line = JSON.stringify(logs[0]);
    expect(line).not.toContain("hunter2");
    expect(line).not.toContain("Ada Lovelace");
  });

  it("logs a call that throws in development", async () => {
    const { client, logs } = setup(async () => ok({ name: 1 }), "development");
    await client.call("things.thing.get", { id: "a" }).catch(() => undefined);
    expect(logs[0]).toMatchObject({ status: "error" });
  });
});
