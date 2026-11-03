import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/core/i18n/client";

import { AwaitingApprovalNotice } from "./awaiting-approval";
import { feedbackMessages } from "./server";

const actionText = "Cancel reservation";
const roleText = "manager";
const recordText = "Reservation 12";

const render = (variant: "inline" | "record" | "toast") =>
  renderToStaticMarkup(
    <LocaleProvider locale="en" currency="EUR" messages={{ feedback: feedbackMessages.en }}>
      <AwaitingApprovalNotice variant={variant} action={actionText} role={roleText}>
        <p>{recordText}</p>
      </AwaitingApprovalNotice>
    </LocaleProvider>,
  );

describe("AwaitingApprovalNotice", () => {
  it.each(["inline", "record"] as const)("names the action and the deciding role in the %s variant", (variant) => {
    expect(render(variant)).toContain("Cancel reservation is waiting for approval from the manager role.");
  });

  it("shows the record read-only in the record variant", () => {
    const html = render("record");

    expect(html).toContain("Waiting for approval");
    expect(html).toContain("inert");
    expect(html).toContain("<p>Reservation 12</p>");
  });

  it("does not render the record in the inline variant", () => {
    expect(render("inline")).not.toContain("Reservation 12");
  });

  it("renders nothing in the toast variant, which speaks through the toast region", () => {
    expect(render("toast")).toBe("");
  });

  it("accepts no approval id, so none can reach the markup", () => {
    expect(render("record")).not.toMatch(/approval[_-]?id|ap_/i);
  });
});
