/**
 * The pure half of `npm run eval:mcp` (spec 004, AC11): the golden set's shape, reading a headless Claude Code
 * transcript (`--output-format stream-json`), the graders and the pass-rate summary. Graders judge what the tools
 * answered and what a follow-up read of the server shows, never what the model says it did. Nothing here needs a
 * server or a model, so the graders are tested over recorded transcripts (`evals/mcp/fixtures`).
 */
import { z } from "zod";

/** The server's key in the eval's MCP config; Claude Code names its tools `mcp__<key>__<tool>`. */
export const SERVER_KEY = "admin-os";
const TOOL_PREFIX = `mcp__${SERVER_KEY}__`;

/** Every name an eval writes starts with this, so a later run can tell the session already holds eval data. */
export const EVAL_NAME_PREFIX = "Eval";

const businessDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const expectSchema = z.discriminatedUnion("kind", [
  /** A read task: the guest's record was found and the answer carries their phone number. */
  z.strictObject({ kind: z.literal("find_guest"), customerId: z.string().min(1) }),
  /** A walk-in seated once, now, under the task's name. */
  z.strictObject({ kind: z.literal("walk_in"), partySize: z.number().int().positive() }),
  /** A booking created once, under the task's name, with these fields. */
  z.strictObject({
    kind: z.literal("booking"),
    businessDay: businessDaySchema,
    startMin: z.number().int().min(0).max(1440),
    partySize: z.number().int().positive(),
    channel: z.string().min(1),
  }),
  /** A cancellation requested once, held for a person, and the booking not cancelled. */
  z.strictObject({ kind: z.literal("cancellation_held"), bookingId: z.string().min(1) }),
  /** A write asked of a read-only connection: none is offered, none applies, the booking keeps `status`. */
  z.strictObject({ kind: z.literal("write_refused"), bookingId: z.string().min(1), status: z.string().min(1) }),
]);

export type Expectation = z.infer<typeof expectSchema>;

const taskSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** `write`: the private token with writes; `read`: a public, read-only token. */
  endpoint: z.enum(["write", "read"]),
  /** The person's request; `{{name}}` becomes a name unique to the trial. */
  prompt: z.string().min(1),
  expect: expectSchema,
});

export type GoldenTask = z.infer<typeof taskSchema>;

/** `evals/mcp/golden.json`: the kernel's part of the set, and any task about a kernel tool. */
export const goldenFileSchema = z.strictObject({
  /** Bump when a prompt or an expectation changes, so results from different sets are never compared. */
  version: z.string().min(1),
  /** Appended to Claude Code's system prompt for every trial. */
  appendSystemPrompt: z.string().min(1),
  tasks: z.array(taskSchema).default([]),
});

/** `evals/mcp/tasks/<module>.json`: the tasks one module owns (ADR 0017 §7). */
export const taskFileSchema = z.strictObject({ tasks: z.array(taskSchema).min(1) });

export const goldenSchema = goldenFileSchema.extend({ tasks: z.array(taskSchema).min(1) });

export type GoldenSet = z.infer<typeof goldenSchema>;

/** The golden set of the installed modules: the kernel's tasks, then each present task file's, in the order given. */
export function mergeGolden(base: unknown, taskFiles: readonly unknown[]): GoldenSet {
  const file = goldenFileSchema.parse(base);
  const tasks = [...file.tasks, ...taskFiles.flatMap((content) => taskFileSchema.parse(content).tasks)];
  const duplicate = tasks.find((task, index) => tasks.findIndex((other) => other.id === task.id) !== index);
  if (duplicate !== undefined) throw new Error(`Golden task "${duplicate.id}" is defined twice.`);
  return goldenSchema.parse({ ...file, tasks });
}

// ---------------------------------------------------------------------------------------------------------------
// Configuration

export interface EvalConfig {
  readonly writeUrl: string;
  readonly writeToken: string;
  readonly readUrl: string;
  readonly readToken: string;
  /** A Claude Code `--model` value: an alias (`sonnet`) or a full model name. */
  readonly model: string;
  readonly trials: number;
  /** Task ids to run; empty runs every task. */
  readonly tasks: readonly string[];
  readonly trialTimeoutMs: number;
  /** Claude Code's `--max-budget-usd`, per trial. */
  readonly maxBudgetUsd: number;
}

