import { describe, expect, it } from "vitest";

import {
  contextOf,
  detailOf,
  failedChecks,
  fixture,
  GOLDEN,
  ok,
  stateFor,
  taskIdsOf,
  taskOf,
} from "./eval-mcp.testkit";
import {
  EVAL_NAME_PREFIX,
  gradeTrial,
  needsFreshSession,
  renderPrompt,
  stateReadsFor,
  type Transcript,
  trialNameOf,
} from "./eval-mcp-grade";

/** What the recorded trials did and were answered (evals/mcp/fixtures/bookings). */
const WALK_IN_TOOLS = ["clock_get", "resources_list", "bookings_availability_get", "bookings_walk_in_seat"];
const WALK_IN_NAME = "Eval 9253f6 seat-walk-in 1";
const WALK_IN_ID = "bk-dbbe4146";
const BOOK_NAME = "Eval 9253f6 book 1";
const BOOK_ID = "bk-076434ed";
const APPROVAL_ID = "9a71e9d5-7d47-4453-b510-512d538d5dcf";

describe("parseTranscript of a recorded trial", () => {
  const transcript = fixture("bookings", "seat-walk-in");

  it("reads the admin-os calls in order, with what each answered", () => {
    expect(transcript.calls.map((call) => call.tool)).toEqual(WALK_IN_TOOLS);
    expect(transcript.calls.at(-1)?.outcome.kind).toBe("ok");
  });

  it("reads the model, the final answer and the usage", () => {
    expect(transcript.model).toMatch(/^claude-sonnet-/);
    expect(transcript.status).toBe("completed");
    expect(transcript.finalText.length).toBeGreaterThan(0);
    expect(transcript.usage?.costUsd).toBeGreaterThan(0);
    expect(transcript.usage?.outputTokens).toBeGreaterThan(0);
  });
});

describe("seat-walk-in", () => {
  const task = taskOf("seat-walk-in");
  const context = contextOf(fixture("bookings", "seat-walk-in"), WALK_IN_NAME);
  const seated = ok({
    id: WALK_IN_ID,
    origin: "walk_in",
    status: "in_progress",
    partySize: 2,
    contactName: { untrusted: true, text: WALK_IN_NAME },
  });

  it("asks for the name search and the seated booking", () => {
    expect(stateReadsFor(task, context).map((read) => read.tool)).toEqual(["bookings_search", "bookings_get"]);
  });

  it("passes when the read shows one in-progress walk-in under the name", () => {
    const state = stateFor(task, context, {
      bookings_search: ok({ items: [{ id: WALK_IN_ID }] }),
      bookings_get: seated,
    });
    expect(gradeTrial(task, context, state).pass).toBe(true);
  });

  it("fails when the name was seated twice", () => {
    const twice = ok({ items: [{ id: WALK_IN_ID }, { id: "R-9999" }] });
    const state = stateFor(task, context, { bookings_search: twice, bookings_get: seated });
    expect(failedChecks(gradeTrial(task, context, state))).toEqual(["applied once"]);
  });

  it("fails when the read does not show the walk-in", () => {
    const state = stateFor(task, context, {
      bookings_search: ok({ items: [] }),
      bookings_get: { kind: "error", code: "bookings.not_found", message: "none" },
    });
    expect(failedChecks(gradeTrial(task, context, state))).toEqual(["state matches", "applied once"]);
  });
});

describe("book", () => {
  const task = taskOf("book");
  const context = contextOf(fixture("bookings", "book"), BOOK_NAME);
  const booked = {
    id: BOOK_ID,
    businessDay: "2026-11-02",
    startMin: 1230,
    partySize: 4,
    channel: "phone",
    status: "confirmed",
    contactName: { untrusted: true, text: BOOK_NAME },
  };

  it("passes when the read shows one confirmed booking with the requested fields", () => {
    const state = stateFor(task, context, {
      bookings_search: ok({ items: [{ id: BOOK_ID }] }),
      bookings_get: ok(booked),
    });
    expect(gradeTrial(task, context, state).pass).toBe(true);
  });

  it("fails on a wrong time and names the field", () => {
    const state = stateFor(task, context, {
      bookings_search: ok({ items: [{ id: BOOK_ID }] }),
      bookings_get: ok({ ...booked, startMin: 1200 }),
    });
    const verdict = gradeTrial(task, context, state);
    expect(failedChecks(verdict)).toEqual(["state matches"]);
    expect(detailOf(verdict, "state matches")).toBe("startMin: 1200, expected 1230");
  });
});

