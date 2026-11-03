import { describe, expect, it } from "vitest";

import { err, ok } from "@/core/result";

import { serializeCallResult } from "./serialize";

describe("serializeCallResult", () => {
  it("keeps only the status of a success", () => {
    expect(serializeCallResult(ok({ id: "b-1", note: "private" }))).toEqual({ status: "ok" });
  });

  it("keeps the code and the field paths of a rejected input", () => {
    const result = err("schema.invalid_input", "things.save rejected its input", { paths: ["party", "guests.0.name"] });

    expect(serializeCallResult(result)).toEqual({
      status: "error",
      code: "schema.invalid_input",
      paths: ["party", "guests.0.name"],
    });
  });

  it("drops details that are not field paths", () => {
    const result = err("bookings.table_taken", "table 4 is taken", { violations: [{ ruleId: "x" }], email: "a@b.c" });

    expect(serializeCallResult(result)).toEqual({ status: "error", code: "bookings.table_taken" });
  });

  it("drops the approval id", () => {
    const serialized = serializeCallResult({ status: "awaiting_approval", approvalId: "appr-secret-1" });

    expect(serialized).toEqual({ status: "awaiting_approval" });
    expect(JSON.stringify(serialized)).not.toContain("appr-secret-1");
  });

  it("never carries the server message", () => {
    const serialized = serializeCallResult(
      err("bookings.table_taken", "SQL: constraint tables_pk", { paths: ["table"] }),
    );

    expect(JSON.stringify(serialized)).not.toContain("constraint");
  });
});
