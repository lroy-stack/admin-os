import "server-only";

import type { AnyCapability } from "@/core/capability";
import type { Adapter } from "@/core/client";
import { ErrorCodes } from "@/core/errors";
import type { FaultMap } from "@/core/mock";
import { err } from "@/core/result";

import { catalogVersion, type DemoStoreRpc } from "./demo-store-rpc";
import type { VerticalId } from "./vertical";

export interface StoreNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): DemoStoreRpc;
}

/** Reads that do not depend on the visitor's session: answered in process, so they cost no Durable Object request. */
const SESSION_FREE_READS: ReadonlySet<string> = new Set(["clock.get", "settings.values.get"]);

/**
 * Finds the `DEMO_STORE` binding for a call: a Worker hands its own `env.DEMO_STORE`, the web app looks it up in the
 * OpenNext context (`web-store.server.ts`). Kept a function so this module never imports the platform it runs on.
 */
export type StoreLookup = () => StoreNamespace | undefined | Promise<StoreNamespace | undefined>;

/** One object per `vertical:sessionId`; every call is an RPC to it, the kernel runs inside (ADR 0005). */
export function durableAdapter(options: {
  readonly vertical: VerticalId;
  readonly sessionId: string;
  readonly faults?: FaultMap;
  /** Whether the caller's clock is live (`MOCK_CLOCK=live`); the store follows it. */
  readonly clockLive?: boolean;
  /** Answers the session-free reads; the same kernel over the seed, run in this process. */
  readonly inProcess: Adapter;
  /** The binding itself, or a lookup that finds it per call. */
  readonly namespace: StoreNamespace | StoreLookup;
}): Adapter {
  return {
    async dispatch(capability: AnyCapability, input, context) {
      if (SESSION_FREE_READS.has(capability.id)) return options.inProcess.dispatch(capability, input, context);
      const namespace = typeof options.namespace === "function" ? await options.namespace() : options.namespace;
      if (namespace === undefined) return err(ErrorCodes.unavailable, "DEMO_STORE binding is missing");
      const stub = namespace.get(namespace.idFromName(`${options.vertical}:${options.sessionId}`));
      try {
        return await stub.dispatch(capability.id, input, {
          vertical: options.vertical,
          sessionId: options.sessionId,
          actor: context.actor,
          correlationId: context.correlationId,
          via: context.via,
          clockLive: options.clockLive ?? false,
          catalogVersion: catalogVersion(),
          ...(context.idempotencyKey === undefined ? {} : { idempotencyKey: context.idempotencyKey }),
          ...(options.faults === undefined ? {} : { faults: [...options.faults] }),
        });
      } finally {
        // A stub holds the RPC session open until it is disposed; `getPlatformProxy` (`next dev`) warns when it is not.
        (stub as Partial<Disposable>)[Symbol.dispose]?.();
      }
    },
  };
}
