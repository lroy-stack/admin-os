import { describe, expect, it } from "vitest";

import { MAX_REPLAYS } from "../src/bounds";
import { SCHEMA_VERSION } from "../src/demo-store";
import { clientFor, contextFor, stubFor } from "./support";
import { abortAllDurableObjects, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";

type Client = ReturnType<typeof clientFor>;

let customers = 0;

/** A customer no other call made, so the directory's duplicate check never answers for it. */
const newCustomer = (name: string) => ({ name, phone: `+346${String(++customers).padStart(8, "0")}` });

const customerCount = async (client: Client): Promise<number> => {
  const answer = await client.call("customers.list", { limit: 200 });
  return "ok" in answer && answer.ok ? (answer.value as { items: unknown[] }).items.length : Number.NaN;
};

/** Writes `count` customers one after another, each under its own idempotency key. */
const writeSequentially = async (client: Client, count: number): Promise<void> => {
  for (let written = 0; written < count; written++) {
    await client.call("customers.create", newCustomer(`Bounded ${written}`), { idempotencyKey: `key-${written}` });
  }
};

/** A write the object holds for 300 ms (a forced latency fault), so a test can act on the object meanwhile. */
const heldWrite = (sessionId: string, name: string) =>
  stubFor(sessionId).dispatch(
    "customers.create",
    newCustomer(name),
    contextFor(sessionId, { idempotencyKey: `held-${name}`, faults: [["customers.create", { latencyMs: 300 }]] }),
  );

/** How many `session` tables the object has: 0 until its first kept write, and again after the idle alarm. */
const sessionTables = (sessionId: string) =>
  runInDurableObject(
    stubFor(sessionId),
    (_instance, state) =>
      state.storage.sql.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'session'").toArray()
        .length,
  );

/** The saved row of an object: its schema version and how many replay records the snapshot holds. */
const savedRow = (sessionId: string) =>
  runInDurableObject(stubFor(sessionId), (_instance, state) => {
    const row = state.storage.sql.exec("SELECT schema_version, snapshot FROM session").one();
    const snapshot = JSON.parse(String(row.snapshot)) as { replays: unknown[] };
    return { schemaVersion: row.schema_version, replays: snapshot.replays.length };
  });

describe("DemoStore", () => {
  it("applies 20 parallel writes with the same idempotency key once", async () => {
    const client = clientFor(crypto.randomUUID());
    const before = await customerCount(client);
    const key = crypto.randomUUID();
    const customer = newCustomer("Parallel");

    const answers = await Promise.all(
      Array.from({ length: 20 }, () => client.call("customers.create", customer, { idempotencyKey: key })),
    );

    expect([answers.every((answer) => "ok" in answer && answer.ok), (await customerCount(client)) - before]).toEqual([
      true,
      1,
    ]);
  });

  it("applies parallel writes with different keys separately", async () => {
    const client = clientFor(crypto.randomUUID());
    const before = await customerCount(client);

    await Promise.all(
      Array.from({ length: 20 }, () =>
        client.call("customers.create", newCustomer("Separate"), { idempotencyKey: crypto.randomUUID() }),
      ),
    );

    expect(await customerCount(client)).toBe(before + 20);
  });

  it("answers client.idempotency_conflict for the same key with another input", async () => {
    const client = clientFor(crypto.randomUUID());
    const key = crypto.randomUUID();
    await client.call("customers.create", newCustomer("First"), { idempotencyKey: key });

    expect(await client.call("customers.create", newCustomer("Second"), { idempotencyKey: key })).toMatchObject({
      ok: false,
      error: { code: "client.idempotency_conflict" },
    });
  });

  it("keeps a visitor's writes out of another visitor's session", async () => {
    const writer = clientFor(crypto.randomUUID());
    const reader = clientFor(crypto.randomUUID());
    const before = await customerCount(reader);

    await writer.call("customers.create", newCustomer("Mine"), { idempotencyKey: crypto.randomUUID() });

    expect(await customerCount(reader)).toBe(before);
  });

  it("serves a write from storage after the object is evicted", async () => {
    const sessionId = crypto.randomUUID();
    const client = clientFor(sessionId);
    const before = await customerCount(client);
    await client.call("customers.create", newCustomer("Kept"), { idempotencyKey: crypto.randomUUID() });

    await abortAllDurableObjects();

    expect(await customerCount(client)).toBe(before + 1);
  });

  it("resets to the seed when the saved schemaVersion is not the current one", async () => {
    const sessionId = crypto.randomUUID();
    const client = clientFor(sessionId);
    const before = await customerCount(client);
    await client.call("customers.create", newCustomer("Outdated"), { idempotencyKey: crypto.randomUUID() });
    await runInDurableObject(stubFor(sessionId), (_instance, state) => {
      state.storage.sql.exec("UPDATE session SET schema_version = 0");
    });

    await abortAllDurableObjects();

    expect(await customerCount(client)).toBe(before);
  });

  it("deletes the session when the idle alarm fires", async () => {
    const sessionId = crypto.randomUUID();
    const client = clientFor(sessionId);
    const before = await customerCount(client);
    await client.call("customers.create", newCustomer("Idle"), { idempotencyKey: crypto.randomUUID() });

    const ran = await runDurableObjectAlarm(stubFor(sessionId));

    expect([ran, await customerCount(client)]).toEqual([true, before]);
  });

  it("holds no storage and no alarm for a session that only reads", async () => {
    const sessionId = crypto.randomUUID();
    await customerCount(clientFor(sessionId));

    const tables = await runInDurableObject(stubFor(sessionId), (_instance, state) =>
      state.storage.sql.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'session'").toArray(),
    );

    expect([tables.length, await runDurableObjectAlarm(stubFor(sessionId))]).toEqual([0, false]);
  });

  it("moves the idle alarm forward on a second write", async () => {
    const sessionId = crypto.randomUUID();
    const client = clientFor(sessionId);
    const alarmOf = () => runInDurableObject(stubFor(sessionId), (_instance, state) => state.storage.getAlarm());
    await client.call("customers.create", newCustomer("First"), { idempotencyKey: crypto.randomUUID() });
    const first = await alarmOf();

    await new Promise((resolve) => setTimeout(resolve, 20));
    await client.call("customers.create", newCustomer("Second"), { idempotencyKey: crypto.randomUUID() });

    expect((await alarmOf()) ?? 0).toBeGreaterThan(first ?? Number.POSITIVE_INFINITY);
  });

  it("starts from the seed when the saved row is corrupt", async () => {
    const sessionId = crypto.randomUUID();
    const client = clientFor(sessionId);
    const before = await customerCount(client);
    await runInDurableObject(stubFor(sessionId), (_instance, state) => {
      state.storage.sql.exec(
        "CREATE TABLE session (id INTEGER PRIMARY KEY CHECK (id = 1), schema_version INTEGER NOT NULL, owner TEXT NOT NULL, snapshot TEXT NOT NULL)",
      );
      state.storage.sql.exec(
        "INSERT INTO session VALUES (1, ?, ?, 'not json')",
        SCHEMA_VERSION,
        `hospitality:${sessionId}`,
      );
    });
    await abortAllDurableObjects();

    expect(await customerCount(client)).toBe(before);
  });

  it("refuses a call for another session than the one the object holds", async () => {
    const sessionId = crypto.randomUUID();
    await clientFor(sessionId).call("customers.create", newCustomer("Mine"), { idempotencyKey: crypto.randomUUID() });

    const answer = await stubFor(sessionId).dispatch("customers.list", { limit: 5 }, contextFor("someone-else"));

    expect(answer).toMatchObject({ ok: false, error: { code: "access.forbidden" } });
  });

  it("does not keep a write that finishes after the idle alarm wiped the object", async () => {
    const sessionId = crypto.randomUUID();
    const client = clientFor(sessionId);
    const before = await customerCount(client);
    await client.call("customers.create", newCustomer("Before"), { idempotencyKey: crypto.randomUUID() });
    const late = heldWrite(sessionId, "Late");
    await new Promise((resolve) => setTimeout(resolve, 100));

    await runDurableObjectAlarm(stubFor(sessionId));
    const answer = await late;

    expect([answer, await sessionTables(sessionId), await customerCount(client)]).toEqual([
      expect.objectContaining({ ok: false, error: expect.objectContaining({ code: "transport.unavailable" }) }),
      0,
      before,
    ]);
  });

  it("keeps a write made after the wipe when a held write finishes later", async () => {
    const sessionId = crypto.randomUUID();
    const client = clientFor(sessionId);
    const before = await customerCount(client);
    await client.call("customers.create", newCustomer("Before"), { idempotencyKey: crypto.randomUUID() });
    const late = heldWrite(sessionId, "Late");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await runDurableObjectAlarm(stubFor(sessionId));
    await client.call("customers.create", newCustomer("After"), { idempotencyKey: crypto.randomUUID() });

    await late;
    await abortAllDurableObjects();

    expect(await customerCount(client)).toBe(before + 1);
  });

  it("answers schema.invalid_input for an input the capability does not accept", async () => {
    const sessionId = crypto.randomUUID();

    const answer = await stubFor(sessionId).dispatch("customers.create", { nonsense: true }, contextFor(sessionId));

    expect(answer).toMatchObject({ ok: false, error: { code: "schema.invalid_input" } });
  });

  it("answers schema.invalid_input for a malformed call context", async () => {
    const answer = await stubFor("any").dispatch("clock.get", {}, {
      ...contextFor("any"),
      via: "carrier-pigeon",
    } as never);

    expect(answer).toMatchObject({ ok: false, error: { code: "schema.invalid_input" } });
  });

  it("keeps at most MAX_REPLAYS idempotency records in storage", async () => {
    const sessionId = crypto.randomUUID();
    const client = clientFor(sessionId);
    await writeSequentially(client, MAX_REPLAYS + 1);

    expect(await savedRow(sessionId)).toEqual({ schemaVersion: SCHEMA_VERSION, replays: MAX_REPLAYS });
  });

  it("refuses a caller from another catalogue with the way to fix it", async () => {
    const answer = await stubFor(crypto.randomUUID()).dispatch(
      "clock.get",
      {},
      contextFor("any", { catalogVersion: "stale" }),
    );

    expect(answer).toMatchObject({
      ok: false,
      error: { code: "transport.unavailable", message: expect.stringContaining("store first") },
    });
  });

  it("refuses a capability the catalogue does not have", async () => {
    const sessionId = crypto.randomUUID();
    const answer = await stubFor(sessionId).dispatch("nope.nothing", {}, contextFor(sessionId));

    expect(answer).toMatchObject({ ok: false, error: { code: "client.unknown_capability" } });
  });
});
