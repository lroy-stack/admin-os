import { z } from "zod";

import { CATALOG } from "@/config/catalog";
import { DEMO, type DemoSeed, MOCK_HANDLERS, settingsFor } from "@/config/demo-kernel";
import { catalogVersion, type DemoStoreRpc, type StoreCallContext } from "@/config/demo-store-rpc";
import type { AnyCapability } from "@/core/capability";
import { fixedClock, liveClock } from "@/core/clock";
import { ErrorCodes } from "@/core/errors";
import { createMockAdapter, createSessionStore, type DemoSession } from "@/core/mock";
import { type CallResult, err } from "@/core/result";

import { boundSession } from "./bounds";
import { DurableObject } from "cloudflare:workers";

/** Bump when the shape of the persisted session changes: a mismatch resets the object to the seed. */
export const SCHEMA_VERSION = 1;
/** A session is deleted this long after its last write; the demo cookie lives as long (ADR 0005). */
const IDLE_MS = 2 * 60 * 60 * 1000;

const snapshotSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  replays: z.array(
    z.tuple([z.string(), z.object({ fingerprint: z.string(), result: z.custom<CallResult<unknown>>() })]),
  ),
  approvals: z.array(
    z.object({ approvalId: z.string(), capabilityId: z.string(), actorId: z.string(), input: z.unknown() }),
  ),
});

type Store = ReturnType<typeof createSessionStore<DemoSeed>>;

/**
 * One visitor's demo session (`vertical:sessionId`). The mock kernel runs in here, so handlers mutate the session
 * in place; after every write the session is saved as one row of the SQLite backend. A keyed write is checked and
 * recorded without a real await between, so the object's input gate makes the same key apply once.
 */
export class DemoStore extends DurableObject implements DemoStoreRpc {
  private store: Store | undefined;
  private readonly version = catalogVersion();

  async dispatch(capabilityId: string, input: unknown, context: StoreCallContext): Promise<CallResult<unknown>> {
    if (context.catalogVersion !== this.version) {
      return err(
        ErrorCodes.unavailable,
        `The caller's catalogue ${context.catalogVersion} differs from the store's ${this.version}; deploy the store Worker and the Worker that calls it from the same commit, store first.`,
      );
    }
    if (!Object.hasOwn(CATALOG, capabilityId)) return err(ErrorCodes.unknownCapability, capabilityId);
    const capability = CATALOG[capabilityId] as AnyCapability;

    console.info(JSON.stringify({ event: "do.dispatch", capabilityId, correlationId: context.correlationId }));
    this.store ??= this.hydrate(context);
    const store = this.store;

    const { clock } = DEMO[context.vertical];
    const adapter = createMockAdapter({
      handlers: MOCK_HANDLERS,
      store,
      sessionId: context.sessionId,
      clock: context.clockLive ? liveClock(clock, new Date()) : fixedClock(clock),
      settings: settingsFor(context.vertical),
      faults: new Map(context.faults ?? []),
    });
    const result = await adapter.dispatch(capability, input, {
      actor: context.actor,
      correlationId: context.correlationId,
      via: context.via,
      signal: AbortSignal.timeout(8000),
      ...(context.idempotencyKey === undefined ? {} : { idempotencyKey: context.idempotencyKey }),
    });

    if (capability.effect !== "read") await this.persist(store.session(context.sessionId));
    return result;
  }

  /** The idle alarm: the visitor's copy and every record of it go, so the next call starts from the seed. */
  async alarm(): Promise<void> {
    this.store = undefined;
    await this.ctx.storage.deleteAll();
  }

  private ensureSchema(): void {
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS session (id INTEGER PRIMARY KEY CHECK (id = 1), schema_version INTEGER NOT NULL, snapshot TEXT NOT NULL)",
    );
  }

  /** The saved session when its schema version is current and its snapshot readable; otherwise the seed. */
  private hydrate(context: StoreCallContext): Store {
    const store = createSessionStore<DemoSeed>(DEMO[context.vertical].seed, { ttlMs: Number.POSITIVE_INFINITY });
    this.ensureSchema();
    const row = this.ctx.storage.sql.exec("SELECT schema_version, snapshot FROM session").toArray()[0];
    if (row === undefined) return store;
    const saved =
      row.schema_version === SCHEMA_VERSION && typeof row.snapshot === "string"
        ? snapshotSchema.safeParse(JSON.parse(row.snapshot))
        : undefined;
    if (saved?.success !== true) {
      this.ctx.storage.sql.exec("DELETE FROM session");
      return store;
    }
    const session = store.session(context.sessionId);
    // The handlers hold `data` by reference, so the saved collections replace the seed copy's keys in place.
    Object.assign(session.data as object, saved.data.data);
    for (const [key, value] of saved.data.replays) session.replays.set(key, value);
    session.approvals.push(...saved.data.approvals);
    return store;
  }

  private async persist(session: DemoSession<DemoSeed>): Promise<void> {
    boundSession(session);
    this.ensureSchema();
    const snapshot = JSON.stringify({
      data: session.data,
      replays: [...session.replays],
      approvals: session.approvals,
    });
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO session (id, schema_version, snapshot) VALUES (1, ?, ?)",
      SCHEMA_VERSION,
      snapshot,
    );
    await this.ctx.storage.setAlarm(Date.now() + IDLE_MS);
  }
}
