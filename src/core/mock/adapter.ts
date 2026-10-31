import type { z } from "zod";

import type { AnyCapability, Capability } from "@/core/capability";
import type { Actor, Adapter, CallContext } from "@/core/client";
import type { BusinessClock } from "@/core/clock";
import { ErrorCodes } from "@/core/errors";
import { type CallResult, err, ok, type Result } from "@/core/result";

import type { FaultMap } from "./faults";
import type { SessionStore } from "./session-store";

export interface MockContext<Data> {
  readonly actor: Actor;
  readonly clock: BusinessClock;
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
  readonly faults?: FaultMap;
}

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

/**
 * The mock kernel (ADR 0005): resolve the handler, check the permission, apply forced faults, apply the approval
 * rule, replay keyed writes, then run the handler on the right data.
 */
export function createMockAdapter<Data>(options: MockAdapterOptions<Data>): Adapter {
  const { handlers, store, sessionId, clock, faults = new Map() } = options;

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

      if (capability.effect === "read") {
        return handler(input, { actor: context.actor, clock, data: store.read(sessionId) });
      }

      if (sessionId === undefined) {
        return err(ErrorCodes.unavailable, `${capability.id} needs a demo session; start one before writing`);
      }
      const session = store.session(sessionId);
      const replayKey = context.idempotencyKey === undefined ? undefined : `${capability.id}:${context.idempotencyKey}`;
      const replayed = replayKey === undefined ? undefined : session.replays.get(replayKey);
      if (replayed) return replayed;

      const result: CallResult<unknown> = capability.approval?.(input)
        ? approve(session.approvals, capability.id, context.actor.actorId, input)
        : await handler(input, { actor: context.actor, clock, data: session.data });
      if (replayKey !== undefined) session.replays.set(replayKey, result);
      return result;
    },
  };
}

function approve(
  approvals: { approvalId: string; capabilityId: string; actorId: string; input: unknown }[],
  capabilityId: string,
  actorId: string,
  input: unknown,
): CallResult<never> {
  const approvalId = crypto.randomUUID();
  approvals.push({ approvalId, capabilityId, actorId, input });
  return { status: "awaiting_approval", approvalId };
}

/** Handlers for the kernel capabilities every adapter must answer (`clock.get`, `access.me.get`). */
export const kernelMockHandlers: Readonly<Record<string, MockHandler<unknown>>> = {
  "clock.get": (_input, { clock }) => ok(clock),
  "access.me.get": (_input, { actor }) =>
    ok({
      actorId: actor.actorId,
      displayName: actor.displayName ?? actor.actorId,
      roleId: actor.roleId,
      permissions: [...actor.permissions],
    }),
};
