import type { ReactNode } from "react";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/core/i18n/client";
import type { ReadStatus } from "@/core/result";

import { ReadState } from "./read-state";
import { feedbackMessages } from "./server";

const reasonText = "The service is not available right now.";
const emptyTitleText = "No reservations yet";
const readyText = "Ready content";
const actionLabel = "Add one";

const render = (state: ReadStatus, extra: { onRetry?: () => void; emptyAction?: ReactNode } = {}) =>
  renderToStaticMarkup(
    <LocaleProvider locale="en" currency="EUR" messages={{ feedback: feedbackMessages.en }}>
      <ReadState state={state} reason={reasonText} emptyTitle={emptyTitleText} {...extra}>
        <p>{readyText}</p>
      </ReadState>
    </LocaleProvider>,
  );

describe("ReadState", () => {
  it("renders a labelled skeleton while loading", () => {
    const html = render({ status: "loading" });

    expect(html).toContain('<span class="sr-only">Loading</span>');
    expect(html).toContain('data-slot="skeleton"');
    expect(html).not.toContain(readyText);
  });

  it("renders the error text and a Retry button", () => {
    const html = render({ status: "error", code: "x.unavailable" }, { onRetry: () => undefined });

    expect(html).toContain('role="alert"');
    expect(html).toContain(reasonText);
    expect(html).toContain(">Retry</button>");
  });

  it("omits Retry when the caller gives no handler", () => {
    expect(render({ status: "error", code: "x.unavailable" })).not.toContain("Retry");
  });

  it("renders the reason without Retry when forbidden", () => {
    const html = render({ status: "forbidden", code: "access.forbidden" });

    expect(html).toContain("You do not have access");
    expect(html).toContain(reasonText);
    expect(html).not.toContain("Retry");
  });

  it("renders the caller's title and action when empty", () => {
    const html = render({ status: "empty" }, { emptyAction: <a href="/new">{actionLabel}</a> });

    expect(html).toContain(emptyTitleText);
    expect(html).toContain('<a href="/new">Add one</a>');
    expect(html).not.toContain('role="alert"');
  });

  it("renders the children when ready", () => {
    expect(render({ status: "ready" })).toBe(`<p>${readyText}</p>`);
  });
});
