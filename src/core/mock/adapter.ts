import type { z } from "zod";

import {
  APPROVAL_TTL_MS,
  type ApprovalPolicy,
  type ApprovalRecord,
  effectiveStatus,
  holdsForApproval,
  policyOf,
  withSessionPolicy,
} from "@/core/approvals";
import type { AnyCapability, Capability, Catalog } from "@/core/capability";
import type { Actor, Adapter, CallContext } from "@/core/client";
import type { BusinessClock } from "@/core/clock";
import { ErrorCodes } from "@/core/errors";
import { paginate } from "@/core/pagination";
import { type CallResult, err, ok, type Result } from "@/core/result";
import { createSettingsReader, type SettingsReader } from "@/core/settings";

import { evictSettled, MAX_APPROVALS } from "./approval-queue";
import { changesBetween } from "./changes";
import type { FaultMap } from "./faults";
import type { DemoSession, SessionStore } from "./session-store";

/** What deciding a held write needs from the kernel; only the approvals capabilities call it. */
export interface ApprovalKernel {
  approve(approvalId: string): Promise<Result<unknown>>;
  reject(approvalId: string, reason: string | undefined): Promise<Result<unknown>>;
  setPolicy(policy: ApprovalPolicy): Result<unknown>;
}

/** A read holds no session to decide in. */
const NO_KERNEL: ApprovalKernel = {
  approve: () => Promise.resolve(err(ErrorCodes.unavailable, "Deciding a held write needs a demo session")),
  reject: () => Promise.resolve(err(ErrorCodes.unavailable, "Deciding a held write needs a demo session")),
  setPolicy: () => err(ErrorCodes.unavailable, "Changing the approval policy needs a demo session"),
};

/**
 * What approving a held write needs to know about the catalogue: the capability behind a record, and what a role
 * holds today (the write runs as the requester, ADR 0016, resolution 4).
 */
export interface HeldWrites {
  readonly catalog: Catalog;
  permissionsOfRole(roleId: string): readonly string[];
}

export interface MockContext<Data> {
  readonly actor: Actor;
  readonly clock: BusinessClock;
  /** The business settings in effect for the session's preset (defaults plus the preset's overrides). */
  readonly settings: SettingsReader;
  /** The writes held for a person in the visitor's session, for reads about them (`approvals.get`). */
  readonly approvals: readonly ApprovalRecord[];
  /** Real time in ms when the call started; approvals expire on it, not on the fixed demo clock. */
  readonly nowMs: number;
  /** Decides held writes; unavailable on a read. */
  readonly kernel: ApprovalKernel;
  /** A read sees the seed or the session copy; a write gets the session copy and may change it. */
  readonly data: Data;
}

export type MockHandler<Data> = (
  input: unknown,
  context: MockContext<Data>,
) => Result<unknown> | Promise<Result<unknown>>;

/**
 * Registers a handler for one capability with its input typed from the capability. The client has already parsed
 * the input against `capability.input` before dispatch, so the handler receives the schema's output type.
 */
export const mockHandler = <Id extends string, I extends z.ZodType, O extends z.ZodType, Data>(
  capability: Capability<Id, I, O>,
  run: (input: z.output<I>, context: MockContext<Data>) => Result<z.input<O>> | Promise<Result<z.input<O>>>,
): Record<Id, MockHandler<Data>> =>
  ({ [capability.id]: (input: unknown, context: MockContext<Data>) => run(input as z.output<I>, context) }) as Record<
    Id,
    MockHandler<Data>
  >;

export interface MockAdapterOptions<Data> {
  readonly handlers: Readonly<Record<string, MockHandler<Data>>>;
  readonly store: SessionStore<Data>;
  /** The visitor's demo session; writes need one (the runtime creates it in a Server Action). */
  readonly sessionId?: string;
  readonly clock: BusinessClock;
  /** The effective business settings; absent means an empty registry. */
  readonly settings?: SettingsReader;
  readonly faults?: FaultMap;
  /** Needed to approve a held write; without it `approvals.approve` answers unavailable. */
  readonly heldWrites?: HeldWrites;
  /** Real time in ms, injectable for tests. */
  readonly now?: () => number;
}

