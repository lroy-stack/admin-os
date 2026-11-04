import { describe, expect, it, vi } from "vitest";

import { DEFAULT_ROLES, permissionsOf } from "@/core/access";
import { type Adapter, createClient } from "@/core/client";
import { fixedClock } from "@/core/clock";
import { createMockAdapter, createSessionStore } from "@/core/mock";
import { isAwaitingApproval, ok } from "@/core/result";

import { CATALOG } from "./catalog";
import { DEMO, MOCK_HANDLERS, settingsFor } from "./demo-kernel";
import type { StoreCallContext } from "./demo-store-rpc";
import { durableAdapter, type StoreNamespace } from "./durable-adapter.server";
import { VERTICALS } from "./vertical";

const actor = {
  actorId: "demo-owner",
  roleId: "owner",
  permissions: permissionsOf(DEFAULT_ROLES[0], CATALOG, VERTICALS.hospitality.modules),
};

/** A namespace that records every dispatch and every stub disposal, answering `ok` with the capability id. */
const recordingNamespace = (options: { fail?: boolean } = {}) => {
  const dispatched: { capabilityId: string; context: StoreCallContext }[] = [];
  const disposed = vi.fn();
  const names: string[] = [];
  const namespace: StoreNamespace = {
    idFromName: (name) => {
      names.push(name);
      return name;
    },
    get: () => ({
      dispatch: async (capabilityId, _input, context) => {
        dispatched.push({ capabilityId, context });
        if (options.fail) throw new Error("store unreachable");
        return ok(capabilityId);
      },
      [Symbol.dispose]: disposed,
    }),
  };
  return { namespace, dispatched, disposed, names };
};

/** The kernel over the seed, as `getAdapter` hands it to the durable adapter. */
const inProcess: Adapter = createMockAdapter({
  handlers: MOCK_HANDLERS,
  store: createSessionStore(DEMO.hospitality.seed),
  sessionId: "s-1",
  clock: fixedClock(DEMO.hospitality.clock),
  settings: settingsFor("hospitality"),
});

const clientOver = (namespace: StoreNamespace | undefined) =>
  createClient(
    CATALOG,
    durableAdapter({ vertical: "hospitality", sessionId: "s-1", clockLive: true, inProcess, namespace }),
    { actor, retryDelayMs: 0, logger: () => undefined, mode: "production" },
  );

describe("durableAdapter", () => {
  it.each(["clock.get", "settings.values.get"] as const)(
    "answers %s in process, without a store request",
    async (id) => {
      const { namespace, dispatched } = recordingNamespace();

      const answer = await clientOver(namespace).call(id, {});

      expect([!isAwaitingApproval(answer) && answer.ok, dispatched.length]).toEqual([true, 0]);
    },
  );

  it("sends every other capability to the object named vertical:sessionId with the call's context", async () => {
    const { namespace, dispatched, names } = recordingNamespace();

    await clientOver(namespace).call("customers.list", {});

    expect([names, dispatched.map((call) => call.capabilityId), dispatched[0]?.context]).toEqual([
      ["hospitality:s-1"],
      ["customers.list"],
      expect.objectContaining({
        vertical: "hospitality",
        sessionId: "s-1",
        clockLive: true,
        via: "ui",
        actor,
        catalogVersion: expect.stringMatching(/^[0-9a-f]+$/),
      }),
    ]);
  });

  it("disposes the stub after a call", async () => {
    const { namespace, disposed } = recordingNamespace();

    await clientOver(namespace).call("customers.list", {});

    expect(disposed).toHaveBeenCalledTimes(1);
  });

  it("disposes the stub when the call throws", async () => {
    const { namespace, disposed, dispatched } = recordingNamespace({ fail: true });

    await clientOver(namespace).call("customers.list", {});

    expect([dispatched.length > 0, disposed.mock.calls.length]).toEqual([true, dispatched.length]);
  });

  it("answers transport.unavailable when the binding is missing", async () => {
    vi.doMock("@opennextjs/cloudflare", () => ({ getCloudflareContext: () => ({ env: {} }) }));
    const adapter = durableAdapter({ vertical: "hospitality", sessionId: "s-1", inProcess });

    const answer = await adapter.dispatch(
      CATALOG["customers.list"],
      {},
      {
        actor,
        correlationId: "c",
        signal: new AbortController().signal,
        via: "ui",
      },
    );

    expect(answer).toMatchObject({ ok: false, error: { code: "transport.unavailable" } });
  });
});
