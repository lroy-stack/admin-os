import { describe, expect, it, vi } from "vitest";

import { copyText } from "./use-copy";

describe("copyText", () => {
  it("writes through the Clipboard API when it works", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const legacyCopy = vi.fn().mockReturnValue(true);

    const copied = await copyText("hello", { clipboard: { writeText }, legacyCopy });

    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(legacyCopy).not.toHaveBeenCalled();
  });

  it("falls back to the legacy path when the Clipboard API refuses", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("NotAllowedError"));
    const legacyCopy = vi.fn().mockReturnValue(true);

    const copied = await copyText("hello", { clipboard: { writeText }, legacyCopy });

    expect(copied).toBe(true);
    expect(legacyCopy).toHaveBeenCalledWith("hello");
  });

  it("falls back to the legacy path when the Clipboard API is unavailable", async () => {
    const legacyCopy = vi.fn().mockReturnValue(true);

    const copied = await copyText("hello", { clipboard: undefined, legacyCopy });

    expect(copied).toBe(true);
    expect(legacyCopy).toHaveBeenCalledWith("hello");
  });

  it("reports failure when both paths fail", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));

    const copied = await copyText("hello", { clipboard: { writeText }, legacyCopy: () => false });

    expect(copied).toBe(false);
  });
});
