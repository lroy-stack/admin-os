import { beforeEach, describe, expect, it, vi } from "vitest";

const set = vi.fn();

// next/font only loads inside a Next build; the preference registry just needs the keys.
vi.mock("@/lib/fonts/registry", () => ({ fontKeys: ["outfit"] }));

vi.mock("next/headers", () => ({ cookies: async () => ({ set, get: vi.fn() }) }));

const { setCurrency, setLocale, setPreference } = await import("./actions");

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

describe("setPreference", () => {
  beforeEach(() => {
    set.mockClear();
  });

  it.each([
    ["demo_session"],
    ["demo_role"],
    ["demo_preset"],
    ["mock_faults"],
    ["locale"],
    ["currency"],
    ["__proto__"],
    ["toString"],
    [""],
    [42],
    [undefined],
  ])("rejects the cookie name %j and writes nothing", async (key) => {
    await expect(setPreference(key, "dark")).rejects.toThrow("Unknown preference");
    expect(set).not.toHaveBeenCalled();
  });

  it.each([["neon"], [""], [1], [undefined], [["dark"]]])(
    "rejects %j as a theme mode and writes nothing",
    async (value) => {
      await expect(setPreference("theme_mode", value)).rejects.toThrow("Unsupported value for theme_mode");
      expect(set).not.toHaveBeenCalled();
    },
  );

  it("stores an allowed value under its own key for a year, same-site lax", async () => {
    await setPreference("theme_mode", "dark");
    expect(set).toHaveBeenCalledWith("theme_mode", "dark", { path: "/", maxAge: 31_536_000, sameSite: "lax" });
  });
});
