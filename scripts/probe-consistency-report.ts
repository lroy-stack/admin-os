/**
 * The pure half of `npm run probe:consistency` (spec 004, AC6): reading the environment, counting how many reads saw
 * the write, and printing the verdict. Kept apart from the probe so none of it needs a server or a browser.
 */

export type ProbeMode = "web" | "mcp";

export interface ProbeConfig {
  readonly baseUrl: string;
  readonly reads: number;
  readonly mcpToken: string | undefined;
}

export type ProbeOutcome =
  | {
      readonly mode: ProbeMode;
      readonly status: "ran";
      readonly seen: number;
      readonly reads: number;
      readonly session: string;
    }
  | { readonly mode: ProbeMode; readonly status: "skipped"; readonly reason: string };

const DEFAULT_BASE_URL = "http://localhost:8788";
const DEFAULT_READS = 12;
const MAX_READS = 500;
const SESSION_LABEL_LENGTH = 8;

/** `BASE_URL`, `READS` and `MCP_TOKEN` as written; a malformed value fails loudly and says what to write. */
export function parseConfig(env: Readonly<Record<string, string | undefined>>): ProbeConfig {
  const rawReads = env.READS?.trim();
  const reads = rawReads ? Number(rawReads) : DEFAULT_READS;
  if (!Number.isInteger(reads) || reads < 1 || reads > MAX_READS) {
    throw new Error(`READS must be a whole number from 1 to ${MAX_READS}; got "${rawReads}".`);
  }
  const baseUrl = (env.BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  if (!/^https?:\/\/[^/\s]+/.test(baseUrl)) {
    throw new Error(`BASE_URL must start with http:// or https://; got "${baseUrl}".`);
  }
  const mcpToken = env.MCP_TOKEN?.trim() || undefined;
  return { baseUrl, reads, mcpToken };
}

/** The modes named on the command line; none named means both. */
export function parseModes(args: readonly string[]): readonly ProbeMode[] {
  const unknown = args.find((arg) => arg !== "web" && arg !== "mcp");
  if (unknown !== undefined) throw new Error(`Unknown mode "${unknown}"; use web, mcp, or neither for both.`);
  if (args.length === 0) return ["web", "mcp"];
  return (["web", "mcp"] as const).filter((mode) => args.includes(mode));
}

/** How many of the response bodies contain the marker. */
export function countSeen(bodies: readonly string[], marker: string): number {
  return bodies.filter((body) => body.includes(marker)).length;
}

/** The first characters of a session id: enough to tell sessions apart in a log, too few to be used as one. */
export function sessionLabel(sessionId: string): string {
  return sessionId.slice(0, SESSION_LABEL_LENGTH);
}

export function formatOutcome(outcome: ProbeOutcome): string {
  if (outcome.status === "skipped") return `${outcome.mode}: skipped (${outcome.reason})`;
  return `${outcome.mode}: ${outcome.seen}/${outcome.reads} saw the write (session ${outcome.session})`;
}

/** Non-zero when a mode that ran saw fewer reads than it made; a skipped mode is an honest result, not a failure. */
export function exitCodeOf(outcomes: readonly ProbeOutcome[]): 0 | 1 {
  return outcomes.some((outcome) => outcome.status === "ran" && outcome.seen < outcome.reads) ? 1 : 0;
}
