import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocaleProvider, resolveMessages } from "@/core/i18n/client";

import { CustomerCard } from "./customer-card";
import type { CustomerRow } from "./directory-model";
import { customerDirectoryBundle } from "./messages.server";

const customer: CustomerRow = {
  id: "c1",
  name: "Nora Vidal",
  email: "nora@example.com",
  phone: "+34600000201",
  tags: ["Regular"],
  vip: true,
  blocked: false,
  visits: 4,
  spend: { amountMinor: 24000, currency: "EUR" },
  lastVisit: "2026-10-17T00:00:00Z",
};

const render = (row: CustomerRow) =>
  renderToStaticMarkup(
    <LocaleProvider locale="en" currency="EUR" messages={resolveMessages("en", customerDirectoryBundle)}>
      <CustomerCard customer={row} />
    </LocaleProvider>,
  );

describe("CustomerCard", () => {
  it("offers email as a mailto link named after the customer", () => {
    expect(render(customer)).toMatch(/<a aria-label="Email Nora Vidal"[^>]*href="mailto:nora@example.com"/);
  });

  it("offers a call as a tel link named after the customer", () => {
    expect(render(customer)).toMatch(/<a aria-label="Call Nora Vidal"[^>]*href="tel:\+34600000201"/);
  });

  it("leaves out the email link when the customer has no email", () => {
    const { email: _email, ...withoutEmail } = customer;
    expect(render(withoutEmail)).not.toContain("mailto:");
  });

  it("leaves out the call link when the customer has no phone", () => {
    const { phone: _phone, ...withoutPhone } = customer;
    expect(render(withoutPhone)).not.toContain("tel:");
  });

  it("is not a button or a link to anything else, so it has no dead control", () => {
    expect(render(customer)).not.toContain("<button");
  });

  it("says when the customer has not visited yet", () => {
    expect(render({ ...customer, lastVisit: null, spend: null })).toContain("No visits yet");
  });
});