/** Key-order independent JSON of a parsed input, so equal inputs share a fingerprint. */
const fingerprintOf = (value: unknown): string => {
  const sorted = JSON.stringify(value, (_key, nested: unknown) =>
    typeof nested === "object" && nested !== null && !Array.isArray(nested)
      ? Object.fromEntries(Object.entries(nested).sort(([a], [b]) => a.localeCompare(b)))
      : nested,
  );
  // biome-ignore lint/suspicious/noUnnecessaryConditions: JSON.stringify returns undefined for undefined input; its lib type says string.
  return sorted ?? "";
};

/** Keyed writes still running, per session, so a duplicate sent in parallel can wait for the first answer. */
const inFlightBySession = new WeakMap<
  object,
  Map<string, { fingerprint: string; result: Promise<CallResult<unknown>> }>
>();

const inFlightOf = (session: object) => {
  const existing = inFlightBySession.get(session);
  if (existing) return existing;
  const created = new Map<string, { fingerprint: string; result: Promise<CallResult<unknown>> }>();
  inFlightBySession.set(session, created);
  return created;
};

const delay = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });

const iso = (ms: number): string => new Date(ms).toISOString();

/** When a record was decided; one that expired unread has no decision, so its deadline stands for it. */
const decidedAtOf = (record: ApprovalRecord, nowMs: number): string | undefined =>
  record.decidedAt ?? (effectiveStatus(record, nowMs) === "expired" ? record.expiresAt : undefined);

/**
 * What approving must find unchanged: that the write can run, and the changes it makes to the state (before against
 * after, so an unrelated edit elsewhere does not matter but a cancel that already happened does). An `add` mints a
 * new id on every run, so for it only whether it can run is compared.
 */
const expectationOf = (capability: AnyCapability, result: Result<unknown>, changes: readonly string[]): string => {
  if (!result.ok) return `error:${result.error.code}`;
  return capability.change === "add" ? "ok" : `ok\n${changes.join("\n")}`;
};

/** Writes being approved right now, per session, so a second approval of the same record cannot start meanwhile. */
const decidingBySession = new WeakMap<object, Set<string>>();

const decidingOf = (session: object): Set<string> => {
  const existing = decidingBySession.get(session);
  if (existing) return existing;
  const created = new Set<string>();
  decidingBySession.set(session, created);
  return created;
};

/**
 * The mock kernel (ADR 0005): resolve the handler, check the permission, apply forced faults, hold the write when
 * the approval policy says so (ADR 0016, D7), replay keyed writes, then run the handler on the right data.
 */
