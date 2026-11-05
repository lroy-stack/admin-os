import { z } from "zod";

import { CATALOG } from "@/config/catalog";
import { DEMO, type DemoSeed, heldWritesFor, MOCK_HANDLERS, settingsFor } from "@/config/demo-kernel";
import {
  catalogVersion,
  type DemoStoreRpc,
  type StoreCallContext,
  storeCallContextSchema,
} from "@/config/demo-store-rpc";
import { approvalPolicySchema, approvalStatusSchema } from "@/core/approvals";
import type { AnyCapability } from "@/core/capability";
import { fixedClock, liveClock } from "@/core/clock";
import { ErrorCodes } from "@/core/errors";
import { createMockAdapter, createSessionStore, type DemoSession } from "@/core/mock";
import { type CallResult, err } from "@/core/result";

import { boundSession } from "./bounds";
import { seedFingerprint } from "./seed-shape";
import { DurableObject } from "cloudflare:workers";

/** Bump by hand when the snapshot's own format changes (its approvals, replays or policy); the seeds need no bump. */
export const STORE_FORMAT = 7;

/**
 * The version of a saved session (ADR 0017 §8): the snapshot format and the fingerprint of the seeds it was written
 * against, compared as text. A mismatch resets the session to the seed. The `:` keeps it text in the INTEGER column,
 * so a session saved under the old numeric version resets once.
 */
export const STORE_VERSION = `${STORE_FORMAT}:${seedFingerprint(
  Object.fromEntries(Object.entries(DEMO).map(([vertical, { seed }]) => [vertical, seed])),
)}`;
/** A session is deleted this long after its last write; the demo cookie is renewed on each write for as long. */
const IDLE_MS = 2 * 60 * 60 * 1000;

const approvalRecordSchema = z.object({
  approvalId: z.string(),
  capabilityId: z.string(),
  input: z.unknown(),
  fingerprint: z.string(),
  expected: z.string(),
  requestedBy: z.object({
    actorId: z.string(),
    displayName: z.string().optional(),
    role: z.string(),
    via: z.enum(["ui", "mcp", "system"]),
    clientId: z.string().optional(),
  }),
  requestedAt: z.string(),
  expiresAt: z.string(),
  status: approvalStatusSchema,
  decidedBy: z.object({ actorId: z.string(), role: z.string() }).optional(),
  decidedAt: z.string().optional(),
  reason: z.string().optional(),
  result: z.unknown().optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional(),
});

const snapshotSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  replays: z.array(
    z.tuple([z.string(), z.object({ fingerprint: z.string(), result: z.custom<CallResult<unknown>>() })]),
  ),
  approvals: z.array(approvalRecordSchema),
  approvalPolicy: approvalPolicySchema.optional(),
});

type Store = ReturnType<typeof createSessionStore<DemoSeed>>;

/**
 * One visitor's demo session (`vertical:sessionId`). The mock kernel runs in here, so handlers mutate the session
 * in place; after every write the session is saved as one row of the SQLite backend. A keyed write is checked and
 * recorded without a real await between, so the object's input gate makes the same key apply once. An object that
 * has only been read holds no storage and no alarm.
 */
export class DemoStore extends DurableObject implements DemoStoreRpc {
  private store: Store | undefined;
  private owner: string | undefined;

