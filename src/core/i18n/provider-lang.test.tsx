import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// renderToStaticMarkup never runs effects and there is no DOM here, so `useEffect` is captured instead. The tests
// run the captured effects in React's mount order (children first) and call a provider's cleanup alone to model
// a page unmounting under a layout that stays.
const captured = vi.hoisted(() => ({ effects: [] as (() => void | (() => void))[] }));

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: (effect: () => void | (() => void)) => {
    captured.effects.push(effect);
  },
}));

const { LocaleProvider, useLocale } = await import("./client");

function Reader() {
  return <p>{useLocale()}</p>;
}

const root = { lang: "en" };

function mount(markup: React.ReactElement) {
  captured.effects = [];
  renderToStaticMarkup(markup);
  // Render order is outer to inner; React runs effects inner to outer.
  return [...captured.effects].reverse().map((effect) => effect());
}

const provider = (locale: "en" | "es" | "de" | "fr", children: React.ReactNode) => (
  <LocaleProvider locale={locale} currency="EUR" messages={{}}>
    {children}
  </LocaleProvider>
);

beforeEach(() => {
  root.lang = "en";
  vi.stubGlobal("document", { documentElement: root });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("<html lang> with nested LocaleProviders", () => {
  it("is set by the outermost provider", () => {
    mount(provider("fr", provider("fr", null)));
    expect(root.lang).toBe("fr");
  });

  it("keeps the layout's language when a nested page provider unmounts alone", () => {
    // [nested cleanup, outer cleanup]: the page leaves while the layout stays.
    const [nestedCleanup] = mount(provider("fr", provider("fr", null)));
    nestedCleanup?.();
    expect(root.lang).toBe("fr");
  });

  it("restores the original language when the outermost provider unmounts", () => {
    const [, outerCleanup] = mount(provider("fr", provider("fr", null)));
    outerCleanup?.();
    expect(root.lang).toBe("en");
  });

  it("has no cleanup for a nested provider", () => {
    const [nestedCleanup] = mount(provider("de", provider("de", null)));
    expect(nestedCleanup).toBeUndefined();
  });
});

describe("LocaleProvider context", () => {
  it("serves the locale to nested readers", () => {
    expect(renderToStaticMarkup(provider("es", provider("es", <Reader />)))).toBe("<p>es</p>");
  });
});
