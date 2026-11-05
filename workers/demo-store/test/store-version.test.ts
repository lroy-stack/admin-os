import { describe, expect, it } from "vitest";

import { DEMO } from "@/config/demo-kernel";

import { STORE_FORMAT, STORE_VERSION } from "../src/demo-store";
import { seedFingerprint } from "../src/seed-shape";

const seeds = Object.fromEntries(Object.entries(DEMO).map(([vertical, { seed }]) => [vertical, seed]));

/** ADR 0017 §8: a saved session resets when the snapshot format or the seeds it was written against change. */
describe("the demo store's version", () => {
  it("is the snapshot format and the seeds' fingerprint, as text that never reads as a number", () => {
    expect(STORE_VERSION).toBe(`${STORE_FORMAT}:${seedFingerprint(seeds)}`);
    expect(Number.isNaN(Number(STORE_VERSION))).toBe(true);
  });

  it("moves when a collection gains a row", () => {
    expect(seedFingerprint({ bookings: [{ id: "a" }] })).not.toBe(
      seedFingerprint({ bookings: [{ id: "a" }, { id: "b" }] }),
    );
  });

  it("moves when a collection gains a field", () => {
    expect(seedFingerprint({ bookings: [{ id: "a" }] })).not.toBe(
      seedFingerprint({ bookings: [{ id: "a", note: "x" }] }),
    );
  });

  it("moves when a module's collection goes", () => {
    expect(seedFingerprint({ hospitality: { bookings: [{ id: "a" }], stock: [{ id: "s" }] } })).not.toBe(
      seedFingerprint({ hospitality: { bookings: [{ id: "a" }] } }),
    );
  });

  it("ignores values other than ids, and the order of keys", () => {
    expect(seedFingerprint({ bookings: [{ id: "a", n: 1 }] })).toBe(seedFingerprint({ bookings: [{ n: 2, id: "a" }] }));
  });
});
