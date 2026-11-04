import { describe, expect, it } from "vitest";

import {
  EVAL_NAME_PREFIX,
  formatSummary,
  type GoldenTask,
  type GradeContext,
  goldenSchema,
  gradeTrial,
  needsFreshSession,
  type Outcome,
  outcomeOfCallResult,
  outcomeOfText,
  parseEvalArgs,
  parseEvalConfig,
  parseTranscript,
  readKeyOf,
  renderPrompt,
  type StateRead,
  type StateReads,
  selectTasks,
  stateReadsFor,
  summarize,
  type Transcript,
  type TrialRecord,
  trialNameOf,
  type Verdict,
} from "./eval-mcp-grade";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The graders over transcripts recorded by `npm run eval:mcp` (Sonnet, 2026-11-04), trimmed to what the graders
 * read: tool calls, tool results, the final answer and the usage. The state each test feeds a grader is what the
 * follow-up reads answered on that run, or a variation of it that must fail.
 */

const ROOT = join(import.meta.dirname, "..");
const GOLDEN = goldenSchema.parse(JSON.parse(readFileSync(join(ROOT, "evals/mcp/golden.json"), "utf8")));
const fixture = (name: string): Transcript =>
  parseTranscript(readFileSync(join(ROOT, "evals/mcp/fixtures", `${name}.jsonl`), "utf8").split("\n"));
const taskOf = (id: string): GoldenTask => selectTasks(GOLDEN, [id])[0] as GoldenTask;

/** The write tools of the read-write server, as `tools/list` marks them (`readOnlyHint` false). */
const WRITE_TOOLS: ReadonlySet<string> = new Set([
  "bookings_cancel",
  "bookings_create",
  "bookings_no_show_mark",
  "bookings_reschedule",
  "bookings_staff_note_add",
  "bookings_status_advance",
  "bookings_table_assign",
  "bookings_walk_in_seat",
  "customers_block",
  "customers_contact_update",
  "customers_create",
  "customers_notes_add",
  "customers_unblock",
  "notifications_read",
  "notifications_read_all",
]);

const contextOf = (transcript: Transcript, name: string, offeredWrites: ReadonlySet<string> = WRITE_TOOLS) =>
  ({ transcript, name, writeTools: WRITE_TOOLS, offeredWrites }) satisfies GradeContext;

/** The follow-up reads a grader asks for, each answered by the tool's entry in `answers`. */
const stateFor = (task: GoldenTask, context: GradeContext, answers: Readonly<Record<string, Outcome>>): StateReads =>
  new Map(
    stateReadsFor(task, context).map((read: StateRead) => [
      readKeyOf(read),
      answers[read.tool] ?? { kind: "no_result" },
    ]),
  );

const ok = (value: unknown): Outcome => ({ kind: "ok", value });
const failedChecks = (verdict: Verdict): string[] =>
  verdict.checks.filter((item) => !item.pass).map((item) => item.name);
const detailOf = (verdict: Verdict, name: string): string | undefined =>
  verdict.checks.find((item) => item.name === name)?.detail;

/** What the recorded trials did and were answered (evals/mcp/fixtures). */
const WALK_IN_TOOLS = ["clock_get", "resources_list", "bookings_availability_get", "bookings_walk_in_seat"];
const WALK_IN_NAME = "Eval 9253f6 seat-walk-in 1";
const WALK_IN_ID = "bk-dbbe4146";
const BOOK_NAME = "Eval 9253f6 book 1";
const BOOK_ID = "bk-076434ed";
const APPROVAL_ID = "9a71e9d5-7d47-4453-b510-512d538d5dcf";

