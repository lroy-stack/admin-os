import { loadGolden, TASK_MODULES } from "./eval-mcp-golden";
import {
  type GoldenTask,
  type GradeContext,
  type Outcome,
  parseTranscript,
  readKeyOf,
  type StateRead,
  type StateReads,
  selectTasks,
  stateReadsFor,
  type Transcript,
  type Verdict,
} from "./eval-mcp-grade";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Shared by the grader tests of `eval-mcp.test.ts` and each module's `eval-mcp.<module>.test.ts`: the recorded
 * transcripts (Sonnet, 2026-11-04) and the helpers that feed a grader the state a run's follow-up reads answered.
 */

export const ROOT = join(import.meta.dirname, "..");
export const GOLDEN = loadGolden(ROOT);

/** The ids of the golden tasks a module's own file holds, in its order; none when it has no file. */
export const taskIdsOf = (module: string): string[] =>
  existsSync(join(ROOT, "evals/mcp/tasks", `${module}.json`))
    ? (
        JSON.parse(readFileSync(join(ROOT, "evals/mcp/tasks", `${module}.json`), "utf8")) as {
          tasks: readonly { id: string }[];
        }
      ).tasks.map((task) => task.id)
    : [];

/** A recorded transcript, trimmed to what the graders read: `evals/mcp/fixtures/<module>/<task>.jsonl`. */
export const fixture = (module: string, name: string): Transcript =>
  parseTranscript(readFileSync(join(ROOT, "evals/mcp/fixtures", module, `${name}.jsonl`), "utf8").split("\n"));
export const taskOf = (id: string): GoldenTask => selectTasks(GOLDEN, [id])[0] as GoldenTask;

/** The write tools of the read-write server, as `tools/list` marks them (`readOnlyHint` false). */
export const WRITE_TOOLS: ReadonlySet<string> = new Set([
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

export const contextOf = (transcript: Transcript, name: string, offeredWrites: ReadonlySet<string> = WRITE_TOOLS) =>
  ({ transcript, name, writeTools: WRITE_TOOLS, offeredWrites }) satisfies GradeContext;

/** The follow-up reads a grader asks for, each answered by the tool's entry in `answers`. */
export const stateFor = (
  task: GoldenTask,
  context: GradeContext,
  answers: Readonly<Record<string, Outcome>>,
): StateReads =>
  new Map(
    stateReadsFor(task, context).map((read: StateRead) => [
      readKeyOf(read),
      answers[read.tool] ?? { kind: "no_result" },
    ]),
  );

export const ok = (value: unknown): Outcome => ({ kind: "ok", value });
export const failedChecks = (verdict: Verdict): string[] =>
  verdict.checks.filter((item) => !item.pass).map((item) => item.name);
export const detailOf = (verdict: Verdict, name: string): string | undefined =>
  verdict.checks.find((item) => item.name === name)?.detail;

/** The installed modules that own golden tasks. */
export const taskModules: readonly string[] = TASK_MODULES.filter((module) => taskIdsOf(module).length > 0);
