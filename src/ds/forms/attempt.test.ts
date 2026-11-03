import { describe, expect, it } from "vitest";

import { attemptFor } from "./attempt";

const keys = () => {
  let next = 0;
  return () => `key-${++next}`;
};

describe("attemptFor", () => {
  it("creates a key for a first attempt", () => {
    expect(attemptFor(undefined, { party: 2 }, keys())).toEqual({ key: "key-1", input: '{"party":2}' });
  });

  it("reuses the key when the same input is retried", () => {
    const newKey = keys();
    const first = attemptFor(undefined, { party: 2 }, newKey);

    const retry = attemptFor(first, { party: 2 }, newKey);

    expect(retry.key).toBe("key-1");
  });

  it("creates a new key when the input changed", () => {
    const newKey = keys();
    const first = attemptFor(undefined, { party: 2 }, newKey);

    const next = attemptFor(first, { party: 3 }, newKey);

    expect(next.key).toBe("key-2");
  });

  it("creates a new key when nothing is left over from a failed attempt", () => {
    const newKey = keys();
    attemptFor(undefined, { party: 2 }, newKey);

    expect(attemptFor(undefined, { party: 2 }, newKey).key).toBe("key-2");
  });
});
