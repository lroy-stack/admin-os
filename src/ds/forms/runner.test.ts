import { describe, expect, it, vi } from "vitest";

import type { SerializedCallResult } from "@/core/client";

import { transportFailure } from "./outcome";
import { createActionRunner } from "./runner";

type Action = (input: unknown, key: string) => Promise<SerializedCallResult>;

const setup = () => {
  let next = 0;
  const onPending = vi.fn();
  const runner = createActionRunner({ newKey: () => `key-${++next}`, onPending });
  return { runner, onPending };
};

const keysOf = (action: { mock: { calls: readonly (readonly [unknown, string])[] } }) =>
  action.mock.calls.map(([, key]) => key);

const ok: SerializedCallResult = { status: "ok", value: {} };
const domainError: SerializedCallResult = { status: "error", code: "bookings.table_taken" };

describe("createActionRunner", () => {
  it("refuses a second run while one is in flight, without calling the action", async () => {
    const { runner } = setup();
    let release: (result: SerializedCallResult) => void = () => undefined;
    const first = vi.fn<Action>(() => new Promise((resolve) => (release = resolve)));
    const second = vi.fn<Action>(async () => ok);

    const inFlight = runner.run(first, { party: 2 });
    const refused = await runner.run(second, { party: 2 });
    release(ok);
    await inFlight;

    expect(refused).toBeNull();
    expect(second).not.toHaveBeenCalled();
  });

  it("accepts a new run once the previous one settled", async () => {
    const { runner } = setup();
    const action = vi.fn<Action>(async () => ok);

    await runner.run(action, { party: 2 });
    const again = await runner.run(action, { party: 3 });

    expect(again).toEqual(ok);
  });

  it("reuses the key when the same input is retried after a transport failure", async () => {
    const { runner } = setup();
    const action = vi.fn<Action>().mockResolvedValueOnce(transportFailure).mockResolvedValueOnce(ok);

    await runner.run(action, { party: 2 });
    await runner.run(action, { party: 2 });

    expect(keysOf(action)).toEqual(["key-1", "key-1"]);
  });

  it("treats a throwing action as a transport failure and keeps its key for the retry", async () => {
    const { runner } = setup();
    const action = vi.fn<Action>().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(ok);

    const first = await runner.run(action, { party: 2 });
    await runner.run(action, { party: 2 });

    expect(first).toEqual(transportFailure);
    expect(keysOf(action)).toEqual(["key-1", "key-1"]);
  });

  it("uses a new key when the input changed after a transport failure", async () => {
    const { runner } = setup();
    const action = vi.fn<Action>().mockResolvedValueOnce(transportFailure).mockResolvedValueOnce(ok);

    await runner.run(action, { party: 2 });
    await runner.run(action, { party: 3 });

    expect(keysOf(action)).toEqual(["key-1", "key-2"]);
  });

  it("clears the attempt after an ok result", async () => {
    const { runner } = setup();
    const action = vi.fn<Action>(async () => ok);

    await runner.run(action, { party: 2 });
    await runner.run(action, { party: 2 });

    expect(keysOf(action)).toEqual(["key-1", "key-2"]);
  });

  it("clears the attempt after a domain error", async () => {
    const { runner } = setup();
    const action = vi.fn<Action>(async () => domainError);

    await runner.run(action, { party: 2 });
    await runner.run(action, { party: 2 });

    expect(keysOf(action)).toEqual(["key-1", "key-2"]);
  });

  it("clears in-flight and pending when building the attempt throws", async () => {
    const onPending = vi.fn();
    const runner = createActionRunner({
      newKey: () => {
        throw new Error("crypto.randomUUID is not a function");
      },
      onPending,
    });
    const action = vi.fn<Action>(async () => ok);

    const first = await runner.run(action, { party: 2 });
    const second = await runner.run(action, { party: 2 });

    expect(first).toEqual(transportFailure);
    expect(second).toEqual(transportFailure);
    expect(onPending.mock.calls).toEqual([[true], [false], [true], [false]]);
  });

  it("reports pending true then false around a run", async () => {
    const { runner, onPending } = setup();

    await runner.run(async () => ok, {});

    expect(onPending.mock.calls).toEqual([[true], [false]]);
  });
});
