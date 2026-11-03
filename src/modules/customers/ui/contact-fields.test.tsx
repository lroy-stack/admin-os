import { renderToStaticMarkup } from "react-dom/server";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALES } from "@/core/i18n";
import { LocaleProvider, resolveMessages } from "@/core/i18n/client";

import { contactFieldsBundle, contactFieldsMessages } from "../contact-fields-messages";
import { ContactFields } from "./contact-fields";
import { type ContactFormInput, type ContactFormValues, EMPTY_CONTACT } from "./contact-form";

// "Name" is the same word in English and German.
const SAME_IN_EN_AND_DE = ["name.label"];

function Harness({ readOnly = false }: { readOnly?: boolean }) {
  const { control } = useForm<ContactFormInput, unknown, ContactFormValues>({ defaultValues: EMPTY_CONTACT });
  return (
    <form>
      <ContactFields control={control} readOnly={readOnly} />
    </form>
  );
}

const render = (locale: (typeof LOCALES)[number], readOnly = false) =>
  renderToStaticMarkup(
    <LocaleProvider locale={locale} currency="EUR" messages={resolveMessages(locale, contactFieldsBundle)}>
      <Harness readOnly={readOnly} />
    </LocaleProvider>,
  );

describe("contact fields dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(contactFieldsMessages, SAME_IN_EN_AND_DE)).not.toThrow();
  });
});

describe("ContactFields", () => {
  it.each(LOCALES)("labels name, phone and email in %s", (locale) => {
    const html = render(locale);

    expect(html).toContain(`>${contactFieldsMessages[locale].name.label}</label>`);
    expect(html).toContain(`>${contactFieldsMessages[locale].phone.label}</label>`);
    expect(html).toContain(`>${contactFieldsMessages[locale].email.label}</label>`);
  });

  it("describes the phone with its hint, linked by aria-describedby", () => {
    const html = render("en");

    expect(html).toContain(contactFieldsMessages.en.phone.hint);
    expect(html).toMatch(/type="tel"[^>]*aria-describedby="[^"]+-description"/);
  });

  it("uses the keyboards of a phone and an email", () => {
    const html = render("en");

    expect(html).toContain('type="tel"');
    expect(html).toContain('type="email"');
  });

  it("renders every field read-only while held for approval", () => {
    expect(render("en", true).match(/readOnly=""/g)).toHaveLength(3);
  });
});
