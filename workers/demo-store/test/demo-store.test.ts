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

  it("schedules no alarm for a session that only reads", async () => {
    const sessionId = crypto.randomUUID();
    await customerCount(clientFor(sessionId));

    expect(await runDurableObjectAlarm(stubFor(sessionId))).toBe(false);
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