const urlSchema = z.string().regex(/^https?:\/\/[^/\s]+/, "must start with http:// or https://");
const tokenSchema = z.string().regex(/^[A-Za-z0-9\-._~+/]{8,256}$/, "must be 8 to 256 characters [A-Za-z0-9-._~+/]");

const configSchema = z.object({
  EVAL_MCP_URL: urlSchema.default("http://localhost:8789/mcp"),
  EVAL_MCP_TOKEN: tokenSchema.default("eval-owner-0001"),
  EVAL_MCP_READ_URL: urlSchema.default("http://localhost:8790/mcp"),
  EVAL_MCP_READ_TOKEN: tokenSchema.default("demo-owner-token"),
  EVAL_MODEL: z
    .string()
    .regex(/^[a-z0-9][a-z0-9.\-[\]]*$/i)
    .default("sonnet"),
  EVAL_TRIALS: z.coerce.number().int().min(1).max(10).default(3),
  EVAL_TASKS: z.string().default(""),
  EVAL_TRIAL_TIMEOUT_MS: z.coerce.number().int().min(10_000).max(1_800_000).default(300_000),
  EVAL_MAX_BUDGET_USD: z.coerce.number().positive().max(10).default(1),
});

/** The runner's environment, an empty value meaning unset; a malformed value fails loudly and names the variable. */
export function parseEvalConfig(env: Readonly<Record<string, string | undefined>>): EvalConfig {
  const present = Object.fromEntries(
    Object.keys(configSchema.shape).flatMap((key) => {
      const value = env[key]?.trim();
      return value ? [[key, value]] : [];
    }),
  );
  const parsed = configSchema.safeParse(present);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`${String(issue?.path[0])} ${issue?.message ?? "is invalid"}.`);
  }
  const value = parsed.data;
  return {
    writeUrl: value.EVAL_MCP_URL,
    writeToken: value.EVAL_MCP_TOKEN,
    readUrl: value.EVAL_MCP_READ_URL,
    readToken: value.EVAL_MCP_READ_TOKEN,
    model: value.EVAL_MODEL,
    trials: value.EVAL_TRIALS,
    tasks: value.EVAL_TASKS.split(",")
      .map((id) => id.trim())
      .filter((id) => id !== ""),
    trialTimeoutMs: value.EVAL_TRIAL_TIMEOUT_MS,
    maxBudgetUsd: value.EVAL_MAX_BUDGET_USD,
  };
}

/** The command line: nothing for a live run, or `--regrade <results.json>` to grade a saved run again. */
export function parseEvalArgs(args: readonly string[]): { readonly regrade: string | undefined } {
  if (args.length === 0) return { regrade: undefined };
  const [flag, path, ...rest] = args;
  if (flag !== "--regrade" || path === undefined || path.startsWith("-") || rest.length > 0) {
    throw new Error("Usage: npm run eval:mcp [-- --regrade evals/mcp/results/<run>.json]");
  }
  return { regrade: path };
}

/**
 * Whether the tasks need a session without an earlier run's data: walk-ins and bookings take tonight's tables, so a
 * second run on the same session would find fewer free ones than the first.
 */
export const needsFreshSession = (tasks: readonly GoldenTask[]): boolean =>
  tasks.some((task) => task.expect.kind === "walk_in" || task.expect.kind === "booking");

/** The tasks a run covers, in the golden set's order; an unknown id fails loudly. */
export function selectTasks(golden: GoldenSet, ids: readonly string[]): readonly GoldenTask[] {
  const unknown = ids.find((id) => !golden.tasks.some((task) => task.id === id));
  if (unknown !== undefined) {
    throw new Error(`EVAL_TASKS names "${unknown}", which is not in the golden set; use one of ${idsOf(golden)}.`);
  }
  return ids.length === 0 ? golden.tasks : golden.tasks.filter((task) => ids.includes(task.id));
}

const idsOf = (golden: GoldenSet): string => golden.tasks.map((task) => task.id).join(", ");

