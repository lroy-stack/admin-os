import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PopoverOrSheet } from "./popover-or-sheet";

const TRIGGER = "Open";
const TITLE = "Panel name";
const BODY = "Panel body";

const render = (open?: boolean) =>
  renderToStaticMarkup(
    <PopoverOrSheet trigger={<button type="button">{TRIGGER}</button>} title={TITLE} open={open}>
      <p>{BODY}</p>
    </PopoverOrSheet>,
  );

describe("PopoverOrSheet in the server render", () => {
  it("renders the trigger as a collapsed dialog opener", () => {
    expect(render()).toBe(`<button type="button" aria-haspopup="dialog" aria-expanded="false">${TRIGGER}</button>`);
  });

  it("holds no overlay even when it is asked to be open, because the viewport is unknown", () => {
    expect(render(true)).not.toMatch(new RegExp(`role="dialog"|${BODY}|${TITLE}`));
  });
});
