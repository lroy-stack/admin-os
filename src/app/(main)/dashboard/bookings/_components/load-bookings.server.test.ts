import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadBookings } from "./load-bookings.server";

/** Every capability a render calls, in order, so the number of reads per render is observable. */
const calls = vi.hoisted(() => [] as string[]);

vi.mock("@/config/runtime", async () => {
  const { createClient } = await import("@/core/client");
  const { fixedClock } = await import("@/core/clock");
  const { createMockAdapter, createSessionStore } = await import("@/core/mock");
  const { CATALOG } = await import("@/config/catalog");
  const { demoActor } = await import("@/config/actor");
  const { MOCK_HANDLERS, settingsFor } = await import("@/config/data.server");
  const { hospitality } = await import("@/verticals/hospitality");
  const { hospitalityClock, hospitalitySeed } = await import("@/verticals/hospitality/server");
  const kernel = createMockAdapter({
    handlers: MOCK_HANDLERS,
    store: createSessionStore(hospitalitySeed),
    sessionId: "s-1",
    clock: fixedClock(hospitalityClock),
    settings: settingsFor("hospitality"),
  });
  const counting = {
    dispatch: (...args: Parameters<typeof kernel.dispatch>) => {
      calls.push(args[0].id);
      return kernel.dispatch(...args);
    },
  };
  return {
    getRuntime: async () => ({
      client: createClient(CATALOG, counting, {
        actor: demoActor("owner", hospitality),
        retryDelayMs: 0,
        logger: () => undefined,
      }),
      locale: "en",
    }),
  };
});

beforeEach(() => {
  calls.length = 0;
});

describe("loadBookings", () => {
  it("reads the guests of a day once, from the customer list", async () => {
    await loadBookings(undefined);

    expect(calls.filter((id) => id.startsWith("customers."))).toEqual(["customers.list"]);
  });

  it("names each booking's guest from the directory", async () => {
    const day = await loadBookings(undefined);

    expect([day.state.status, day.reservations.some((reservation) => reservation.profile !== null)]).toEqual([
      "ready",
      true,
    ]);
  });
});
