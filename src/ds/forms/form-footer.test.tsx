import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocaleProvider, resolveMessages } from "@/core/i18n/client";
import { feedbackBundle } from "@/ds/feedback/server";
import { overlaysBundle, overlaysMessages } from "@/ds/overlays/server";

import { FormFooter, type FormFooterProps } from "./form-footer";

const text = overlaysMessages.en;

const render = (props: Partial<FormFooterProps> = {}) =>
  renderToStaticMarkup(
    <LocaleProvider locale="en" currency="EUR" messages={resolveMessages("en", overlaysBundle, feedbackBundle)}>
      <FormFooter verb="Seat walk-in" formId="f1" pending={false} onCancel={() => undefined} {...props} />
    </LocaleProvider>,
  );

describe("FormFooter", () => {
  it("repeats the verb on a submit button tied to the form, beside Cancel", () => {
    const html = render();

    expect(html).toContain('type="submit"');
    expect(html).toContain('form="f1"');
    expect(html).toContain("Seat walk-in");
    expect(html).toContain(text.confirm.cancel);
  });

  it("keeps the primary button focusable and says it is working while pending", () => {
    const html = render({ pending: true });

    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toMatch(/<button[^>]*type="submit"[^>]*\sdisabled/);
    expect(html).toContain(text.confirm.pending);
  });

  it("is not pending by default", () => {
    const html = render();

    expect(html).toContain('aria-disabled="false"');
    expect(html).not.toContain(text.confirm.pending);
  });

  it("always renders the error live region, empty without an error", () => {
    expect(render()).toMatch(/<div role="alert"[^>]*data-slot="form-error"[^>]*><\/div>/);
  });

  it("shows the form-level error inside the live region", () => {
    expect(render({ error: "Table is locked" })).toMatch(/role="alert"[^>]*>Table is locked</);
  });

  it("shows the demo note of the kit when asked", () => {
    expect(render({ demo: true })).toContain(text.window.demoNote);
  });

  it("leaves the demo note out by default", () => {
    expect(render()).not.toContain(text.window.demoNote);
  });

  it("names what waits and who decides while held for approval, and blocks the primary button", () => {
    const html = render({ approval: { action: "Cancel reservation", role: "manager" } });

    expect(html).toContain("Cancel reservation is waiting for approval from the manager role.");
    expect(html).toContain('aria-disabled="true"');
  });
});
