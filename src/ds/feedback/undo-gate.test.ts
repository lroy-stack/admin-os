import { describe, expect, it } from "vitest";

import { createUndoGate } from "./undo-gate";

describe("createUndoGate", () => {
  it("starts unsettled", () => {
    expect(createUndoGate().outcome).toBeNull();
  });

  it("lets the first undo through and ignores a second one", () => {
    const gate = createUndoGate();

    expect(gate.settle("undone")).toBe(true);
    expect(gate.settle("undone")).toBe(false);
  });

  it("ignores an undo that comes after expiry", () => {
    const gate = createUndoGate();
    gate.settle("expired");

    expect(gate.settle("undone")).toBe(false);
    expect(gate.outcome).toBe("expired");
  });

  it("ignores an expiry that comes after an undo", () => {
    const gate = createUndoGate();
    gate.settle("undone");

    expect(gate.settle("expired")).toBe(false);
    expect(gate.outcome).toBe("undone");
  });
});
