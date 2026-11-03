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
  it("adds no live region of its own inside sonner's", () => {
    expect(render("en")).not.toMatch(/role="status"|aria-live/);
  });

  it("hides the changing countdown text from assistive technology", () => {
    expect(render("en")).toContain(
      '<p aria-hidden="true" class="text-muted-foreground text-xs tabular-nums">10 seconds left to undo</p>',
    );
  });

  it("starts with the Undo button enabled", () => {
    expect(render("en")).not.toContain('disabled=""');
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
    expect(render("en")).toContain('<div class="bg-muted h-1 w-full rounded-full" aria-hidden="true">');
  });

  it.each([0, -5, Number.NaN])("falls back to the default window for a duration of %s", (durationMs) => {
    const html = renderToStaticMarkup(
      <UndoToastContent
        message={message}
        durationMs={durationMs}
        labels={feedbackMessages.en.undo}
        locale="en"
        onUndo={() => undefined}
        onExpire={() => undefined}
      />,
    );

    expect(html).toContain("10 seconds left to undo");
    expect(html).not.toContain("NaN");
  });
});
