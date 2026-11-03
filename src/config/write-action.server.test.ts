import { beforeEach, describe, expect, it, vi } from "vitest";

import { err, ok } from "@/core/result";

import { runWrite } from "./write-action.server";

const mocks = vi.hoisted(() => ({ call: vi.fn(), refresh: vi.fn() }));

vi.mock("next/cache", () => ({ refresh: mocks.refresh }));
vi.mock("./runtime", () => ({ getRuntime: async () => ({ client: { call: mocks.call } }) }));

const ID = "access.me.get";

beforeEach(() => {
  mocks.call.mockReset();
  mocks.refresh.mockReset();
});

describe("runWrite", () => {
  it("calls the capability with the attempt key as idempotency key", async () => {
    mocks.call.mockResolvedValue(ok({}));

    await runWrite(ID, { party: 2 }, "attempt-1");

    expect(mocks.call).toHaveBeenCalledWith(ID, { party: 2 }, { idempotencyKey: "attempt-1" });
  });

  it("refreshes after a successful write and returns the serialized success", async () => {
    mocks.call.mockResolvedValue(ok({ id: "b-1" }));

    const result = await runWrite(ID, {}, "attempt-1");

    expect(result).toEqual({ status: "ok", value: { id: "b-1" } });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh after an error and hides the server message", async () => {
    mocks.call.mockResolvedValue(err("bookings.table_taken", "SQL: constraint tables_pk"));

    const result = await runWrite(ID, {}, "attempt-1");

    expect(result).toEqual({ status: "error", code: "bookings.table_taken" });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("does not refresh while the write awaits approval and hides the approval id", async () => {
    mocks.call.mockResolvedValue({ status: "awaiting_approval", approvalId: "appr-secret-1" });

    const result = await runWrite(ID, {}, "attempt-1");

    expect(result).toEqual({ status: "awaiting_approval" });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it.each([[undefined], [""], [42], ["k".repeat(129)]])("refuses the attempt key %j without calling", async (key) => {
    const result = await runWrite(ID, {}, key);

    expect(result).toEqual({ status: "error", code: "schema.invalid_input", paths: ["idempotencyKey"] });
    expect(mocks.call).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
