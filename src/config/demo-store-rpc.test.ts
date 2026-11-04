import { describe, expect, it } from "vitest";

import { catalogVersion, MAX_STORE_FAULT_LATENCY_MS, storeCallContextSchema } from "./demo-store-rpc";

const context = {
  vertical: "hospitality",
  sessionId: "s-1",
  actor: { actorId: "demo-owner", roleId: "owner", permissions: ["read:customers"] },
  correlationId: "c-1",
  via: "ui",
  clockLive: false,
  catalogVersion: "abc",
} as const;

describe("storeCallContextSchema", () => {
  it("accepts the context a caller builds", () => {
    expect(storeCallContextSchema.safeParse(context).success).toBe(true);
  });

  it("caps a forced latency fault so one visitor's call cannot hold the object", () => {
    const parsed = storeCallContextSchema.parse({ ...context, faults: [["bookings.list", { latencyMs: 60_000 }]] });
    expect(parsed.faults).toEqual([["bookings.list", { latencyMs: MAX_STORE_FAULT_LATENCY_MS }]]);
  });

  it("keeps a latency fault under the cap as it is", () => {
    const parsed = storeCallContextSchema.parse({ ...context, faults: [["bookings.list", { latencyMs: 250 }]] });
    expect(parsed.faults).toEqual([["bookings.list", { latencyMs: 250 }]]);
  });

  it.each([
    ["an unknown preset", { vertical: "bakery" }],
    ["an empty session id", { sessionId: "" }],
    ["an unknown surface", { via: "pigeon" }],
    ["a missing catalogue version", { catalogVersion: undefined }],
  ])("rejects %s", (_label, override) => {
    expect(storeCallContextSchema.safeParse({ ...context, ...override }).success).toBe(false);
  });
});

describe("catalogVersion", () => {
  it("answers the same fingerprint every time", () => {
    expect(catalogVersion()).toBe(catalogVersion());
  });
});
