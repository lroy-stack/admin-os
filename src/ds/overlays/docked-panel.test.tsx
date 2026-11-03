import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocaleProvider, resolveMessages } from "@/core/i18n/client";

import { DockedPanel, DockedPanelLayout } from "./docked-panel";
import { overlaysBundle } from "./server";

const copy = { title: "New reservation", body: "Party of two", page: "Floor" };

const render = (children: React.ReactNode) =>
  renderToStaticMarkup(
    <LocaleProvider locale="en" currency="EUR" messages={resolveMessages("en", overlaysBundle)}>
      {children}
    </LocaleProvider>,
  );

describe("DockedPanel", () => {
  it("renders nothing in the server HTML, even when open and dirty", () => {
    const html = render(
      <DockedPanel open dirty title={copy.title} onOpenChange={() => undefined}>
        {copy.body}
      </DockedPanel>,
    );

    expect(html).toBe("");
  });

  it("leaves the slot empty beside the page content in the server HTML", () => {
    const html = render(
      <DockedPanelLayout>
        <p>{copy.page}</p>
        <DockedPanel open title={copy.title} onOpenChange={() => undefined}>
          {copy.body}
        </DockedPanel>
      </DockedPanelLayout>,
    );

    expect(html).toContain(`<p>${copy.page}</p>`);
    expect(html).toMatch(/data-slot="docked-panel-slot"[^>]*><\/div>/);
    expect(html).not.toContain(copy.title);
  });
});
