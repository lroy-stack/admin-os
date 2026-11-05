import { describe, expect, it } from "vitest";

import { GOLDEN, ok, ROOT, taskIdsOf, taskModules } from "./eval-mcp.testkit";
import { loadGolden } from "./eval-mcp-golden";
import {
  formatSummary,
  outcomeOfCallResult,
  outcomeOfText,
  parseEvalArgs,
  parseEvalConfig,
  parseTranscript,
  selectTasks,
  summarize,
  type TrialRecord,
} from "./eval-mcp-grade";

/** The mechanics of `npm run eval:mcp`; each module's graders are tested in `eval-mcp.<module>.test.ts`. */

describe("the golden set", () => {
  it("is golden.json merged with each installed module's task file, in module order", () => {
    expect(GOLDEN.tasks.map((task) => task.id)).toEqual(taskModules.flatMap(taskIdsOf));
  });

  // Derived from the installed modules, so removing one leaves these cases standing (ADR 0017 §7).
  it.each(taskModules)("leaves out %s's tasks when its file is not there, and keeps the version", (absent) => {
    const merged = loadGolden(
      ROOT,
      taskModules.filter((module) => module !== absent),
    );
    expect([merged.tasks.map((task) => task.id), merged.version]).toEqual([
      GOLDEN.tasks.map((task) => task.id).filter((id) => !taskIdsOf(absent).includes(id)),
      GOLDEN.version,
    ]);
  });

  it("refuses an unknown task id and names the known ones", () => {
    expect(() => selectTasks(GOLDEN, ["nope"])).toThrow(
      new RegExp(`"nope".*${GOLDEN.tasks.map((task) => task.id).join(", ")}`),
    );
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
