import type { ComponentProps } from "react";

import { renderToStaticMarkup } from "react-dom/server";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/core/i18n/client";

import { AwaitingApprovalNotice, notifyAwaitingApproval } from "./awaiting-approval";
import { feedbackMessages } from "./server";

vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));

const actionText = "Cancel reservation";
const roleText = "manager";
const recordText = "Reservation 12";

const render = (variant: "inline" | "record") =>
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

  it("shows the record as the consumer passes it, readable by assistive technology", () => {
    const html = render("record");

    expect(html).toContain("Waiting for approval");
    expect(html).toContain("<p>Reservation 12</p>");
    expect(html).not.toMatch(/inert|aria-disabled/);
  });

  it("does not render the record in the inline variant", () => {
    expect(render("inline")).not.toContain("Reservation 12");
  });

  it("accepts no approval id, so none can reach the markup", () => {
    const props: ComponentProps<typeof AwaitingApprovalNotice> = {
      variant: "inline",
      action: actionText,
      role: roleText,
      // @ts-expect-error the notice takes no approval id
      approvalId: "ap_secret_1",
    };

    const html = renderToStaticMarkup(
      <LocaleProvider locale="en" currency="EUR" messages={{ feedback: feedbackMessages.en }}>
        <AwaitingApprovalNotice {...props} />
      </LocaleProvider>,
    );

    expect(html).not.toContain("ap_secret_1");
  });
});

describe("notifyAwaitingApproval", () => {
  beforeEach(() => {
    vi.mocked(toast.info).mockClear();
  });

  it("shows one info toast naming the action and the role", () => {
    notifyAwaitingApproval({ action: actionText, role: roleText, labels: feedbackMessages.en.approval, locale: "en" });

    expect(toast.info).toHaveBeenCalledExactlyOnceWith(
      "Cancel reservation is waiting for approval from the manager role.",
      {
        id: "awaiting-approval:Cancel reservation:manager",
      },
    );
  });
});