export function createMockAdapter<Data>(options: MockAdapterOptions<Data>): Adapter {
  const {
    handlers,
    store,
    sessionId,
    clock,
    faults = new Map(),
    settings = createSettingsReader({}),
    heldWrites,
    now = Date.now,
  } = options;

  const contextFor = (
    actor: Actor,
    data: Data,
    approvals: readonly ApprovalRecord[],
    effective: SettingsReader,
    nowMs: number,
    kernel: ApprovalKernel,
  ): MockContext<Data> => ({ actor, clock, settings: effective, approvals, nowMs, kernel, data });

  /** Runs the write on a copy of the session as `actor`: its answer, and what approving must find unchanged. */
  const rehearse = async (
    session: DemoSession<Data>,
    capability: AnyCapability,
    handler: MockHandler<Data>,
    asked: { input: unknown; actor: Actor },
    effective: SettingsReader,
    nowMs: number,
  ) => {
    const before = structuredClone(session.data);
    const after = structuredClone(session.data);
    const result = await Promise.resolve(
      handler(asked.input, contextFor(asked.actor, after, session.approvals, effective, nowMs, NO_KERNEL)),
    );
    return { result, expectation: expectationOf(capability, result, changesBetween(before, after)) };
  };

  /** Decides the session's held writes as `decider`; a write that is approved runs as the person who asked. */
  const kernelOf = (
    session: DemoSession<Data>,
    decider: Actor,
    effective: SettingsReader,
    nowMs: number,
  ): ApprovalKernel => {
    const deciding = decidingOf(session);
    const settle = (record: ApprovalRecord, status: ApprovalRecord["status"], details: Partial<ApprovalRecord>) => {
      // A record that left `pending` is final: a late decision never rewrites the audit.
      if (record.status !== "pending") return;
      Object.assign(record, details, {
        status,
        decidedBy: { actorId: decider.actorId, role: decider.roleId },
        decidedAt: iso(nowMs),
      });
    };

    /** The record to decide: it must exist, be pending and still be inside its 24 hours. */
    const openRecord = (approvalId: string): Result<ApprovalRecord> => {
      const record = session.approvals.find((candidate) => candidate.approvalId === approvalId);
      if (record === undefined) return err("approvals.not_found", `No approval with id ${approvalId}`, { approvalId });
      if (effectiveStatus(record, nowMs) === "expired") {
        record.status = "expired";
        record.decidedAt ??= record.expiresAt;
        return err("approvals.expired", `Approval ${approvalId} expired at ${record.expiresAt}`, { approvalId });
      }
      if (deciding.has(approvalId)) {
        return err("approvals.not_pending", `Approval ${approvalId} is being decided`, {
          approvalId,
          status: "deciding",
        });
      }
      return record.status === "pending"
        ? ok(record)
        : err("approvals.not_pending", `Approval ${approvalId} is already ${record.status}`, {
            approvalId,
            status: record.status,
          });
    };

    return {
      approve: async (approvalId) => {
        const opened = openRecord(approvalId);
        if (!opened.ok) return opened;
        const record = opened.value;
        if (heldWrites === undefined) {
          return err(ErrorCodes.unavailable, "This kernel was built without the catalogue it needs to approve writes");
        }
        const conflict = (code: string, message: string) => {
          settle(record, "conflict", { error: { code, message } });
          return err(code, message, { approvalId });
        };

        const held = Object.hasOwn(heldWrites.catalog, record.capabilityId)
          ? heldWrites.catalog[record.capabilityId]
          : undefined;
        const handler = handlers[record.capabilityId];
        if (held === undefined || handler === undefined) {
          return conflict("approvals.conflict", `${record.capabilityId} is no longer available`);
        }
        // The decider needs the right to do the write themselves, besides the right to decide.
        if (!decider.permissions.includes(held.permission)) {
          return err(ErrorCodes.forbidden, `${decider.roleId} lacks ${held.permission}`);
        }
        const requester: Actor = {
          actorId: record.requestedBy.actorId,
          ...(record.requestedBy.displayName === undefined ? {} : { displayName: record.requestedBy.displayName }),
          roleId: record.requestedBy.role,
          permissions: heldWrites.permissionsOfRole(record.requestedBy.role),
        };
        if (!requester.permissions.includes(held.permission)) {
          return conflict("approvals.requester_forbidden", `${requester.roleId} no longer holds ${held.permission}`);
        }

        // Claimed before the first await: a second approval of this record now answers not_pending.
        deciding.add(approvalId);
        try {
          // The write must still do now what it would have done when it was asked; a copy answers that first.
          const dry = await rehearse(
            session,
            held,
            handler,
            { input: record.input, actor: requester },
            effective,
            nowMs,
          );
          if (dry.expectation !== record.expected) {
            return conflict(
              "approvals.conflict",
              `${record.capabilityId} would not do what was asked: the state moved`,
            );
          }
          const applied = await Promise.resolve(
            handler(record.input, contextFor(requester, session.data, session.approvals, effective, nowMs, NO_KERNEL)),
          );
          if (!applied.ok) return conflict("approvals.conflict", applied.error.message);
          settle(record, "approved", { result: applied.value });
          return ok({ approvalId, status: "approved", result: applied.value });
        } finally {
          deciding.delete(approvalId);
        }
      },

      reject: (approvalId, reason) => {
        const opened = openRecord(approvalId);
        if (!opened.ok) return Promise.resolve(opened);
        settle(opened.value, "rejected", reason === undefined ? {} : { reason });
        return Promise.resolve(ok({ approvalId, status: "rejected" }));
      },

      setPolicy: (policy) => {
        session.approvalPolicy = policy;
        return ok({ policy });
      },
    };
  };

  /** Queues the write for a person, or answers the approval already queued for the same actor and input. */
  const hold = async (
    session: DemoSession<Data>,
    capability: AnyCapability,
    handler: MockHandler<Data>,
    asked: { input: unknown; fingerprint: string; actor: Actor; via: CallContext["via"] },
    effective: SettingsReader,
    nowMs: number,
  ): Promise<CallResult<unknown>> => {
    const queued = () =>
      session.approvals.find(
        (record) =>
          record.capabilityId === capability.id &&
          record.requestedBy.actorId === asked.actor.actorId &&
          record.fingerprint === asked.fingerprint &&
          effectiveStatus(record, nowMs) === "pending",
      );
    const waiting = (record: ApprovalRecord): CallResult<never> => ({
      status: "awaiting_approval",
      approvalId: record.approvalId,
    });
    const retried = queued();
    if (retried) return waiting(retried);

    const makeRoom = (): Result<never> | undefined => {
      evictSettled(session.approvals, nowMs, MAX_APPROVALS - 1);
      return session.approvals.length < MAX_APPROVALS
        ? undefined
        : err(
            "approvals.queue_full",
            `${MAX_APPROVALS} writes are already waiting for a person; decide some of them, then ask again`,
            { limit: MAX_APPROVALS },
          );
    };
    const full = makeRoom();
    if (full) return full;

    // A write that cannot run now is refused now: nobody is asked to approve it. The copy keeps the session intact.
    const rehearsal = await rehearse(session, capability, handler, asked, effective, nowMs);
    if (!rehearsal.result.ok) return rehearsal.result;
    // Another hold of the same write, or one that took the last place, may have landed while this one rehearsed.
    const parallel = queued();
    if (parallel) return waiting(parallel);
    const filledMeanwhile = makeRoom();
    if (filledMeanwhile) return filledMeanwhile;
    const record: ApprovalRecord = {
      approvalId: crypto.randomUUID(),
      capabilityId: capability.id,
      input: asked.input,
      fingerprint: asked.fingerprint,
      expected: rehearsal.expectation,
      requestedBy: {
        actorId: asked.actor.actorId,
        ...(asked.actor.displayName === undefined ? {} : { displayName: asked.actor.displayName }),
        role: asked.actor.roleId,
        via: asked.via,
        ...(asked.actor.clientId === undefined ? {} : { clientId: asked.actor.clientId }),
      },
      requestedAt: iso(nowMs),
      expiresAt: iso(nowMs + APPROVAL_TTL_MS),
      status: "pending",
    };
    session.approvals.push(record);
    return waiting(record);
  };

  return {
    async dispatch(capability: AnyCapability, input: unknown, context: CallContext): Promise<CallResult<unknown>> {
      const handler = handlers[capability.id];
      if (handler === undefined) return err(ErrorCodes.unavailable, `No mock handler for ${capability.id}`);
      if (!context.actor.permissions.includes(capability.permission)) {
        return err(ErrorCodes.forbidden, `${context.actor.roleId} lacks ${capability.permission}`);
      }

      const fault = faults.get(capability.id);
      if (fault?.latencyMs) await delay(fault.latencyMs, context.signal);
      if (fault?.code) return err(fault.code, `${capability.id} forced to ${fault.code} by MOCK_FAULTS`);

      const nowMs = now();
      if (capability.effect === "read") {
        return handler(
          input,
          contextFor(
            context.actor,
            store.read(sessionId),
            store.approvals(sessionId),
            withSessionPolicy(settings, store.approvalPolicy(sessionId)),
            nowMs,
            NO_KERNEL,
          ),
        );
      }

      if (sessionId === undefined) {
        return err(ErrorCodes.unavailable, `${capability.id} needs a demo session; start one before writing`);
      }
      const session = store.session(sessionId);
      const replayKey = context.idempotencyKey === undefined ? undefined : `${capability.id}:${context.idempotencyKey}`;
      const fingerprint = fingerprintOf(input);
      const replayed = replayKey === undefined ? undefined : session.replays.get(replayKey);
      if (replayed) {
        return replayed.fingerprint === fingerprint
          ? replayed.result
          : err(
              ErrorCodes.idempotencyConflict,
              `${capability.id} received idempotency key "${context.idempotencyKey}" with a different input`,
            );
      }

      const run = async (): Promise<CallResult<unknown>> => {
        const effective = withSessionPolicy(settings, session.approvalPolicy);
        if (holdsForApproval(policyOf(effective), capability, context.via)) {
          const asked = { input, fingerprint, actor: context.actor, via: context.via };
          return hold(session, capability, handler, asked, effective, nowMs);
        }
        return await handler(
          input,
          contextFor(
            context.actor,
            session.data,
            session.approvals,
            effective,
            nowMs,
            kernelOf(session, context.actor, effective, nowMs),
          ),
        );
      };
      if (replayKey === undefined) return run();

      // A duplicate that arrives while the first call still runs waits for it instead of applying the write again.
      const running = inFlightOf(session);
      const first = running.get(replayKey);
      if (first) {
        return first.fingerprint === fingerprint
          ? first.result
          : err(
              ErrorCodes.idempotencyConflict,
              `${capability.id} received idempotency key "${context.idempotencyKey}" with a different input`,
            );
      }
      const result = run()
        .then((answer) => {
          session.replays.set(replayKey, { fingerprint, result: answer });
          return answer;
        })
        .finally(() => running.delete(replayKey));
      running.set(replayKey, { fingerprint, result });
      return result;
    },
  };
}

