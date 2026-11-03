import type { ReactNode } from "react";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocaleProvider, resolveMessages } from "@/core/i18n/client";

import { FormDialog } from "./form-dialog";
import { QuickDialog } from "./quick-dialog";
import { overlaysBundle } from "./server";

const copy = { title: "Seat walk-in", body: "Party of two" };

const inLocale = (children: ReactNode) =>
  renderToStaticMarkup(
    <LocaleProvider locale="en" currency="EUR" messages={resolveMessages("en", overlaysBundle)}>
      {children}
    </LocaleProvider>,
  );

describe("QuickDialog and FormDialog", () => {
  it("render nothing in the server HTML, even when open and dirty", () => {
    const html = inLocale(
      <>
        <QuickDialog open dirty demo onOpenChange={() => undefined} title={copy.title}>
          {copy.body}
        </QuickDialog>
        <FormDialog open dirty demo onOpenChange={() => undefined} title={copy.title}>
          {copy.body}
        </FormDialog>
      </>,
    );

    expect(html).toBe("");
  });
});
