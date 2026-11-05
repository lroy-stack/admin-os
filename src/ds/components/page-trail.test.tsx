import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageTrail } from "./page-trail";

// Fixture words, as a route's dictionary would give them.
const TRAIL = {
  label: "Breadcrumb",
  current: "Nora Vidal",
  levels: [
    { label: "Home", href: "/dashboard/default" },
    { label: "Guests", href: "/dashboard/customers" },
  ],
} as const;

const html = renderToStaticMarkup(<PageTrail current={TRAIL.current} label={TRAIL.label} levels={TRAIL.levels} />);

describe("PageTrail (ADR 0020 §2)", () => {
  it("is a navigation landmark named in the page's language", () => {
    expect(html).toMatch(/^<nav aria-label="Breadcrumb"/);
  });

  it.each([
    ["Home", "/dashboard/default"],
    ["Guests", "/dashboard/customers"],
  ])("links the level %s to %s", (label, href) => {
    expect(html).toContain(`href="${href}">${label}</a>`);
  });

  it("marks the current page and does not link it", () => {
    expect(html).toMatch(/<span[^>]*aria-current="page"[^>]*>Nora Vidal<\/span>/);
    expect(html).not.toMatch(/<a[^>]*>Nora Vidal<\/a>/);
  });

  it("puts the levels in order, outermost first", () => {
    expect(html.indexOf("Home")).toBeLessThan(html.indexOf("Guests"));
    expect(html.indexOf("Guests")).toBeLessThan(html.indexOf("Nora Vidal"));
  });
});
