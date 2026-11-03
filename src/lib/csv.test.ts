import { describe, expect, it } from "vitest";

import { type CsvColumn, toCsv } from "./csv";

type Row = { name: string; amount: number | null };
const columns: CsvColumn<Row>[] = [
  { header: "Name", value: (row) => row.name },
  { header: "Amount", value: (row) => row.amount },
];

describe("toCsv", () => {
  it("writes a header and rows with CRLF line endings and no trailing break", () => {
    const csv = toCsv(
      [
        { name: "Ana", amount: 10 },
        { name: "Luis", amount: null },
      ],
      columns,
    );

    expect(csv).toBe("Name,Amount\r\nAna,10\r\nLuis,");
  });

  it.each([
    ["a,b", '"a,b"'],
    ['say "hi"', '"say ""hi"""'],
    ["two\nlines", '"two\nlines"'],
    ["two\r\nlines", '"two\r\nlines"'],
  ])("quotes %j as RFC 4180 requires", (name, field) => {
    expect(toCsv([{ name, amount: 1 }], columns)).toBe(`Name,Amount\r\n${field},1`);
  });

  it.each(["=SUM(A1)", "+1", "-1", "@cmd", "\tx", "\rx", "\nx", "＝1", "＋1", "－1", "＠x"])(
    "neutralises the formula start of %j with a leading apostrophe inside quotes",
    (name) => {
      const csv = toCsv([{ name, amount: 1 }], columns);

      expect(csv).toBe(`Name,Amount\r\n"'${name}",1`);
    },
  );

  it("leaves a negative number alone because it is data, not text", () => {
    expect(toCsv([{ name: "Refund", amount: -5 }], columns)).toBe("Name,Amount\r\nRefund,-5");
  });

  it("guards headers like any other cell", () => {
    expect(toCsv([], [{ header: "=x", value: () => "" }])).toBe(`"'=x"`);
  });
});
