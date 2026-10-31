import { beforeEach, describe, expect, it, vi } from "vitest";

const set = vi.fn();

// next/font only loads inside a Next build; the preference registry just needs the keys.
vi.mock("@/lib/fonts/registry", () => ({ fontKeys: ["outfit"] }));

vi.mock("next/headers", () => ({ cookies: async () => ({ set, get: vi.fn() }) }));

const { setCurrency, setLocale } = await import("./actions");

describe("setLocale", () => {
  beforeEach(() => {
    set.mockClear();
  });

  it.each([["xx"], [""], [{}], [undefined], [["fr"]]])("rejects %j and writes nothing", async (value) => {
    await expect(setLocale(value)).rejects.toThrow("Unsupported locale");
    expect(set).not.toHaveBeenCalled();
  });

  it("stores a valid locale for a year, site-wide, same-site lax", async () => {
    await setLocale("fr");
    expect(set).toHaveBeenCalledWith("locale", "fr", { path: "/", maxAge: 31_536_000, sameSite: "lax" });
  });
});

describe("setCurrency", () => {
  beforeEach(() => {
    set.mockClear();
  });

  it.each([["JPY"], ["usd"], [""], [{}], [undefined], [["EUR"]]])("rejects %j and writes nothing", async (value) => {
    await expect(setCurrency(value)).rejects.toThrow("Unsupported currency");
    expect(set).not.toHaveBeenCalled();
  });

  it.each([["USD"], ["EUR"], ["GBP"]])("stores %s for a year, site-wide, same-site lax", async (currency) => {
    await setCurrency(currency);
    expect(set).toHaveBeenCalledWith("currency", currency, { path: "/", maxAge: 31_536_000, sameSite: "lax" });
  });
});