  async dispatch(capabilityId: string, input: unknown, rawContext: StoreCallContext): Promise<CallResult<unknown>> {
    const parsedContext = storeCallContextSchema.safeParse(rawContext);
    if (!parsedContext.success) {
      return err(
        ErrorCodes.invalidInput,
        `The store call context is malformed: ${z.prettifyError(parsedContext.error)}`,
      );
    }
    const context = parsedContext.data;
    const expected = catalogVersion();
    if (context.catalogVersion !== expected) {
      return err(
        ErrorCodes.unavailable,
        `The caller's catalogue ${context.catalogVersion} differs from the store's ${expected}; deploy the store Worker and the Worker that calls it from the same commit, store first.`,
      );
    }
    if (!Object.hasOwn(CATALOG, capabilityId)) return err(ErrorCodes.unknownCapability, capabilityId);
    const capability = CATALOG[capabilityId] as AnyCapability;
    const parsedInput = capability.input.safeParse(input);
    if (!parsedInput.success) return err(ErrorCodes.invalidInput, z.prettifyError(parsedInput.error));

    const owner = `${context.vertical}:${context.sessionId}`;
    if (this.owner === undefined) {
      const savedOwner = this.readRow()?.owner;
      this.owner = typeof savedOwner === "string" ? savedOwner : owner;
    }
    if (this.owner !== owner) {
      return err(ErrorCodes.forbidden, `This object belongs to session ${this.owner}, not ${owner}`);
    }

    console.info(JSON.stringify({ event: "do.dispatch", capabilityId, correlationId: context.correlationId }));
    this.store ??= this.hydrate(context.vertical, context.sessionId);
    const store = this.store;

    const { clock } = DEMO[context.vertical];
    const adapter = createMockAdapter({
      handlers: MOCK_HANDLERS,
      store,
      sessionId: context.sessionId,
      clock: context.clockLive ? liveClock(clock, new Date()) : fixedClock(clock),
      settings: settingsFor(context.vertical),
      heldWrites: heldWritesFor(context.vertical),
      faults: new Map(context.faults ?? []),
    });
    const result = await adapter.dispatch(capability, parsedInput.data, {
      actor: context.actor,
      correlationId: context.correlationId,
      via: context.via,
      signal: AbortSignal.timeout(8000),
      ...(context.idempotencyKey === undefined ? {} : { idempotencyKey: context.idempotencyKey }),
    });

    if (capability.effect === "read") return result;
    if (this.store !== store) {
      return err(ErrorCodes.unavailable, "The session was reset while this write ran, so it was not kept; retry it.");
    }
    await this.persist(store.session(context.sessionId), owner);
    return result;
  }

  /** The idle alarm: the visitor's copy and every record of it go, so the next call starts from the seed. */
  async alarm(): Promise<void> {
    this.store = undefined;
    this.owner = undefined;
    await this.ctx.storage.deleteAll();
  }

  private hasTable(): boolean {
    const found = this.ctx.storage.sql.exec("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'session'");
    return found.toArray().length > 0;
  }

  /** The saved row, or undefined when there is none; a table this version cannot read is dropped. */
  private readRow(): Record<string, SqlStorageValue> | undefined {
    if (!this.hasTable()) return undefined;
    try {
      return this.ctx.storage.sql.exec("SELECT schema_version, owner, snapshot FROM session").toArray()[0];
    } catch {
      this.ctx.storage.sql.exec("DROP TABLE session");
      return undefined;
    }
  }

  /** The saved session when its schema version is current and its snapshot readable; otherwise the seed. */
  private hydrate(vertical: StoreVertical, sessionId: string): Store {
    const store = createSessionStore<DemoSeed>(DEMO[vertical].seed, { ttlMs: Number.POSITIVE_INFINITY });
    const row = this.readRow();
    if (row === undefined) return store;
    const saved =
      row.schema_version === STORE_VERSION && typeof row.snapshot === "string" ? snapshotOf(row.snapshot) : undefined;
    if (saved === undefined) {
      this.ctx.storage.sql.exec("DELETE FROM session");
      return store;
    }
    const session = store.session(sessionId);
    // The handlers hold `data` by reference, so the saved collections replace the seed copy's keys in place.
    Object.assign(session.data as object, saved.data);
    for (const [key, value] of saved.replays) session.replays.set(key, value);
    session.approvals.push(...saved.approvals);
    if (saved.approvalPolicy !== undefined) session.approvalPolicy = saved.approvalPolicy;
    return store;
  }

  private async persist(session: DemoSession<DemoSeed>, owner: string): Promise<void> {
    boundSession(session);
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS session (id INTEGER PRIMARY KEY CHECK (id = 1), schema_version INTEGER NOT NULL, owner TEXT NOT NULL, snapshot TEXT NOT NULL)",
    );
    const snapshot = JSON.stringify({
      data: session.data,
      replays: [...session.replays],
      approvals: session.approvals,
      approvalPolicy: session.approvalPolicy,
    });
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO session (id, schema_version, owner, snapshot) VALUES (1, ?, ?, ?)",
      STORE_VERSION,
      owner,
      snapshot,
    );
    await this.ctx.storage.setAlarm(Date.now() + IDLE_MS);
  }
}

type StoreVertical = keyof typeof DEMO;

/** The snapshot a row holds, or undefined when it is not JSON or not the shape this store writes. */
function snapshotOf(text: string): z.infer<typeof snapshotSchema> | undefined {
  try {
    const parsed = snapshotSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}
