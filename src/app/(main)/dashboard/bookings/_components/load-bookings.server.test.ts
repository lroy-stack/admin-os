import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadBookings } from "./load-bookings.server";

/** What a render asked the store for, in order, and a customer the directory should not have. */
const world = vi.hoisted(() => ({ storeCalls: [] as string[], missingCustomer: undefined as string | undefined }));

vi.mock("@/config/runtime", async () => {
  const { createClient } = await import("@/core/client");
  const { fixedClock } = await import("@/core/clock");
  const { createMockAdapter, createSessionStore } = await import("@/core/mock");
  const { CATALOG } = await import("@/config/catalog");
  const { demoActor } = await import("@/config/actor");
  const { MOCK_HANDLERS, settingsFor } = await import("@/config/data.server");
  const { durableAdapter } = await import("@/config/durable-adapter.server");
  const { hospitality } = await import("@/verticals/hospitality");
  const { hospitalityClock, hospitalitySeed } = await import("@/verticals/hospitality/server");

  const kernelFor = (seed: typeof hospitalitySeed) =>
    createMockAdapter({
      handlers: MOCK_HANDLERS,
      store: createSessionStore(seed),
      sessionId: "s-1",
      clock: fixedClock(hospitalityClock),
      settings: settingsFor("hospitality"),
    });

  return {
    getRuntime: async () => {
      const seed = {
        ...hospitalitySeed,
        customers: hospitalitySeed.customers.filter((customer) => customer.id !== world.missingCustomer),
      };
      const kernel = kernelFor(seed);
      // The web app's adapter over a store that records each request and runs the same kernel.
      const adapter = durableAdapter({
        vertical: "hospitality",
        sessionId: "s-1",
        inProcess: kernel,
        namespace: {
          idFromName: (name) => name,
          get: () => ({
            dispatch: async (capabilityId, input, context) => {
              world.storeCalls.push(capabilityId);
              const result = await kernel.dispatch(CATALOG[capabilityId], input, {
                actor: context.actor,
                correlationId: context.correlationId,
                via: context.via,
                signal: AbortSignal.timeout(1000),
              });
              return result;
            },
          }),
        },
      });
      return {
        client: createClient(CATALOG, adapter, {
          actor: demoActor("owner", hospitality),
          retryDelayMs: 0,
          logger: () => undefined,
        }),
        locale: "en",
      };
    },
  };
});

beforeEach(() => {
  world.storeCalls.length = 0;
  world.missingCustomer = undefined;
});

describe("loadBookings", () => {
  it("costs a visitor with a session exactly four store requests, none of them per guest", async () => {
    await loadBookings(undefined);

    // The settings are the session's own (a visitor may change them), so they are read from its object too.
    expect(world.storeCalls).toEqual(["settings.values.get", "bookings.list", "resources.list", "customers.list"]);
  });

  it("names each booking's guest from the directory", async () => {
    const day = await loadBookings(undefined);

    expect([day.state.status, day.reservations.some((reservation) => reservation.profile !== null)]).toEqual([
      "ready",
      true,
    ]);
  });

  it("fails the day with customers.not_found when a booking's guest is not in the directory", async () => {
    world.missingCustomer = "C-iglesias";

    const day = await loadBookings(undefined);

    expect([day.state, day.reservations]).toEqual([
      expect.objectContaining({ status: "error", code: "customers.not_found" }),
      [],
    ]);
  });
});
