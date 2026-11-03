import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocaleProvider, resolveMessages } from "@/core/i18n/client";

import { DuplicateNotice } from "./duplicate-notice";
import { customerDirectoryBundle, customerDirectoryMessages } from "./messages.server";

const text = customerDirectoryMessages.en.newContact;

const render = (matches: Parameters<typeof DuplicateNotice>[0]["matches"]) =>
  renderToStaticMarkup(
    <LocaleProvider locale="en" currency="EUR" messages={resolveMessages("en", customerDirectoryBundle)}>
      <DuplicateNotice matches={matches} query={{ phone: "+34600000102" }} onNavigate={() => undefined} />
    </LocaleProvider>,
  );

describe("DuplicateNotice", () => {
  it("keeps an empty live region mounted when there is no match, so a later notice is announced", () => {
    expect(render([])).toBe('<div role="status" data-slot="duplicate-notice" class="empty:hidden"></div>');
  });

  it("links to the directory filtered to each existing contact, with the reason", () => {
    const html = render([{ id: "c2", name: "Ortega", matchedOn: ["phone"] }]);

    expect(html).toContain('href="/dashboard/customers?q=%2B34600000102"');
    expect(html).toContain(">Show Ortega</a>");
    expect(html).toContain(text.duplicate.reason.phone);
    expect(html).toContain(text.duplicate.title);
  });
});
