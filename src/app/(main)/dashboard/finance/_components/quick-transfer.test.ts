import { describe, expect, it } from "vitest";

import { parseTransferAmount } from "./quick-transfer";

describe("parseTransferAmount", () => {
  it("reads a decimal with a point", () => {
    expect(parseTransferAmount("12.5")).toBe(12.5);
  });

  it("reads a decimal with a comma", () => {
    expect(parseTransferAmount(" 12,5 ")).toBe(12.5);
  });

  it("refuses an empty field", () => {
    expect(parseTransferAmount("  ")).toBeNull();
  });

  it("refuses zero", () => {
    expect(parseTransferAmount("0")).toBeNull();
  });

  it("refuses text", () => {
    expect(parseTransferAmount("abc")).toBeNull();
  });
});
