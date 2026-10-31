import { describe, expect, it } from "vitest";

import { DEFAULT_MAIL_LAYOUT, parseMailLayout } from "./mail-layout-config";

describe("parseMailLayout", () => {
  it("keeps a valid saved split", () => {
    expect(parseMailLayout("[30,70]")).toEqual([30, 70]);
  });

  it.each([[undefined], ["not json"], ["[30]"], ['{"a":1}'], ["[30,700]"], ['["30","70"]']])(
    "falls back to the default for %j instead of crashing the page",
    (raw) => {
      expect(parseMailLayout(raw)).toEqual([...DEFAULT_MAIL_LAYOUT]);
    },
  );
});
