import { describe, expect, it } from "vitest";

import { contextOf, failedChecks, fixture, ok, stateFor, taskIdsOf, taskOf } from "./eval-mcp.testkit";
import { gradeTrial, needsFreshSession } from "./eval-mcp-grade";

describe("find-guest", () => {
  const task = taskOf("find-guest");
  const context = contextOf(fixture("customers", "find-guest"), "unused");

  it("passes when a read returned the guest and the answer carries the phone the server holds", () => {
    const state = stateFor(task, context, { customers_get: ok({ id: "C-ortega", phone: "+34600000102" }) });
    expect(gradeTrial(task, context, state).pass).toBe(true);
  });

  it("fails when the answer's phone is not the one the server holds", () => {
    const state = stateFor(task, context, { customers_get: ok({ id: "C-ortega", phone: "+34999999999" }) });
    expect(failedChecks(gradeTrial(task, context, state))).toEqual(["answer carries the phone"]);
  });
});

describe("the customers golden tasks (AC11)", () => {
  it("are this one, and parse", () => {
    expect(taskIdsOf("customers")).toEqual(["find-guest"]);
  });

  it("need no session without earlier eval data, since they take no tables", () => {
    expect(needsFreshSession([taskOf("find-guest")])).toBe(false);
  });
});