describe("the golden set", () => {
  it("covers the five tasks of AC11 and parses", () => {
    expect(GOLDEN.tasks.map((task) => task.id)).toEqual([
      "find-guest",
      "seat-walk-in",
      "book",
      "request-cancellation",
      "refused-write-read-only",
    ]);
  });

  it("puts the trial's unique name into the prompt", () => {
    const name = trialNameOf("a1b2c3", "seat-walk-in", 2);
    expect(name.startsWith(`${EVAL_NAME_PREFIX} `)).toBe(true);
    expect(renderPrompt(taskOf("seat-walk-in"), name)).toContain(`"${name}"`);
  });

  it("refuses an unknown task id and names the known ones", () => {
    expect(() => selectTasks(GOLDEN, ["nope"])).toThrow(/"nope".*find-guest/);
  });
});

describe("parseEvalConfig", () => {
  it("defaults to the local Workers, Sonnet and three trials", () => {
    expect(parseEvalConfig({})).toEqual({
      writeUrl: "http://localhost:8789/mcp",
      writeToken: "eval-owner-0001",
      readUrl: "http://localhost:8790/mcp",
      readToken: "demo-owner-token",
      model: "sonnet",
      trials: 3,
      tasks: [],
      trialTimeoutMs: 300_000,
      maxBudgetUsd: 1,
    });
  });

  it("reads the task list and treats an empty value as unset", () => {
    expect(parseEvalConfig({ EVAL_TASKS: "book, find-guest", EVAL_TRIALS: " " })).toMatchObject({
      tasks: ["book", "find-guest"],
      trials: 3,
    });
  });

  it("names the variable that is malformed", () => {
    expect(() => parseEvalConfig({ EVAL_TRIALS: "many" })).toThrow(/^EVAL_TRIALS /);
  });
});

describe("parseEvalArgs", () => {
  it("runs live without arguments and re-grades a named results file", () => {
    expect(parseEvalArgs([])).toEqual({ regrade: undefined });
    expect(parseEvalArgs(["--regrade", "evals/mcp/results/a.json"])).toEqual({ regrade: "evals/mcp/results/a.json" });
  });

  it("refuses anything else with the usage", () => {
    expect(() => parseEvalArgs(["--regrade"])).toThrow(/^Usage: npm run eval:mcp/);
    expect(() => parseEvalArgs(["book"])).toThrow(/^Usage: npm run eval:mcp/);
  });
});

describe("needsFreshSession", () => {
  it("asks for a session without earlier eval data only when a task takes tables", () => {
    expect(needsFreshSession(GOLDEN.tasks)).toBe(true);
    expect(needsFreshSession([taskOf("request-cancellation"), taskOf("find-guest")])).toBe(false);
  });
});

describe("outcomeOfText", () => {
  it.each([
    ['{"id":"R-1"}', false, { kind: "ok", value: { id: "R-1" } }],
    // Claude Code shows the model the structured content as JSON when a result has one (recorded 2026-11-04).
    ['{"status":"awaiting_approval","approvalId":"apr-2"}', false, { kind: "awaiting_approval", approvalId: "apr-2" }],
    [
      '{"code":"access.forbidden","message":"read-only"}',
      true,
      { kind: "error", code: "access.forbidden", message: "read-only" },
    ],
    [
      "awaiting_approval: held for a person to approve (approvalId apr-1). Do not retry.",
      false,
      { kind: "awaiting_approval", approvalId: "apr-1" },
    ],
    [
      'access.forbidden: Tool "bookings_cancel" changes data.',
      true,
      { kind: "error", code: "access.forbidden", message: 'Tool "bookings_cancel" changes data.' },
    ],
    [
      "Error: HTTP 403 insufficient_scope",
      true,
      { kind: "error", code: "insufficient_scope", message: "Error: HTTP 403 insufficient_scope" },
    ],
    ["Something broke", true, { kind: "error", code: "unknown", message: "Something broke" }],
    ["plain words", false, { kind: "ok", value: "plain words" }],
  ] as const)("reads %j", (text, isError, outcome) => {
    expect(outcomeOfText(text, isError)).toEqual(outcome);
  });
});