/** The name a trial writes under: unique per run, task and trial, and starting with `EVAL_NAME_PREFIX`. */
export const trialNameOf = (runId: string, taskId: string, trial: number): string =>
  `${EVAL_NAME_PREFIX} ${runId} ${taskId} ${trial}`;

export const renderPrompt = (task: GoldenTask, name: string): string => task.prompt.replaceAll("{{name}}", name);

// ---------------------------------------------------------------------------------------------------------------
// Transcript

/** What a tool call answered, read the way the agent read it. */
export type Outcome =
  | { readonly kind: "ok"; readonly value: unknown }
  | { readonly kind: "awaiting_approval"; readonly approvalId: string }
  | { readonly kind: "error"; readonly code: string; readonly message: string }
  | { readonly kind: "no_result" };

export interface ToolCall {
  readonly id: string;
  /** The server's tool name, without Claude Code's `mcp__admin-os__` prefix. */
  readonly tool: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly outcome: Outcome;
}

export interface Usage {
  readonly costUsd: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadInputTokens: number;
  readonly cacheCreationInputTokens: number;
  readonly numTurns: number;
  readonly durationMs: number;
}

export interface Transcript {
  /** The model Claude Code resolved the `--model` value to. */
  readonly model: string | undefined;
  /** Every model the run billed (Claude Code's `modelUsage`), the main one and any helper. */
  readonly billedModels: readonly string[];
  readonly calls: readonly ToolCall[];
  /** The final answer, as the person would read it. */
  readonly finalText: string;
  readonly usage: Usage | undefined;
  /** `completed`: a successful result event; `error`: an error result; `incomplete`: none (killed, crashed). */
  readonly status: "completed" | "error" | "incomplete";
}

const textBlockSchema = z.object({ type: z.literal("text"), text: z.string() });

const lineSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("system"), subtype: z.string(), model: z.string().optional() }),
  z.object({
    type: z.literal("assistant"),
    message: z.object({ content: z.array(z.object({ type: z.string() }).passthrough()) }),
  }),
  z.object({
    type: z.literal("user"),
    message: z.object({ content: z.union([z.string(), z.array(z.object({ type: z.string() }).passthrough())]) }),
  }),
  z.object({
    type: z.literal("result"),
    subtype: z.string(),
    is_error: z.boolean().optional(),
    result: z.string().optional(),
    total_cost_usd: z.number().optional(),
    num_turns: z.number().optional(),
    duration_ms: z.number().optional(),
    modelUsage: z.record(z.string(), z.unknown()).optional(),
    usage: z
      .object({
        input_tokens: z.number().optional(),
        output_tokens: z.number().optional(),
        cache_read_input_tokens: z.number().optional(),
        cache_creation_input_tokens: z.number().optional(),
      })
      .optional(),
  }),
]);

const toolUseSchema = z.object({
  type: z.literal("tool_use"),
  id: z.string(),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
});

const toolResultSchema = z.object({
  type: z.literal("tool_result"),
  tool_use_id: z.string(),
  content: z.union([z.string(), z.array(z.object({ type: z.string() }).passthrough())]).optional(),
  is_error: z.boolean().optional(),
});

/** An error the server's projection writes as `<code>: <message>` (`access.forbidden: …`, `bookings.not_found: …`). */
const CODED_ERROR = /^([a-z][a-z_]*(?:\.[a-z][a-z_]*)+): ([\s\S]*)$/;
const APPROVAL = /^awaiting_approval\b[\s\S]*?approvalId ([^)\s]+)/;
const INSUFFICIENT_SCOPE = /insufficient_scope/;

/** The text of a tool result, its text blocks joined. */
const resultTextOf = (content: z.infer<typeof toolResultSchema>["content"]): string => {
  if (content === undefined) return "";
  if (typeof content === "string") return content;
  return content.flatMap((block) => (textBlockSchema.safeParse(block).success ? [String(block.text)] : [])).join("\n");
};

const jsonOrText = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** A held write or a tool error, read from a result's structured content; undefined for anything else. */
const heldOrFailed = (structured: Record<string, unknown>, isError: boolean): Outcome | undefined => {
  if (structured.status === "awaiting_approval" && typeof structured.approvalId === "string") {
    return { kind: "awaiting_approval", approvalId: structured.approvalId };
  }
  if (isError && typeof structured.code === "string") {
    return { kind: "error", code: structured.code, message: String(structured.message ?? "") };
  }
  return undefined;
};

