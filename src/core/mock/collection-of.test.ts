import { describe, expect, it } from "vitest";

import { collectionOf } from "./collection-of";

interface Data {
  readonly bookings: readonly { readonly id: string; readonly customerId?: string }[];
  readonly customers?: readonly { readonly id: string; readonly name: string }[];
  readonly label: string;
}

const installed: Data = { bookings: [], customers: [{ id: "c1", name: "Nora" }], label: "x" };
const absent: Data = { bookings: [], label: "x" };

describe("collectionOf (ADR 0017 §3)", () => {
  it("reads the collection of an installed module", () => {
    expect(collectionOf(installed, "customers").find((customer) => customer.id === "c1")?.name).toBe("Nora");
  });

  it("reads an absent module's collection as empty, so an id is unknown rather than a throw", () => {
    expect(collectionOf(absent, "customers").find((customer) => customer.id === "c1")).toBeUndefined();
  });

  it("does not compile for a name that is not a collection of the data", () => {
    // @ts-expect-error `customer` is a typo: the data has no such key.
    const typo = () => collectionOf(installed, "customer");
    // @ts-expect-error `label` is not a collection.
    const scalar = () => collectionOf(installed, "label");
    expect([typo, scalar]).toHaveLength(2);
  });

  it("does not compile a write to another module's collection", () => {
    // @ts-expect-error the collection is read-only through `collectionOf`.
    const write = () => collectionOf(installed, "customers").push({ id: "c2", name: "Ada" });
    expect(write).toBeTypeOf("function");
  });

  it("leaves an unguarded read of the optional collection to fail in tsc", () => {
    // @ts-expect-error the collection is optional: read it through `collectionOf`.
    const unguarded = () => absent.customers.find((customer) => customer.id === "c1");
    expect(unguarded).toThrow(TypeError);
  });
});
