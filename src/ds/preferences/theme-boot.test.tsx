import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ThemeBootScript } from "./theme-boot";
import { runInNewContext } from "node:vm";

// next/font only loads inside a Next build; the preference registry just needs the keys.
vi.mock("@/lib/fonts/registry", () => ({ fontKeys: ["outfit"] }));

function bootLang(cookie: string): string {
  const html = renderToStaticMarkup(<ThemeBootScript />);
  const code = html.slice(html.indexOf(">") + 1, html.lastIndexOf("</script>"));
  const root = { lang: "", setAttribute: () => undefined, classList: { toggle: () => undefined }, style: {} };
  runInNewContext(code, { document: { cookie, documentElement: root }, window: {}, console });
  return root.lang;
}

describe("boot script language", () => {
  it.each([
    ["a valid cookie", "theme_mode=dark; locale=de", "de"],
    ["an unsupported cookie value", "locale=xx", ""],
    ["no cookie", "theme_mode=dark", ""],
  ])("sets <html lang> from %s", (_name, cookie, expected) => {
    expect(bootLang(cookie)).toBe(expected);
  });
});