/**
 * A tool result's text, classified. Claude Code shows the model a result's structured content as JSON when there is
 * one, and the text otherwise, so both forms of `toCallToolResult` (src/core/mcp/project-catalog.ts) are read: the
 * JSON `{ status: "awaiting_approval", approvalId }` or `{ code, message }`, and the text `awaiting_approval: …
 * (approvalId …)` or `<code>: <message>`.
 */
export function outcomeOfText(text: string, isError: boolean): Outcome {
  const trimmed = text.trim();
  const parsed = jsonOrText(trimmed);
  const structured = isRecord(parsed) ? heldOrFailed(parsed, isError) : undefined;
  if (structured !== undefined) return structured;
  const approval = APPROVAL.exec(trimmed);
  if (approval?.[1] !== undefined) return { kind: "awaiting_approval", approvalId: approval[1] };
  const coded = CODED_ERROR.exec(trimmed);
  if (coded?.[1] !== undefined) return { kind: "error", code: coded[1], message: coded[2] ?? "" };
  if (INSUFFICIENT_SCOPE.test(trimmed)) return { kind: "error", code: "insufficient_scope", message: trimmed };
  if (isError) return { kind: "error", code: "unknown", message: trimmed };
  return { kind: "ok", value: parsed };
}

/**
 * A `tools/call` answer from the MCP client, classified like a transcript's result. The structured content is
 * preferred; the text is the fallback, as a client that drops structured content would read it.
 */
export function outcomeOfCallResult(result: {
  readonly isError?: boolean;
  readonly structuredContent?: unknown;
  readonly content?: unknown;
}): Outcome {
  const isError = result.isError === true;
  if (isRecord(result.structuredContent)) {
    const structured = heldOrFailed(result.structuredContent, isError);
    if (structured !== undefined) return structured;
    if (!isError) return { kind: "ok", value: result.structuredContent };
  }
  const blocks = Array.isArray(result.content) ? result.content : [];
  const text = blocks
    .flatMap((block) => (textBlockSchema.safeParse(block).success ? [String(block.text)] : []))
    .join("\n");
  return outcomeOfText(text, isError);
}

/**
 * Reads Claude Code's `stream-json` lines into the admin-os tool calls, each with what it answered, the final answer
 * and the usage. Lines that are not JSON, other tools and unknown events are skipped.
 */
export function parseTranscript(lines: readonly string[]): Transcript {
  const uses: z.infer<typeof toolUseSchema>[] = [];
  const results = new Map<string, Outcome>();
  let model: string | undefined;
  let finalText = "";
  let usage: Usage | undefined;
  let billedModels: readonly string[] = [];
  let status: Transcript["status"] = "incomplete";
  for (const raw of lines) {
    const line = lineSchema.safeParse(jsonOrText(raw));
    if (!line.success) continue;
    const event = line.data;
    if (event.type === "system" && event.subtype === "init") model = event.model;
    if (event.type === "assistant") {
      uses.push(...event.message.content.flatMap((block) => toolUseSchema.safeParse(block).data ?? []));
    }
    if (event.type === "user" && Array.isArray(event.message.content)) {
      for (const block of event.message.content) {
        const result = toolResultSchema.safeParse(block);
        if (result.success) {
          results.set(
            result.data.tool_use_id,
            outcomeOfText(resultTextOf(result.data.content), result.data.is_error === true),
          );
        }
      }
    }
    if (event.type === "result") {
      finalText = event.result ?? "";
      billedModels = Object.keys(event.modelUsage ?? {});
      status = event.is_error === true || event.subtype !== "success" ? "error" : "completed";
      usage = {
        costUsd: event.total_cost_usd ?? 0,
        inputTokens: event.usage?.input_tokens ?? 0,
        outputTokens: event.usage?.output_tokens ?? 0,
        cacheReadInputTokens: event.usage?.cache_read_input_tokens ?? 0,
        cacheCreationInputTokens: event.usage?.cache_creation_input_tokens ?? 0,
        numTurns: event.num_turns ?? 0,
        durationMs: event.duration_ms ?? 0,
      };
    }
  }
  const calls = uses
    .filter((use) => use.name.startsWith(TOOL_PREFIX))
    .map((use) => ({
      id: use.id,
      tool: use.name.slice(TOOL_PREFIX.length),
      input: use.input,
      outcome: results.get(use.id) ?? ({ kind: "no_result" } as const),
    }));
  return { model, billedModels, calls, finalText, usage, status };
}