describe("outcomeOfCallResult", () => {
  it("prefers the structured content", () => {
    expect(outcomeOfCallResult({ structuredContent: { status: "awaiting_approval", approvalId: "apr-9" } })).toEqual({
      kind: "awaiting_approval",
      approvalId: "apr-9",
    });
    expect(
      outcomeOfCallResult({ isError: true, structuredContent: { code: "bookings.not_found", message: "No R-0" } }),
    ).toEqual({ kind: "error", code: "bookings.not_found", message: "No R-0" });
    expect(outcomeOfCallResult({ structuredContent: { id: "C-1" } })).toEqual(ok({ id: "C-1" }));
  });

  it("falls back to the text when there is no structured content", () => {
    expect(outcomeOfCallResult({ content: [{ type: "text", text: '{"items":[]}' }] })).toEqual(ok({ items: [] }));
  });
});

describe("parseTranscript", () => {
  const transcript = fixture("seat-walk-in");

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

  it("is incomplete without a result event and skips lines that are not JSON", () => {
    expect(parseTranscript(["not json", '{"type":"system","subtype":"init","model":"m"}'])).toEqual({
      model: "m",
      billedModels: [],
      calls: [],
      finalText: "",
      usage: undefined,
      status: "incomplete",
    });
  });
});

describe("find-guest", () => {
  const task = taskOf("find-guest");
  const context = contextOf(fixture("find-guest"), "unused");

  it("passes when a read returned the guest and the answer carries the phone the server holds", () => {
    const state = stateFor(task, context, { customers_get: ok({ id: "C-ortega", phone: "+34600000102" }) });
    expect(gradeTrial(task, context, state).pass).toBe(true);
  });

  it("fails when the answer's phone is not the one the server holds", () => {
    const state = stateFor(task, context, { customers_get: ok({ id: "C-ortega", phone: "+34999999999" }) });
    expect(failedChecks(gradeTrial(task, context, state))).toEqual(["answer carries the phone"]);
  });
});

describe("seat-walk-in", () => {
  const task = taskOf("seat-walk-in");
  const context = contextOf(fixture("seat-walk-in"), WALK_IN_NAME);
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
  const context = contextOf(fixture("book"), BOOK_NAME);
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
  const context = contextOf(fixture("request-cancellation"), "unused");
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
  const transcript = fixture("refused-write-read-only");
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

describe("summarize", () => {
  const usage = {
    costUsd: 0.5,
    inputTokens: 10,
    outputTokens: 20,
    cacheReadInputTokens: 30,
    cacheCreationInputTokens: 40,
    numTurns: 2,
    durationMs: 1000,
  };
  const passed = { pass: true, checks: [] };
  const failed = { pass: false, checks: [{ name: "x", pass: false, detail: "" }] };
  const records: TrialRecord[] = [
    { taskId: "a", trial: 1, verdict: passed, usage },
    { taskId: "a", trial: 2, verdict: failed, usage },
    { taskId: "b", trial: 1, verdict: passed, usage: undefined },
  ];

  it("gives pass rates per task and overall, and the usage totals", () => {
    expect(summarize(records)).toEqual({
      tasks: [
        { taskId: "a", passed: 1, trials: 2, passRate: 0.5 },
        { taskId: "b", passed: 1, trials: 1, passRate: 1 },
      ],
      passed: 2,
      trials: 3,
      passRate: 2 / 3,
      costUsd: 1,
      inputTokens: 20,
      outputTokens: 40,
      cacheReadInputTokens: 60,
      cacheCreationInputTokens: 80,
    });
  });

  it("prints a table with the overall row and the model", () => {
    const text = formatSummary(summarize(records), "claude-sonnet-x");
    expect(text).toContain("| a | 1/2 | 50% |");
    expect(text).toContain("| **overall** | 2/3 | 67% |");
    expect(text).toContain("Model: claude-sonnet-x. Cost reported by Claude Code: $1.0000.");
  });
});
