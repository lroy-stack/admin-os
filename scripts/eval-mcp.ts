/**
 * Agent evals for the MCP server (spec 004, AC11; plan E1): each golden task in `evals/mcp/golden.json` runs N times
 * through a real Claude client, headless Claude Code (`claude -p`), against the MCP Worker under `wrangler dev`. A
 * trial is graded from its transcript's tool calls and results and from follow-up MCP reads of the state it left,
 * never from what the model says. Results go to `evals/mcp/results/` (gitignored). On demand, not in CI: a run spends
 * the Claude usage of whoever runs it.
 *
 * It starts nothing. Before `npm run eval:mcp`, build once (`npx opennextjs-cloudflare build`), then run these three
 * processes, each in its own terminal (docs/guides/mcp.md, "Agent evals"):
 *   npx wrangler dev -c wrangler.jsonc -c workers/demo-store/wrangler.jsonc --port 8788
 *   npm run dev:mcp     # with workers/mcp/.dev.vars holding MCP_TOKENS=eval-owner-0001:owner and MCP_READ_ONLY=false
 *   npm run dev:mcp:read-only   # port 8790: the public demo tokens, read-only, whatever .dev.vars says
 *
 * Environment (all optional): EVAL_MCP_URL, EVAL_MCP_TOKEN, EVAL_MCP_READ_URL, EVAL_MCP_READ_TOKEN, EVAL_MODEL
 * (default `sonnet`), EVAL_TRIALS (3), EVAL_TASKS (comma-separated ids), EVAL_TRIAL_TIMEOUT_MS, EVAL_MAX_BUDGET_USD.
 * `npm run eval:mcp -- --regrade evals/mcp/results/<run>.json` grades a saved run again, without calling a model.
 * Leave the Workers' sources alone during a run: `wrangler dev` reloads on a change and a write in flight answers
 * `transport.unavailable`.
 */
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { z } from "zod";

import {
  EVAL_NAME_PREFIX,
  type EvalConfig,
  formatSummary,
  type GoldenSet,
  type GoldenTask,
  goldenSchema,
  gradeTrial,
  needsFreshSession,
  type Outcome,
  outcomeOfCallResult,
  parseEvalArgs,
  parseEvalConfig,
  parseTranscript,
  readKeyOf,
  renderPrompt,
  SERVER_KEY,
  type StateRead,
  selectTasks,
  stateReadsFor,
  summarize,
  type TrialRecord,
  trialNameOf,
} from "./eval-mcp-grade";
import { execFile, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";

const ROOT = join(import.meta.dirname, "..");
const GOLDEN_PATH = join(ROOT, "evals/mcp/golden.json");
const RESULTS_DIR = join(ROOT, "evals/mcp/results");
const REQUEST_TIMEOUT_MS = 30_000;
const STDERR_TAIL_CHARS = 2_000;

interface Endpoint {
  readonly url: string;
  readonly token: string;
}

const endpointOf = (config: EvalConfig, task: GoldenTask): Endpoint =>
  task.endpoint === "write"
    ? { url: config.writeUrl, token: config.writeToken }
    : { url: config.readUrl, token: config.readToken };

const timedFetch = (url: string | URL, init?: RequestInit): Promise<Response> =>
  fetch(url, { ...init, signal: init?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

async function withClient<T>(endpoint: Endpoint, use: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ name: "admin-os-agent-evals", version: "0.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(new URL(endpoint.url), {
        fetch: timedFetch,
        authProvider: { token: async () => endpoint.token },
      }),
    );
  } catch (error) {
    throw new Error(
      `Cannot reach ${endpoint.url} (${error instanceof Error ? error.message : String(error)}). Start the Workers first: see the header of scripts/eval-mcp.ts.`,
    );
  }
  try {
    return await use(client);
  } finally {
    await client.close();
  }
}

/** The write tools a connection is offered: every tool not marked `readOnlyHint`. */
const writesOffered = (endpoint: Endpoint): Promise<ReadonlySet<string>> =>
  withClient(endpoint, async (client) => {
    const { tools } = await client.listTools();
    return new Set(tools.filter((tool) => tool.annotations?.readOnlyHint !== true).map((tool) => tool.name));
  });

const callOutcome = async (client: Client, read: StateRead): Promise<Outcome> =>
  outcomeOfCallResult(await client.callTool({ name: read.tool, arguments: { ...read.arguments } }));

/** Refuses to run on a session that already holds an earlier run's data: walk-ins would fill tonight's tables. */
async function assertFreshSession(endpoint: Endpoint): Promise<void> {
  const outcome = await withClient(endpoint, (client) =>
    callOutcome(client, { tool: "bookings_search", arguments: { text: EVAL_NAME_PREFIX, limit: 50 } }),
  );
  if (outcome.kind !== "ok") {
    throw new Error(`bookings_search failed on ${endpoint.url}: ${JSON.stringify(outcome)}. Is the store running?`);
  }
  const items = (outcome.value as { items?: unknown[] }).items ?? [];
  if (items.length > 0) {
    throw new Error(
      `The eval token's demo session already holds ${items.length} booking(s) from an earlier run. It resets after two idle hours; to start now, stop the web and store process and start it again with a fresh --persist-to directory.`,
    );
  }
}