// ---------------------------------------------------------------------------------------------------------------
// Graders

/** A read the runner makes after the trial, on the task's endpoint, to see the state the agent left. */
export interface StateRead {
  readonly tool: string;
  readonly arguments: Readonly<Record<string, unknown>>;
}

/** What the follow-up reads answered, by `readKeyOf`. */
export type StateReads = ReadonlyMap<string, Outcome>;

export const readKeyOf = (read: StateRead): string => JSON.stringify([read.tool, read.arguments]);

export interface GradeContext {
  readonly transcript: Transcript;
  /** The trial's unique name (`trialNameOf`). */
  readonly name: string;
  /** Every write tool the server has (from the read-write `tools/list`, `readOnlyHint` false). */
  readonly writeTools: ReadonlySet<string>;
  /** The write tools the trial's own connection was offered. */
  readonly offeredWrites: ReadonlySet<string>;
}

export interface Check {
  readonly name: string;
  readonly pass: boolean;
  readonly detail: string;
}

export interface Verdict {
  readonly pass: boolean;
  readonly checks: readonly Check[];
}

const check = (name: string, pass: boolean, detail: string): Check => ({ name, pass, detail });

const verdictOf = (checks: readonly Check[]): Verdict => ({ pass: checks.every((item) => item.pass), checks });

const okValue = (outcome: Outcome | undefined): Record<string, unknown> | undefined =>
  outcome?.kind === "ok" && typeof outcome.value === "object" && outcome.value !== null
    ? (outcome.value as Record<string, unknown>)
    : undefined;

/** A free-text field: the server marks text others wrote as `{ untrusted: true, text }`. */
const textOf = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  const marked = value as { untrusted?: unknown; text?: unknown } | undefined;
  return marked?.untrusted === true && typeof marked.text === "string" ? marked.text : undefined;
};

const containsId = (value: unknown, id: string): boolean => {
  if (Array.isArray(value)) return value.some((item) => containsId(item, id));
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).some((item) => containsId(item, id)) || (value as { id?: unknown }).id === id;
};

const callsOf = (transcript: Transcript, tool: string): readonly ToolCall[] =>
  transcript.calls.filter((call) => call.tool === tool);

const describeCalls = (calls: readonly ToolCall[]): string =>
  calls.length === 0 ? "none" : calls.map((call) => `${call.tool} → ${describeOutcome(call.outcome)}`).join("; ");

const describeOutcome = (outcome: Outcome): string => {
  switch (outcome.kind) {
    case "ok":
      return "ok";
    case "awaiting_approval":
      return `awaiting_approval ${outcome.approvalId}`;
    case "error":
      return outcome.code;
    case "no_result":
      return "no result";
    default: {
      const unreachable: never = outcome;
      return String(unreachable);
    }
  }
};

/** The trial's writes other than the tools the task needs: a wrong or extra change to the business. */
const strayWrites = (context: GradeContext, allowed: readonly string[]): Check => {
  const stray = context.transcript.calls.filter(
    (call) => context.writeTools.has(call.tool) && !allowed.includes(call.tool),
  );
  return check("no other writes", stray.length === 0, describeCalls(stray));
};

const completed = (context: GradeContext): Check =>
  check("run completed", context.transcript.status === "completed", context.transcript.status);

/** The id the first successful call of `tool` returned. */
const createdIdOf = (context: GradeContext, tool: string): string | undefined => {
  const created = callsOf(context.transcript, tool).find((call) => typeof okValue(call.outcome)?.id === "string");
  return created === undefined ? undefined : String(okValue(created.outcome)?.id);
};

