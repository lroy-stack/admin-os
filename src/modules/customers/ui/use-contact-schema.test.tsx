import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocaleProvider, resolveMessages } from "@/core/i18n/client";

import { contactFieldsBundle } from "../contact-fields-messages";
import { useContactSchema } from "./use-contact-schema";

function Probe() {
  const schema = useContactSchema();
  const parsed = schema.safeParse({ name: "", phone: "", email: "" });
  return <p data-messages={parsed.success ? "" : parsed.error.issues.map(({ message }) => message).join("|")} />;
}

const render = (locale: "en" | "es") =>
  renderToStaticMarkup(
    <LocaleProvider locale={locale} currency="EUR" messages={resolveMessages(locale, contactFieldsBundle)}>
      <Probe />
    </LocaleProvider>,
  );

describe("useContactSchema", () => {
  it("judges the contact in the language of the screen", () => {
    expect(render("en")).toContain("Enter a name.");
    expect(render("es")).toContain("Introduce un nombre.");
  });
});
