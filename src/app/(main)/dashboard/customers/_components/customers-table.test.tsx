import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocaleProvider, resolveMessages } from "@/core/i18n/client";

import { CustomersTable } from "./customers-table";
import type { CustomerRow } from "./directory-model";
import { customerDirectoryBundle } from "./messages.server";

const customer: CustomerRow = {
  id: "c1",
  name: "Nora Vidal",
  tags: [],
  vip: false,
  blocked: false,
  visits: 4,
  spend: null,
  lastVisit: null,
};

const html = renderToStaticMarkup(
  <LocaleProvider locale="en" currency="EUR" messages={resolveMessages("en", customerDirectoryBundle)}>
    <CustomersTable customers={[customer]} />
  </LocaleProvider>,
);

describe("CustomersTable", () => {
  it("links the name to the customer's record page", () => {
    expect(html).toMatch(/<a [^>]*href="\/dashboard\/customers\/c1"[^>]*>Nora Vidal<\/a>/);
  });

  it("makes only the name clickable, not the cell around it", () => {
    expect(html).toMatch(/<a [^>]*class="[^"]*\bw-fit\b[^"]*"[^>]*>Nora Vidal/);
  });
});