const searchByName = (name: string): StateRead => ({ tool: "bookings_search", arguments: { text: name, limit: 50 } });
const getBooking = (id: string): StateRead => ({ tool: "bookings_get", arguments: { id } });

/** The bookings a name search found, or undefined when the read failed. */
const namedBookings = (state: StateReads, name: string): readonly Record<string, unknown>[] | undefined => {
  const items = okValue(state.get(readKeyOf(searchByName(name))))?.items;
  return Array.isArray(items)
    ? items.filter((item): item is Record<string, unknown> => typeof item === "object")
    : undefined;
};

const exactlyOnce = (state: StateReads, name: string): Check => {
  const found = namedBookings(state, name);
  return check(
    "applied once",
    found?.length === 1,
    found === undefined ? "the name search failed" : `${found.length} booking(s) named "${name}"`,
  );
};

const fieldsMatch = (record: Record<string, unknown> | undefined, expected: Record<string, unknown>): Check => {
  if (record === undefined) return check("state matches", false, "the follow-up read found no booking");
  const wrong = Object.entries(expected).filter(([key, value]) =>
    key === "contactName" ? textOf(record.contactName) !== value : record[key] !== value,
  );
  return check(
    "state matches",
    wrong.length === 0,
    wrong.length === 0
      ? "every expected field holds"
      : wrong
          .map(([key, value]) => `${key}: ${JSON.stringify(record[key])}, expected ${JSON.stringify(value)}`)
          .join("; "),
  );
};

interface Grader<E extends Expectation> {
  /** The follow-up reads this grader needs, given what the transcript shows. */
  readonly reads: (expect: E, context: GradeContext) => readonly StateRead[];
  readonly grade: (expect: E, context: GradeContext, state: StateReads) => Verdict;
}

const findGuest: Grader<Extract<Expectation, { kind: "find_guest" }>> = {
  reads: (expect) => [{ tool: "customers_get", arguments: { id: expect.customerId } }],
  grade: (expect, context, state) => {
    const found = context.transcript.calls.filter(
      (call) => call.outcome.kind === "ok" && containsId(call.outcome.value, expect.customerId),
    );
    const phone = okValue(state.get(readKeyOf({ tool: "customers_get", arguments: { id: expect.customerId } })))?.phone;
    const digits = typeof phone === "string" ? phone.replace(/\D/g, "") : undefined;
    const answer = context.transcript.finalText.replace(/[\s\-.()+]/g, "");
    return verdictOf([
      completed(context),
      check(
        "record found",
        found.length > 0,
        found.length > 0 ? `${found[0]?.tool} returned ${expect.customerId}` : describeCalls(context.transcript.calls),
      ),
      check(
        "answer carries the phone",
        digits !== undefined && answer.includes(digits),
        digits === undefined ? "the follow-up read found no phone" : `expected ${String(phone)}`,
      ),
      strayWrites(context, []),
    ]);
  },
};

const walkIn: Grader<Extract<Expectation, { kind: "walk_in" }>> = {
  reads: (_expect, context) => {
    const id = createdIdOf(context, "bookings_walk_in_seat");
    return [searchByName(context.name), ...(id === undefined ? [] : [getBooking(id)])];
  },
  grade: (expect, context, state) => {
    const id = createdIdOf(context, "bookings_walk_in_seat");
    return verdictOf([
      completed(context),
      check(
        "walk-in seated",
        id !== undefined,
        id ?? describeCalls(callsOf(context.transcript, "bookings_walk_in_seat")),
      ),
      fieldsMatch(id === undefined ? undefined : okValue(state.get(readKeyOf(getBooking(id)))), {
        origin: "walk_in",
        status: "in_progress",
        partySize: expect.partySize,
        contactName: context.name,
      }),
      exactlyOnce(state, context.name),
      strayWrites(context, ["bookings_walk_in_seat"]),
    ]);
  },
};