interface ClaudeRun {
  readonly lines: readonly string[];
  readonly exitCode: number | null;
  readonly timedOut: boolean;
  readonly stderrTail: string;
}

/** Headless Claude Code with only this server's tools, no settings, hooks, CLAUDE.md or session left behind. */
async function runClaude(
  config: EvalConfig,
  golden: GoldenSet,
  endpoint: Endpoint,
  prompt: string,
): Promise<ClaudeRun> {
  const dir = await mkdtemp(join(tmpdir(), "admin-os-eval-"));
  try {
    const mcpConfig = join(dir, "mcp.json");
    const server = { type: "http", url: endpoint.url, headers: { Authorization: `Bearer ${endpoint.token}` } };
    await writeFile(mcpConfig, JSON.stringify({ mcpServers: { [SERVER_KEY]: server } }), { mode: 0o600 });
    const args = [
      "-p",
      prompt,
      "--model",
      config.model,
      "--output-format",
      "stream-json",
      "--verbose",
      "--no-session-persistence",
      "--strict-mcp-config",
      "--mcp-config",
      mcpConfig,
      "--tools",
      "",
      "--allowedTools",
      `mcp__${SERVER_KEY}`,
      "--permission-mode",
      "dontAsk",
      "--setting-sources",
      "local",
      "--disable-slash-commands",
      "--append-system-prompt",
      golden.appendSystemPrompt,
      "--max-budget-usd",
      String(config.maxBudgetUsd),
    ];
    return await new Promise<ClaudeRun>((resolve, reject) => {
      const child = spawn("claude", args, { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, config.trialTimeoutMs);
      child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
        stderr += chunk;
      });
      child.on("error", (error) => {
        clearTimeout(timer);
        reject(new Error(`Cannot start claude: ${error.message}. Is the Claude Code CLI installed and logged in?`));
      });
      child.on("close", (exitCode) => {
        clearTimeout(timer);
        resolve({
          lines: stdout.split("\n").filter((line) => line.trim() !== ""),
          exitCode,
          timedOut,
          stderrTail: stderr.slice(-STDERR_TAIL_CHARS),
        });
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const claudeVersion = async (): Promise<string> => {
  const { stdout } = await promisify(execFile)("claude", ["--version"], { timeout: REQUEST_TIMEOUT_MS });
  return stdout.trim();
};

const stampOf = (date: Date): string =>
  date
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")
    .replaceAll(":", "-");

const describe = (outcome: Outcome): unknown =>
  outcome.kind === "error" ? { kind: outcome.kind, code: outcome.code } : { kind: outcome.kind };

/** One trial to grade: run now through Claude Code, or read back from an earlier run's transcript. */
interface PlannedTrial {
  readonly task: GoldenTask;
  readonly trial: number;
  readonly name: string;
  readonly run: () => Promise<ClaudeRun & { readonly transcriptPath: string }>;
}

/** An earlier results file, as far as a re-grade reads it. */
const previousRunSchema = z.object({
  goldenVersion: z.string(),
  runId: z.string(),
  claudeCode: z.string(),
  requestedModel: z.string(),
  trials: z.array(
    z.object({
      taskId: z.string(),
      trial: z.number().int(),
      name: z.string(),
      transcript: z.string(),
      exitCode: z.number().nullable(),
      timedOut: z.boolean(),
    }),
  ),
});

/** Live trials: each task's prompt through headless Claude Code, its transcript saved beside the results. */
function liveTrials(
  config: EvalConfig,
  golden: GoldenSet,
  tasks: readonly GoldenTask[],
  runId: string,
  dir: string,
): PlannedTrial[] {
  return tasks.flatMap((task) =>
    Array.from({ length: config.trials }, (_, index) => {
      const trial = index + 1;
      const name = trialNameOf(runId, task.id, trial);
      return {
        task,
        trial,
        name,
        run: async () => {
          const run = await runClaude(config, golden, endpointOf(config, task), renderPrompt(task, name));
          const transcriptPath = join(dir, `${task.id}-${trial}.jsonl`);
          await writeFile(transcriptPath, `${run.lines.join("\n")}\n`);
          return { ...run, transcriptPath };
        },
      };
    }),
  );
}

/** Re-graded trials: an earlier run's saved transcripts, graded again against the state the server holds now. */
function regradedTrials(golden: GoldenSet, previous: z.infer<typeof previousRunSchema>): PlannedTrial[] {
  if (previous.goldenVersion !== golden.version) {
    throw new Error(
      `That run used golden set ${previous.goldenVersion}, this checkout has ${golden.version}; re-grade it from the commit that ran it.`,
    );
  }
  return previous.trials.map((record) => {
    const task = selectTasks(golden, [record.taskId])[0] as GoldenTask;
    const transcriptPath = join(ROOT, record.transcript);
    return {
      task,
      trial: record.trial,
      name: record.name,
      run: async () => ({
        lines: (await readFile(transcriptPath, "utf8")).split("\n").filter((line) => line.trim() !== ""),
        exitCode: record.exitCode,
        timedOut: record.timedOut,
        stderrTail: "",
        transcriptPath,
      }),
    };
  });
}

async function main(): Promise<number> {
  const config = parseEvalConfig(process.env);
  const { regrade } = parseEvalArgs(process.argv.slice(2));
  const golden = goldenSchema.parse(JSON.parse(await readFile(GOLDEN_PATH, "utf8")));
  const previous =
    regrade === undefined ? undefined : previousRunSchema.parse(JSON.parse(await readFile(regrade, "utf8")));
  const tasks = selectTasks(golden, previous === undefined ? config.tasks : previous.trials.map((t) => t.taskId));
  const writeEndpoint = { url: config.writeUrl, token: config.writeToken };
  const readEndpoint = { url: config.readUrl, token: config.readToken };

  const writeTools = await writesOffered(writeEndpoint);
  if (writeTools.size === 0) {
    throw new Error(
      `${config.writeUrl} offers no write tools to EVAL_MCP_TOKEN. Put MCP_TOKENS=eval-owner-0001:owner and MCP_READ_ONLY=false in workers/mcp/.dev.vars and restart npm run dev:mcp.`,
    );
  }
  const readOffered = tasks.some((task) => task.endpoint === "read")
    ? await writesOffered(readEndpoint)
    : new Set<string>();
  // A re-grade reads the state its own trials left, so only a live run needs a session without eval data.
  if (previous === undefined && needsFreshSession(tasks)) {
    await assertFreshSession(writeEndpoint);
  }

  const startedAt = new Date();
  const runId = previous?.runId ?? randomBytes(3).toString("hex");
  const stamp = stampOf(startedAt);
  const transcriptsDir = join(RESULTS_DIR, stamp);
  if (previous === undefined) await mkdir(transcriptsDir, { recursive: true });
  const version = previous?.claudeCode ?? (await claudeVersion());
  const model = previous?.requestedModel ?? config.model;
  const planned =
    previous === undefined
      ? liveTrials(config, golden, tasks, runId, transcriptsDir)
      : regradedTrials(golden, previous);
  console.log(
    `admin-os agent evals ${golden.version}: ${planned.length} trial(s) of ${tasks.length} task(s), --model ${model}, ${version}${regrade === undefined ? "" : `, re-grading ${regrade} (no model calls)`}`,
  );

  const records: (TrialRecord & Record<string, unknown>)[] = [];
  for (const { task, trial, name, run: start } of planned) {
    const endpoint = endpointOf(config, task);
    const run = await start();
    const transcript = parseTranscript(run.lines);
    const context = {
      transcript,
      name,
      writeTools,
      offeredWrites: task.endpoint === "read" ? readOffered : writeTools,
    };
    const reads = stateReadsFor(task, context);
    const state = await withClient(endpoint, async (client) => {
      const answers = new Map<string, Outcome>();
      for (const read of reads) answers.set(readKeyOf(read), await callOutcome(client, read));
      return answers;
    });
    const verdict = gradeTrial(task, context, state);
    records.push({
      taskId: task.id,
      trial,
      verdict,
      usage: transcript.usage,
      name,
      model: transcript.model,
      billedModels: transcript.billedModels,
      exitCode: run.exitCode,
      timedOut: run.timedOut,
      calls: transcript.calls.map((call) => ({
        tool: call.tool,
        input: call.input,
        outcome: describe(call.outcome),
      })),
      finalText: transcript.finalText,
      transcript: relative(ROOT, run.transcriptPath),
      ...(run.exitCode === 0 ? {} : { stderrTail: run.stderrTail }),
    });
    const failed = verdict.checks.filter((item) => !item.pass).map((item) => `${item.name} (${item.detail})`);
    console.log(
      `${task.id} #${trial}: ${verdict.pass ? "PASS" : `FAIL: ${failed.join("; ")}`} · ${transcript.calls.length} call(s), $${(transcript.usage?.costUsd ?? 0).toFixed(4)}`,
    );
  }

  const summary = summarize(records);
  const models = [...new Set(records.flatMap((record) => (typeof record.model === "string" ? [record.model] : [])))];
  const resultPath = join(RESULTS_DIR, `${stamp}.json`);
  await writeFile(
    resultPath,
    `${JSON.stringify(
      {
        goldenVersion: golden.version,
        runId,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        ...(regrade === undefined ? {} : { regradeOf: relative(ROOT, regrade) }),
        claudeCode: version,
        requestedModel: model,
        models,
        endpoints: { write: config.writeUrl, read: config.readUrl },
        summary,
        trials: records,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`\n${formatSummary(summary, models.join(", ") || model)}\n\nResults: ${relative(ROOT, resultPath)}`);
  return summary.passed === summary.trials ? 0 : 1;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(`eval:mcp failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  },
);
