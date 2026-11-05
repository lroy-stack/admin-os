import { describe, expect, it } from "vitest";

import { DEMO } from "@/config/demo-kernel";

import { SCHEMA_VERSION } from "../src/demo-store";
import { seedShapeHash } from "../src/seed-shape";

describe("SCHEMA_VERSION", () => {
  it("moves together with the structure of the seeds", () => {
    // A saved session was written against one seed structure. When this fails, the seeds changed shape: bump
    // SCHEMA_VERSION in src/demo-store.ts so saved sessions reset, then update both numbers here.
    const seeds = Object.fromEntries(Object.entries(DEMO).map(([vertical, { seed }]) => [vertical, seed]));
    expect([SCHEMA_VERSION, seedShapeHash(seeds)]).toEqual([6, "1aefe55a"]);
  });

  it("changes the fingerprint when a collection gains a field", () => {
    expect(seedShapeHash({ bookings: [{ id: "a" }] })).not.toBe(seedShapeHash({ bookings: [{ id: "a", note: "x" }] }));
  });

  it("ignores values and the order of keys", () => {
    expect(seedShapeHash({ bookings: [{ id: "a", n: 1 }] })).toBe(seedShapeHash({ bookings: [{ n: 2, id: "b" }] }));
  });
});