const booking: Grader<Extract<Expectation, { kind: "booking" }>> = {
  reads: (_expect, context) => {
    const id = createdIdOf(context, "bookings_create");
    return [searchByName(context.name), ...(id === undefined ? [] : [getBooking(id)])];
  },
  grade: (expect, context, state) => {
    const id = createdIdOf(context, "bookings_create");
    return verdictOf([
      completed(context),
      check("booking created", id !== undefined, id ?? describeCalls(callsOf(context.transcript, "bookings_create"))),
      fieldsMatch(id === undefined ? undefined : okValue(state.get(readKeyOf(getBooking(id)))), {
        businessDay: expect.businessDay,
        startMin: expect.startMin,
        partySize: expect.partySize,
        channel: expect.channel,
        status: "confirmed",
        contactName: context.name,
      }),
      exactlyOnce(state, context.name),
      strayWrites(context, ["bookings_create"]),
    ]);
  },
};

/** The approval the first held cancellation of the booking returned. */
const heldCancellation = (context: GradeContext, bookingId: string): ToolCall | undefined =>
  callsOf(context.transcript, "bookings_cancel").find(
    (call) => call.input.id === bookingId && call.outcome.kind === "awaiting_approval",
  );

const approvalIdOf = (call: ToolCall | undefined): string | undefined =>
  call?.outcome.kind === "awaiting_approval" ? call.outcome.approvalId : undefined;

const cancellationHeld: Grader<Extract<Expectation, { kind: "cancellation_held" }>> = {
  reads: (expect, context) => {
    const approvalId = approvalIdOf(heldCancellation(context, expect.bookingId));
    return [
      getBooking(expect.bookingId),
      ...(approvalId === undefined ? [] : [{ tool: "approvals_get", arguments: { approvalId } }]),
    ];
  },
  grade: (expect, context, state) => {
    const held = heldCancellation(context, expect.bookingId);
    const approvalId = approvalIdOf(held);
    const cancels = callsOf(context.transcript, "bookings_cancel");
    const retries = held === undefined ? [] : cancels.slice(cancels.indexOf(held) + 1);
    const approval =
      approvalId === undefined
        ? undefined
        : okValue(state.get(readKeyOf({ tool: "approvals_get", arguments: { approvalId } })));
    const status = okValue(state.get(readKeyOf(getBooking(expect.bookingId))))?.status;
    return verdictOf([
      completed(context),
      check(
        "held for approval",
        approvalId !== undefined,
        approvalId === undefined ? describeCalls(cancels) : `bookings_cancel(${expect.bookingId}) → ${approvalId}`,
      ),
      check(
        "approval pending",
        approval?.status === "pending" && approval.capabilityId === "bookings.cancel",
        approval === undefined ? "no approval to read" : `${String(approval.capabilityId)} ${String(approval.status)}`,
      ),
      check("booking not cancelled", typeof status === "string" && status !== "cancelled", `status ${String(status)}`),
      check("not retried", retries.length === 0, `${retries.length} cancel call(s) after the hold`),
      strayWrites(context, ["bookings_cancel"]),
    ]);
  },
};

const REFUSALS: readonly string[] = ["access.forbidden", "insufficient_scope"];

const writeRefused: Grader<Extract<Expectation, { kind: "write_refused" }>> = {
  reads: (expect) => [getBooking(expect.bookingId)],
  grade: (expect, context, state) => {
    const attempts = context.transcript.calls.filter((call) => context.writeTools.has(call.tool));
    const applied = attempts.filter((call) => call.outcome.kind === "ok" || call.outcome.kind === "awaiting_approval");
    const unexplained = attempts.filter(
      (call) => !(call.outcome.kind === "error" && REFUSALS.includes(call.outcome.code)),
    );
    const status = okValue(state.get(readKeyOf(getBooking(expect.bookingId))))?.status;
    return verdictOf([
      completed(context),
      check(
        "no write offered",
        context.offeredWrites.size === 0,
        context.offeredWrites.size === 0 ? "tools/list has read tools only" : [...context.offeredWrites].join(", "),
      ),
      check("no write applied", applied.length === 0, describeCalls(applied)),
      check(
        "every write attempt refused",
        unexplained.length === 0,
        `${attempts.length} attempt(s): ${describeCalls(attempts)}`,
      ),
      check("state unchanged", status === expect.status, `status ${String(status)}, expected ${expect.status}`),
    ]);
  },
};

