import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { useHydrated } from "./use-hydrated";
import { useViewport } from "./use-viewport";

function HydratedFlag() {
  return <p>{String(useHydrated())}</p>;
}

function ViewportFlag() {
  return <p>{String(useViewport())}</p>;
}

describe("useHydrated", () => {
  it("is false in the server render", () => {
    expect(renderToStaticMarkup(<HydratedFlag />)).toBe("<p>false</p>");
  });
});

describe("useViewport", () => {
  it("is unknown in the server render, so ResponsivePanel renders nothing and never guesses a direction", () => {
    expect(renderToStaticMarkup(<ViewportFlag />)).toBe("<p>undefined</p>");
  });
});
