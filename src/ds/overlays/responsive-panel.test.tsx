import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ResponsivePanel } from "./responsive-panel";
import { useHydrated } from "./use-hydrated";

function HydratedFlag() {
  return <p>{String(useHydrated())}</p>;
}

describe("useHydrated", () => {
  it("is false in the server render", () => {
    expect(renderToStaticMarkup(<HydratedFlag />)).toBe("<p>false</p>");
  });
});

const copy = { title: "Booking", description: "Details", body: "Body" };

describe("ResponsivePanel", () => {
  it("renders no overlay in the server HTML even when open", () => {
    const html = renderToStaticMarkup(
      <ResponsivePanel open onOpenChange={() => undefined} title={copy.title} description={copy.description}>
        {copy.body}
      </ResponsivePanel>,
    );

    expect(html).toBe("");
  });
});
