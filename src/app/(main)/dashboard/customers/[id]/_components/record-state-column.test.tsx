import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { customerDirectoryMessages } from "../../_components/messages.server";
import { customerRecordMessages } from "./messages.server";
import { RecordStateColumn } from "./record-state-column";

const render = (blocked: boolean, vip: boolean) =>
  renderToStaticMarkup(
    <RecordStateColumn
      blocked={blocked}
      vip={vip}
      text={customerRecordMessages.en.state}
      words={customerDirectoryMessages.en.card}
    />,
  );

describe("RecordStateColumn", () => {
  it("says Active for a customer who is not blocked", () => {
    const html = render(false, false);

    expect(html).toContain("Active");
    expect(html).not.toContain("Blocked");
    expect(html).not.toContain("VIP");
  });

  it("shows a Blocked pill instead of Active, and a VIP pill", () => {
    const html = render(true, true);

    expect(html).toContain("Blocked");
    expect(html).not.toContain("Active");
    expect(html).toContain("VIP");
  });
});
