import { describe, expect, it } from "vitest";

import type { ActionOutcome } from "./outcome";
import {
  describedBy,
  fieldDomIds,
  fieldName,
  flattenFieldErrors,
  IDLE_STATUS,
  planOutcome,
  registeredFieldNames,
  routeIssues,
  statusAfter,
} from "./window-form-state";

const known =
  (...names: string[]) =>
  (name: string) =>
    names.includes(name);

describe("fieldName", () => {
  it.each([
    [["name"], "name"],
    [["guests", 0, "name"], "guests.0.name"],
    [[], ""],
  ])("joins %j as %j", (path, expected) => {
    expect(fieldName(path)).toBe(expected);
  });
});

describe("flattenFieldErrors", () => {
  it("reads leaf messages by path in tree order", () => {
    const errors = { name: { type: "too_small", message: "Required" }, phone: { type: "x", message: "Bad" } };

    expect(flattenFieldErrors(errors)).toEqual([
      { path: ["name"], message: "Required" },
      { path: ["phone"], message: "Bad" },
    ]);
  });

  it("walks nested objects and arrays with numeric indexes", () => {
    const errors = { guests: [undefined, { name: { type: "x", message: "Required" } }] };

    expect(flattenFieldErrors(errors)).toEqual([{ path: ["guests", 1, "name"], message: "Required" }]);
  });

  it("puts a root error of an array on the array's own path", () => {
    const errors = { guests: { root: { type: "too_small", message: "Add a guest" } } };

    expect(flattenFieldErrors(errors)).toEqual([{ path: ["guests"], message: "Add a guest" }]);
  });

  it.each([[undefined], [null], [{}], ["text"]])("finds nothing in %j", (errors) => {
    expect(flattenFieldErrors(errors)).toEqual([]);
  });
});

describe("registeredFieldNames", () => {
  it("lists fields that carry a registration, nested and in order", () => {
    const fields = { name: { _f: {} }, guests: [{ name: { _f: {} } }, { name: { _f: {} } }], note: { _f: {} } };

    expect(registeredFieldNames(fields)).toEqual(["name", "guests.0.name", "guests.1.name", "note"]);
  });

  it("returns nothing for an empty tree", () => {
    expect(registeredFieldNames({})).toEqual([]);
  });
});

describe("routeIssues", () => {
  it("puts an issue on its field", () => {
    const routed = routeIssues([{ path: ["email"], message: "Taken" }], known("email"));

    expect(routed).toEqual({ fields: [{ name: "email", message: "Taken" }], formError: null, focus: "email" });
  });

  it("turns an issue with no field into the form error instead of losing it", () => {
    const routed = routeIssues([{ path: ["ghost"], message: "Unknown" }], known("email"));

    expect(routed).toEqual({ fields: [], formError: "Unknown", focus: null });
  });

  it("treats an issue with an empty path as a form error", () => {
    const routed = routeIssues([{ path: [], message: "Check the details" }], known("email"));

    expect(routed.formError).toBe("Check the details");
  });

  it("splits a mix and states each form-level message once", () => {
    const routed = routeIssues(
      [
        { path: ["email"], message: "Taken" },
        { path: ["x"], message: "Invalid" },
        { path: ["y"], message: "Invalid" },
      ],
      known("email"),
    );

    expect(routed.fields).toEqual([{ name: "email", message: "Taken" }]);
    expect(routed.formError).toBe("Invalid");
  });

  it("keeps the first message of a field", () => {
    const routed = routeIssues(
      [
        { path: ["email"], message: "First" },
        { path: ["email"], message: "Second" },
      ],
      known("email"),
    );

    expect(routed.fields).toEqual([{ name: "email", message: "First" }]);
  });

  it("focuses the field that renders first, not the one listed first", () => {
    const routed = routeIssues(
      [
        { path: ["phone"], message: "Bad" },
        { path: ["name"], message: "Required" },
      ],
      known("name", "phone"),
      ["name", "phone"],
    );

    expect(routed.focus).toBe("name");
  });

  it("falls back to issue order when render order is unknown", () => {
    const routed = routeIssues(
      [
        { path: ["phone"], message: "Bad" },
        { path: ["name"], message: "Required" },
      ],
      known("name", "phone"),
    );

    expect(routed.focus).toBe("phone");
  });

  it("matches nested paths by their joined name", () => {
    const routed = routeIssues([{ path: ["guests", 0, "name"], message: "Required" }], known("guests.0.name"));

    expect(routed.focus).toBe("guests.0.name");
  });
});

describe("planOutcome", () => {
  const plan = (outcome: ActionOutcome<string> | null) => planOutcome(outcome, known("email"), ["email"]);

  it("does nothing for a refused submit", () => {
    expect(plan(null)).toEqual({ kind: "none" });
  });

  it("hands the value of ok on", () => {
    expect(plan({ status: "ok", value: "saved" })).toEqual({ kind: "done", value: "saved" });
  });

  it("routes invalid issues", () => {
    expect(plan({ status: "invalid", issues: [{ path: ["email"], message: "Taken" }] })).toEqual({
      kind: "issues",
      fields: [{ name: "email", message: "Taken" }],
      formError: null,
      focus: "email",
    });
  });

  it("carries the text of an error", () => {
    expect(plan({ status: "error", text: "Table is locked", code: "x" })).toEqual({
      kind: "error",
      text: "Table is locked",
    });
  });

  it("holds for approval", () => {
    expect(plan({ status: "awaiting_approval" })).toEqual({ kind: "awaiting" });
  });
});

describe("statusAfter", () => {
  it("shows the error text and clears the hold", () => {
    expect(statusAfter({ formError: null, awaiting: true }, { kind: "error", text: "Boom" })).toEqual({
      formError: "Boom",
      awaiting: false,
    });
  });

  it("shows the form-level part of issues", () => {
    expect(statusAfter(IDLE_STATUS, { kind: "issues", fields: [], formError: "Invalid", focus: null })).toEqual({
      formError: "Invalid",
      awaiting: false,
    });
  });

  it("clears the form error when every issue found a field", () => {
    const plan = { kind: "issues", fields: [{ name: "a", message: "m" }], formError: null, focus: "a" } as const;

    expect(statusAfter({ formError: "Old", awaiting: false }, plan).formError).toBeNull();
  });

  it("marks the form as held without an error", () => {
    expect(statusAfter({ formError: "Old", awaiting: false }, { kind: "awaiting" })).toEqual({
      formError: null,
      awaiting: true,
    });
  });

  it.each([[{ kind: "none" }], [{ kind: "done", value: 1 }]] as const)("leaves the status as it was for %j", (plan) => {
    const previous = { formError: "Old", awaiting: false };

    expect(statusAfter(previous, plan)).toBe(previous);
  });
});

describe("field ids", () => {
  const ids = fieldDomIds("f1");

  it("derives distinct ids from the field id", () => {
    expect(ids).toEqual({ description: "f1-description", error: "f1-error" });
  });

  it.each([
    [{ hasDescription: false, invalid: false }, undefined],
    [{ hasDescription: true, invalid: false }, "f1-description"],
    [{ hasDescription: false, invalid: true }, "f1-error"],
    [{ hasDescription: true, invalid: true }, "f1-description f1-error"],
  ])("describes a control for %j", (state, expected) => {
    expect(describedBy(ids, state)).toBe(expected);
  });
});