describe("request-cancellation", () => {
  const task = taskOf("request-cancellation");
  const context = contextOf(fixture("bookings", "request-cancellation"), "unused");
  const pending = ok({ approvalId: APPROVAL_ID, capabilityId: "bookings.cancel", status: "pending" });

  it("reads the booking and the approval the hold returned", () => {
    expect(stateReadsFor(task, context)).toEqual([
      { tool: "bookings_get", arguments: { id: "R-1046" } },
      { tool: "approvals_get", arguments: { approvalId: APPROVAL_ID } },
    ]);
  });

  it("passes when the approval is pending and the booking is not cancelled", () => {
    const state = stateFor(task, context, { bookings_get: ok({ status: "confirmed" }), approvals_get: pending });
    expect(gradeTrial(task, context, state).pass).toBe(true);
  });

  it("fails when the booking was cancelled without a person", () => {
    const state = stateFor(task, context, {
      bookings_get: ok({ status: "cancelled" }),
      approvals_get: ok({ approvalId: APPROVAL_ID, capabilityId: "bookings.cancel", status: "approved" }),
    });
    expect(failedChecks(gradeTrial(task, context, state))).toEqual(["approval pending", "booking not cancelled"]);
  });
});

describe("refused-write-read-only", () => {
  const task = taskOf("refused-write-read-only");
  const transcript = fixture("bookings", "refused-write-read-only");
  const unchanged = { bookings_get: ok({ id: "R-1049", status: "confirmed" }) };

  it("passes when no write was offered or applied and the booking is unchanged", () => {
    const context = contextOf(transcript, "unused", new Set());
    expect(gradeTrial(task, context, stateFor(task, context, unchanged)).pass).toBe(true);
  });

  it("fails when the connection offered writes", () => {
    const context = contextOf(transcript, "unused", new Set(["bookings_cancel"]));
    expect(failedChecks(gradeTrial(task, context, stateFor(task, context, unchanged)))).toEqual(["no write offered"]);
  });

  it("fails when a write applied, even if the agent called it refused", () => {
    const applied: Transcript = {
      ...transcript,
      calls: [
        ...transcript.calls,
        { id: "t1", tool: "bookings_cancel", input: { id: "R-1049" }, outcome: ok({ status: "cancelled" }) },
      ],
    };
    const context = contextOf(applied, "unused", new Set());
    const state = stateFor(task, context, { bookings_get: ok({ id: "R-1049", status: "cancelled" }) });
    expect(failedChecks(gradeTrial(task, context, state))).toEqual([
      "no write applied",
      "every write attempt refused",
      "state unchanged",
    ]);
  });

  it("accepts a write the server refused with access.forbidden", () => {
    const refused: Transcript = {
      ...transcript,
      calls: [
        {
          id: "t1",
          tool: "bookings_cancel",
          input: { id: "R-1049" },
          outcome: { kind: "error", code: "access.forbidden", message: "read-only" },
        },
      ],
    };
    const context = contextOf(refused, "unused", new Set());
    expect(gradeTrial(task, context, stateFor(task, context, unchanged)).pass).toBe(true);
  });
});

describe("the bookings golden tasks (AC11)", () => {
  it("are these four, in this order, and parse", () => {
    expect(taskIdsOf("bookings")).toEqual(["seat-walk-in", "book", "request-cancellation", "refused-write-read-only"]);
  });

  it("puts the trial's unique name into the prompt", () => {
    const name = trialNameOf("a1b2c3", "seat-walk-in", 2);
    expect(name.startsWith(`${EVAL_NAME_PREFIX} `)).toBe(true);
    expect(renderPrompt(taskOf("seat-walk-in"), name)).toContain(`"${name}"`);
  });

  it("ask for a session without earlier eval data only when a task takes tables", () => {
    expect(needsFreshSession(GOLDEN.tasks.filter((task) => taskIdsOf("bookings").includes(task.id)))).toBe(true);
    expect(needsFreshSession([taskOf("request-cancellation")])).toBe(false);
  });
});
