import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { feedbackMessages } from "./server";
import { UndoToastContent } from "./undo-toast";

const message = "Reservation cancelled";

const render = (locale: "en" | "fr") =>
  renderToStaticMarkup(
    <UndoToastContent
      message={message}
      labels={feedbackMessages[locale].undo}
      locale={locale}
      onUndo={() => undefined}
      onExpire={() => undefined}
    />,
  );

describe("UndoToastContent", () => {
  it("is a polite live region", () => {
    expect(render("en")).toContain('role="status" aria-live="polite"');
  });

  it("shows the message, an Undo button and the seconds left", () => {
    const html = render("en");

    expect(html).toContain("Reservation cancelled");
    expect(html).toContain(">Undo</button>");
    expect(html).toContain("10 seconds left to undo");
  });

  it("speaks the active language", () => {
    expect(render("fr")).toContain(">Annuler</button>");
  });

  it("animates the bar only when motion is allowed", () => {
    const html = render("en");

    expect(html).toContain("motion-safe:transition-[width]");
    expect(html).not.toMatch(/(?<!motion-safe:)transition-\[width\]/);
  });

  it("hides the decorative bar from assistive technology", () => {
    expect(render("en")).toContain('aria-hidden="true"');
  });
});
