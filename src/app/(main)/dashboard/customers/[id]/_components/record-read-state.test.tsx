import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/core/i18n/client";
import { feedbackMessages } from "@/ds/feedback/server";

import { RecordReadState } from "./record-read-state";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => undefined }) }));

const REASON = "The service is not available right now.";

const render = (status: "error" | "forbidden") =>
  renderToStaticMarkup(
    <LocaleProvider locale="en" currency="EUR" messages={{ feedback: feedbackMessages.en }}>
      <RecordReadState state={{ status, code: "x.unavailable" }} reason={REASON} />
    </LocaleProvider>,
  );

describe("RecordReadState", () => {
  it("shows the reason and a Retry button when the customer could not be read", () => {
    const html = render("error");

    expect(html).toContain(REASON);
    expect(html).toContain(">Retry</button>");
  });

  it("shows the reason and no Retry when the read is not allowed", () => {
    const html = render("forbidden");

    expect(html).toContain(REASON);
    expect(html).not.toContain("Retry");
  });
});
