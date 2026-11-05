import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AttendanceRing } from "./attendance-ring";
import { customerRecordMessages } from "./messages.server";
import { attendanceOf } from "./record-model";

const AVATAR = "avatar-child";
const render = (visits: number, noShows: number) =>
  renderToStaticMarkup(
    <AttendanceRing attendance={attendanceOf({ visits, noShows })} text={customerRecordMessages.en.header} locale="en">
      <span>{AVATAR}</span>
    </AttendanceRing>,
  );

describe("AttendanceRing", () => {
  it("draws a track and a value arc, and says the figures as a sentence", () => {
    const html = render(8, 2);

    expect(html.match(/<circle/g)).toHaveLength(2);
    expect(html).toContain("Kept 8 of 10 booked visits");
  });

  it("draws the track but no arc when only no-shows were recorded, so no dot appears at 0 %", () => {
    const html = render(0, 3);

    expect(html.match(/<circle/g)).toHaveLength(1);
    expect(html).toContain("Kept 0 of 3 booked visits");
  });

  it("draws no ring when nothing was booked, only the avatar", () => {
    const html = render(0, 0);

    expect(html).not.toContain("<svg");
    expect(html).toContain(AVATAR);
  });
});
