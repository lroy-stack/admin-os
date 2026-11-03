import { describe, expect, it } from "vitest";

import { createPickBroker } from "./use-panel-pick";

describe("createPickBroker", () => {
  it("resolves the request with the page's answer and leaves pick mode", async () => {
    const broker = createPickBroker<number>();
    const request = broker.request("table");

    expect(broker.current()).toBe("table");
    expect(broker.answer(7)).toBe(true);

    await expect(request).resolves.toBe(7);
    expect(broker.current()).toBeNull();
  });

  it("resolves null when cancelled", async () => {
    const broker = createPickBroker<number>();
    const request = broker.request("table");

    broker.cancel();

    await expect(request).resolves.toBeNull();
    expect(broker.current()).toBeNull();
  });

  it("keeps one request pending: a new one supersedes the old, which resolves null", async () => {
    const broker = createPickBroker<number>();
    const first = broker.request("table");
    const second = broker.request("guest");

    expect(broker.current()).toBe("guest");
    broker.answer(3);

    await expect(first).resolves.toBeNull();
    await expect(second).resolves.toBe(3);
  });

  it("treats an answer with nothing pending as an ordinary click", () => {
    const broker = createPickBroker<number>();

    expect(broker.answer(1)).toBe(false);
  });

  it("cancel with nothing pending notifies nobody", () => {
    const broker = createPickBroker<number>();
    const calls: number[] = [];
    broker.subscribe(() => calls.push(1));

    broker.cancel();

    expect(calls).toEqual([]);
  });

  it("notifies subscribers on request, answer and cancel, and stops after unsubscribe", () => {
    const broker = createPickBroker<number>();
    const seen: (string | null)[] = [];
    const unsubscribe = broker.subscribe(() => seen.push(broker.current()));

    void broker.request("table");
    broker.answer(1);
    void broker.request("table");
    broker.cancel();
    unsubscribe();
    void broker.request("table");

    expect(seen).toEqual(["table", null, "table", null]);
  });
});
