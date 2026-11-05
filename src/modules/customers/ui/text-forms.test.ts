import { describe, expect, it } from "vitest";

import { blockFormSchema, NOTE_MAX_LENGTH, noteFormSchema, REASON_MAX_LENGTH } from "./text-forms";

const text = { note: { invalid: "Enter a note." }, block: { invalid: "Enter a reason." } };

describe("the note and block forms", () => {
  it("trims the note", () => {
    expect(noteFormSchema(text.note.invalid).parse({ text: "  Allergic to nuts  " })).toEqual({
      text: "Allergic to nuts",
    });
  });

  it("asks for a note with the dictionary sentence", () => {
    const result = noteFormSchema(text.note.invalid).safeParse({ text: "   " });
    expect(result.error?.issues[0]?.message).toBe(text.note.invalid);
  });

  it("asks for a reason with the dictionary sentence", () => {
    const result = blockFormSchema(text.block.invalid).safeParse({ text: "" });
    expect(result.error?.issues[0]?.message).toBe(text.block.invalid);
  });

  it("refuses a reason longer than the capability takes, and a note too", () => {
    expect(blockFormSchema(text.block.invalid).safeParse({ text: "x".repeat(501) }).success).toBe(false);
    expect(noteFormSchema(text.note.invalid).safeParse({ text: "x".repeat(2001) }).success).toBe(false);
    expect(noteFormSchema(text.note.invalid).safeParse({ text: "x".repeat(2000) }).success).toBe(true);
  });
});

describe("the longest note and reason a textarea accepts", () => {
  it.each([
    ["note", NOTE_MAX_LENGTH, 2000],
    ["reason", REASON_MAX_LENGTH, 500],
  ])("caps a %s at the capability's own limit", (_field, limit, expected) => {
    expect(limit).toBe(expected);
  });
});
