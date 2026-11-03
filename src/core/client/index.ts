import type { z } from "zod";

import type { AnyCapability, ApprovalContext, Catalog } from "@/core/capability";
import { ErrorCodes } from "@/core/errors";
import { type CallResult, err, isAwaitingApproval, type Result } from "@/core/result";

/** Opaque here: ADR 0006 owns how an actor is resolved. The client only forwards it and logs the role. */
export interface Actor {
  readonly actorId: string;
  /** Shown in the shell; `access.me.get` returns it. */
  readonly displayName?: string;
  readonly roleId: string;
  readonly permissions: readonly string[];
}

export interface CallContext {
  readonly actor: Actor;
  readonly correlationId: string;
  readonly idempotencyKey?: string;
  readonly signal: AbortSignal;
  /** The surface the call came from; the approval rule may depend on it. */
  readonly via: ApprovalContext["via"];
}

export interface Adapter {
  dispatch(capability: AnyCapability, input: unknown, context: CallContext): Promise<CallResult<unknown>>;
}

export interface CallOptions {
  readonly idempotencyKey?: string;
  readonly signal?: AbortSignal;
}

export type CallReturn<C extends AnyCapability> = C["effect"] extends "read"
  ? Result<z.output<C["output"]>>
  : CallResult<z.output<C["output"]>>;

export interface DataClient<C extends Catalog> {
  call<Id extends keyof C & string>(
    id: Id,
    input: z.input<C[Id]["input"]>,
    options?: CallOptions,
  ): Promise<CallReturn<C[Id]>>;
}

export interface CallLogLine {
  readonly capability: string;
  readonly effect: AnyCapability["effect"] | "unknown";
  readonly status: "ok" | "error" | "awaiting_approval";
  readonly code?: string;
  readonly durationMs: number;
  readonly correlationId: string;
  readonly actorRole: string;
  readonly riskTier: AnyCapability["riskTier"] | "unknown";
  readonly via: ApprovalContext["via"];
}

export interface ClientOptions {
  readonly actor?: Actor;
  readonly correlationId?: string;
  /** The surface making the calls; the MCP projection passes `"mcp"`. Defaults to `"ui"`. */
  readonly via?: ApprovalContext["via"];
  readonly timeoutMs?: number;
  /** Development throws on contract drift so the overlay names the capability; production returns the code. */
  readonly mode?: "development" | "production";
  /** Base backoff before the single retry; jittered. Tests inject 0. */
  readonly retryDelayMs?: number;
  readonly logger?: (line: CallLogLine) => void;
}

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRY_DELAY_MS = 300;
const ANONYMOUS: Actor = { actorId: "anonymous", roleId: "anonymous", permissions: [] };

class Aborted extends Error {}

/** Adapters may ignore the signal, so the client races it to guarantee the timeout. */
const raceAbort = <T>(promise: Promise<T>, signal: AbortSignal): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    if (signal.aborted) return reject(new Aborted());
    const onAbort = () => reject(new Aborted());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });

const sleep = (ms: number) => (ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve());

const isTransportFailure = (result: CallResult<unknown>) =>
  !isAwaitingApproval(result) && !result.ok && result.error.code.startsWith("transport.");

const issuePaths = (error: z.ZodError) => error.issues.map((issue) => issue.path.join("."));

export const createClient = <C extends Catalog>(
  catalog: C,
  adapter: Adapter,
  options: ClientOptions = {},
): DataClient<C> => {
  const {
    actor = ANONYMOUS,
    correlationId = crypto.randomUUID(),
    via = "ui",
    timeoutMs = DEFAULT_TIMEOUT_MS,
    mode = process.env.NODE_ENV === "development" ? "development" : "production",
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    logger = (line) => console.info(JSON.stringify(line)),
  } = options;

  const attempt = async (
    capability: AnyCapability,
    input: unknown,
    callOptions: CallOptions,
  ): Promise<CallResult<unknown>> => {
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = callOptions.signal ? AbortSignal.any([callOptions.signal, timeout]) : timeout;
    const context: CallContext = {
      actor,
      correlationId,
      signal,
      via,
      ...(callOptions.idempotencyKey === undefined ? {} : { idempotencyKey: callOptions.idempotencyKey }),
    };
    try {
      return await raceAbort(adapter.dispatch(capability, input, context), signal);
    } catch (error) {
      if (error instanceof Aborted) return err(ErrorCodes.timeout, `${capability.id} timed out or was aborted`);
      return err(ErrorCodes.unavailable, `${capability.id} adapter failed`);
    }
  };

  const run = async (capability: AnyCapability, input: unknown, callOptions: CallOptions) => {
    // A write may have reached the server before the failure; only an idempotency key makes a replay safe.
    const retryable = capability.effect === "read" || callOptions.idempotencyKey !== undefined;
    let result = await attempt(capability, input, callOptions);
    if (retryable && isTransportFailure(result) && !callOptions.signal?.aborted) {
      await sleep(retryDelayMs * (0.5 + Math.random()));
      result = await attempt(capability, input, callOptions);
    }
    return result;
  };

  const validateOutput = (capability: AnyCapability, result: CallResult<unknown>): CallResult<unknown> => {
    if (isAwaitingApproval(result) || !result.ok) return result;
    const parsed = capability.output.safeParse(result.value);
    if (parsed.success) return { ok: true, value: parsed.data };
    if (mode === "development") {
      throw new Error(`Capability "${capability.id}" returned invalid output: ${issuePaths(parsed.error).join(", ")}`);
    }
    return err(ErrorCodes.invalidOutput, `${capability.id} returned invalid output`, {
      paths: issuePaths(parsed.error),
    });
  };

  const execute = async (id: string, input: unknown, callOptions: CallOptions): Promise<CallResult<unknown>> => {
    if (!Object.hasOwn(catalog, id)) return err(ErrorCodes.unknownCapability, `Unknown capability "${id}"`);
    const capability = catalog[id] as AnyCapability;
    const parsedInput = capability.input.safeParse(input);
    if (!parsedInput.success) {
      return err(ErrorCodes.invalidInput, `${id} rejected its input`, { paths: issuePaths(parsedInput.error) });
    }
    if (capability.requiresIdempotencyKey && callOptions.idempotencyKey === undefined) {
      return err(ErrorCodes.idempotencyRequired, `${id} needs an idempotency key`);
    }
    return validateOutput(capability, await run(capability, parsedInput.data, callOptions));
  };

  return {
    async call(id, input, callOptions = {}) {
      const started = performance.now();
      const known = Object.hasOwn(catalog, id) ? (catalog[id] as AnyCapability) : undefined;
      const effect = known?.effect ?? "unknown";
      const riskTier = known?.riskTier ?? "unknown";
      let result: CallResult<unknown> | undefined;
      try {
        result = await execute(id, input, callOptions);
        return result as never;
      } finally {
        // Only the capability, outcome and timings are logged: inputs may hold personal data.
        const base = {
          capability: id,
          effect,
          riskTier,
          via,
          durationMs: Math.round(performance.now() - started),
          correlationId,
          actorRole: actor.roleId,
        } as const;
        if (result === undefined) logger({ ...base, status: "error", code: "client.threw" });
        else if (isAwaitingApproval(result)) logger({ ...base, status: "awaiting_approval" });
        else if (result.ok) logger({ ...base, status: "ok" });
        else logger({ ...base, status: "error", code: result.error.code });
      }
    },
  };
};
