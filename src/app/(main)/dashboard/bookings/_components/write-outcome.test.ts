import { describe, expect, it } from "vitest";

import { failureMessage } from "./write-outcome";

describe("failureMessage", () => {
  it("shows the server's own text for an error", () => {
    expect(failureMessage({ status: "error", text: "Too early.", code: "bookings.too_early" }, "Failed")).toBe(
      "Too early.",
    );
  });

  it("shows the first issue of a rejected input", () => {
    expect(failureMessage({ status: "invalid", issues: [{ path: ["reason"], message: "Say why." }] }, "Failed")).toBe(
      "Say why.",
    );
  });

  it("falls back when a rejected input names no issue", () => {
    expect(failureMessage({ status: "invalid", issues: [] }, "Failed")).toBe("Failed");
  });

  it("falls back when the write is held for approval", () => {
    expect(failureMessage({ status: "awaiting_approval" }, "Failed")).toBe("Failed");
  });
});