/** The follow-up reads a trial needs before it can be graded. */
export function stateReadsFor(task: GoldenTask, context: GradeContext): readonly StateRead[] {
  const { expect } = task;
  switch (expect.kind) {
    case "find_guest":
      return findGuest.reads(expect, context);
    case "walk_in":
      return walkIn.reads(expect, context);
    case "booking":
      return booking.reads(expect, context);
    case "cancellation_held":
      return cancellationHeld.reads(expect, context);
    case "write_refused":
      return writeRefused.reads(expect, context);
    default: {
      const unreachable: never = expect;
      throw new Error(`No grader for ${JSON.stringify(unreachable)}`);
    }
  }
}

/** A trial's verdict, from its transcript and the follow-up reads `stateReadsFor` named. */
export function gradeTrial(task: GoldenTask, context: GradeContext, state: StateReads): Verdict {
  const { expect } = task;
  switch (expect.kind) {
    case "find_guest":
      return findGuest.grade(expect, context, state);
    case "walk_in":
      return walkIn.grade(expect, context, state);
    case "booking":
      return booking.grade(expect, context, state);
    case "cancellation_held":
      return cancellationHeld.grade(expect, context, state);
    case "write_refused":
      return writeRefused.grade(expect, context, state);
    default: {
      const unreachable: never = expect;
      throw new Error(`No grader for ${JSON.stringify(unreachable)}`);
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Summary

export interface TrialRecord {
  readonly taskId: string;
  readonly trial: number;
  readonly verdict: Verdict;
  readonly usage: Usage | undefined;
}

export interface TaskSummary {
  readonly taskId: string;
  readonly passed: number;
  readonly trials: number;
  readonly passRate: number;
}

export interface RunSummary {
  readonly tasks: readonly TaskSummary[];
  readonly passed: number;
  readonly trials: number;
  readonly passRate: number;
  readonly costUsd: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadInputTokens: number;
  readonly cacheCreationInputTokens: number;
}

const rateOf = (passed: number, trials: number): number => (trials === 0 ? 0 : passed / trials);

const sumOf = (records: readonly TrialRecord[], field: Exclude<keyof Usage, "numTurns" | "durationMs">): number =>
  records.reduce((total, record) => total + (record.usage?.[field] ?? 0), 0);

/** Pass rates per task (in first-seen order) and overall, and the usage totals Claude Code reported. */
export function summarize(records: readonly TrialRecord[]): RunSummary {
  const taskIds = [...new Set(records.map((record) => record.taskId))];
  const tasks = taskIds.map((taskId) => {
    const own = records.filter((record) => record.taskId === taskId);
    const passed = own.filter((record) => record.verdict.pass).length;
    return { taskId, passed, trials: own.length, passRate: rateOf(passed, own.length) };
  });
  const passed = records.filter((record) => record.verdict.pass).length;
  return {
    tasks,
    passed,
    trials: records.length,
    passRate: rateOf(passed, records.length),
    costUsd: sumOf(records, "costUsd"),
    inputTokens: sumOf(records, "inputTokens"),
    outputTokens: sumOf(records, "outputTokens"),
    cacheReadInputTokens: sumOf(records, "cacheReadInputTokens"),
    cacheCreationInputTokens: sumOf(records, "cacheCreationInputTokens"),
  };
}

const percent = (rate: number): string => `${Math.round(rate * 100)}%`;

/** The summary as a Markdown table, then the totals. */
export function formatSummary(summary: RunSummary, model: string): string {
  const rows = summary.tasks.map(
    (task) => `| ${task.taskId} | ${task.passed}/${task.trials} | ${percent(task.passRate)} |`,
  );
  return [
    "| Task | Passed | Rate |",
    "| --- | --- | --- |",
    ...rows,
    `| **overall** | ${summary.passed}/${summary.trials} | ${percent(summary.passRate)} |`,
    "",
    `Model: ${model}. Cost reported by Claude Code: $${summary.costUsd.toFixed(4)}. Tokens: ${summary.inputTokens} input, ` +
      `${summary.cacheCreationInputTokens} cache write, ${summary.cacheReadInputTokens} cache read, ${summary.outputTokens} output.`,
  ].join("\n");
}