/** Handlers for the kernel capabilities every adapter must answer (`clock.get`, `access.me.get`, approvals). */
export const kernelMockHandlers: Readonly<Record<string, MockHandler<unknown>>> = {
  "clock.get": (_input, { clock }) => ok(clock),
  "settings.values.get": (input, { settings }) => {
    const result = settings.values((input as { keys?: readonly string[] }).keys);
    return result.ok ? ok({ values: result.value }) : result;
  },
  "approvals.get": (input, { actor, approvals, nowMs }) => {
    const { approvalId } = input as { approvalId: string };
    const held = approvals.find((candidate) => candidate.approvalId === approvalId);
    if (held === undefined) return err("approvals.not_found", `No approval with id ${approvalId}`, { approvalId });
    const decidedAt = decidedAtOf(held, nowMs);
    return ok({
      approvalId: held.approvalId,
      capabilityId: held.capabilityId,
      status: effectiveStatus(held, nowMs),
      requestedByYou: held.requestedBy.actorId === actor.actorId,
      ...(decidedAt === undefined ? {} : { decidedAt }),
      ...(held.reason === undefined ? {} : { reason: held.reason }),
      ...(held.result === undefined ? {} : { result: held.result }),
      ...(held.error === undefined ? {} : { error: held.error }),
    });
  },
  "approvals.list": (input, { approvals, nowMs }) => {
    // Pending first, then newest first.
    const ordered = approvals
      .map((record) => ({
        ...record,
        status: effectiveStatus(record, nowMs),
        ...(decidedAtOf(record, nowMs) === undefined ? {} : { decidedAt: decidedAtOf(record, nowMs) }),
      }))
      .sort(
        (a, b) =>
          Number(b.status === "pending") - Number(a.status === "pending") || b.requestedAt.localeCompare(a.requestedAt),
      )
      .map(({ fingerprint: _fingerprint, expected: _expected, ...entry }) => entry);
    return paginate(ordered, input as { cursor?: string; limit: number });
  },
  "approvals.approve": (input, { kernel }) => kernel.approve((input as { approvalId: string }).approvalId),
  "approvals.reject": (input, { kernel }) => {
    const { approvalId, reason } = input as { approvalId: string; reason?: string };
    return kernel.reject(approvalId, reason);
  },
  "approvals.policy.set": (input, { kernel }) => kernel.setPolicy((input as { policy: ApprovalPolicy }).policy),
  "access.me.get": (_input, { actor }) =>
    ok({
      actorId: actor.actorId,
      displayName: actor.displayName ?? actor.actorId,
      roleId: actor.roleId,
      permissions: [...actor.permissions],
    }),
};
