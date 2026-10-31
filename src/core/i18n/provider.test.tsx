import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocaleProvider, messageKey, useLocale, useMessages } from "./client";

const registered = messageKey<{ title: string }>("registered");
const missing = messageKey<{ title: string }>("missing");

function Title({ messageKeyToRead }: { messageKeyToRead: typeof registered }) {
  return <p lang={useLocale()}>{useMessages(messageKeyToRead).title}</p>;
}

const render = (key: typeof registered) =>
  renderToStaticMarkup(
    <LocaleProvider locale="de" messages={{ registered: { title: "Hallo" } }}>
      <Title messageKeyToRead={key} />
    </LocaleProvider>,
  );

describe("useMessages", () => {
  it("reads the namespace the server resolved, with the active locale", () => {
    expect(render(registered)).toBe('<p lang="de">Hallo</p>');
  });

  it("throws for a namespace the layout did not register", () => {
    expect(() => render(missing)).toThrow('No messages for "missing"');
  });

  it("throws outside a LocaleProvider", () => {
    expect(() => renderToStaticMarkup(<Title messageKeyToRead={registered} />)).toThrow("Missing LocaleProvider");
  });
});
