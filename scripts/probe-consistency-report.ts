/**
 * The pure half of `npm run probe:consistency` (spec 004, AC6): reading the environment, counting how many reads saw
 * the write, and printing the verdict. Kept apart from the probe so none of it needs a server or a browser.
 */

export type ProbeMode = "web" | "mcp" | "consent";

/** The modes that count reads of one write (spec 004, AC6). */
export type ReadsMode = "web" | "mcp";

export interface ProbeConfig {
  readonly baseUrl: string;
  /** The MCP Worker's endpoint (ADR 0016); the web app no longer serves MCP. */
  readonly mcpUrl: string;
  readonly reads: number;
  readonly mcpToken: string | undefined;
}

export type ProbeOutcome =
  | {
      readonly mode: ReadsMode;
      readonly status: "ran";
      readonly seen: number;
      readonly reads: number;
      readonly session: string;
    }
  | {
      readonly mode: "consent";
      readonly status: "ran";
      /** The session id the web app signed into the visitor's `demo_sid`. */
      readonly webSession: string;
      /** The session id in the `demo_sid` the consent page renewed; undefined when it set none. */
      readonly renewedSession: string | undefined;
    }
  | { readonly mode: ProbeMode; readonly status: "skipped"; readonly reason: string };

const DEFAULT_BASE_URL = "http://localhost:8788";
const DEFAULT_MCP_URL = "http://localhost:8789/mcp";
const DEFAULT_READS = 12;
const MAX_READS = 500;
const SESSION_LABEL_LENGTH = 8;

/** `BASE_URL`, `MCP_URL`, `READS` and `MCP_TOKEN` as written; a malformed value fails loudly and says what to write. */
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
  const mcpUrl = env.MCP_URL?.trim() || DEFAULT_MCP_URL;
  if (!/^https?:\/\/[^/\s]+/.test(mcpUrl)) {
    throw new Error(`MCP_URL must start with http:// or https://; got "${mcpUrl}".`);
  }
  const mcpToken = env.MCP_TOKEN?.trim() || undefined;
  return { baseUrl, mcpUrl, reads, mcpToken };
}

const ALL_MODES = ["web", "mcp", "consent"] as const;

/** The modes named on the command line, in a fixed order; none named means web and mcp (consent is asked for). */
export function parseModes(args: readonly string[]): readonly ProbeMode[] {
  const unknown = args.find((arg) => !(ALL_MODES as readonly string[]).includes(arg));
  if (unknown !== undefined) {
    throw new Error(`Unknown mode "${unknown}"; use web, mcp, consent, or none for web and mcp.`);
  }
  if (args.length === 0) return ["web", "mcp"];
  return ALL_MODES.filter((mode) => args.includes(mode));
}

/** How many of the response bodies contain the marker. */
export function countSeen(bodies: readonly string[], marker: string): number {
  return bodies.filter((body) => body.includes(marker)).length;
}

/** The first characters of a session id: enough to tell sessions apart in a log, too few to be used as one. */
export function sessionLabel(sessionId: string): string {
  return sessionId.slice(0, SESSION_LABEL_LENGTH);
}

/** The session id a signed `demo_sid` carries: `<session id>.<issued at>.<signature>` (`src/config/demo-session.ts`). */
export function sessionIdOf(cookieValue: string): string {
  return cookieValue.split(".")[0] ?? "";
}

/**
 * The value of cookie `name` in a response's `Set-Cookie` lines, or undefined when none sets it; the last one wins, as
 * a browser keeps the last. Values are percent-decoded, as the Workers write them.
 */
export function setCookieValue(setCookieLines: readonly string[], name: string): string | undefined {
  return setCookieLines
    .map((line) => line.split(";")[0] ?? "")
    .filter((pair) => pair.startsWith(`${name}=`))
    .map((pair) => decodeURIComponent(pair.slice(name.length + 1)))
    .at(-1);
}

/** The consent verdict: the cookie the web app signed against the one the consent page renewed. */
export function consentOutcome(webCookie: string, setCookieLines: readonly string[]): ProbeOutcome {
  const renewed = setCookieValue(setCookieLines, "demo_sid");
  return {
    mode: "consent",
    status: "ran",
    webSession: sessionIdOf(webCookie),
    renewedSession: renewed === undefined ? undefined : sessionIdOf(renewed),
  };
}

const SECRET_HINT =
  "The consent page did not recognise the web app's demo_sid, so DEMO_SESSION_SECRET differs between the two Workers; compare the values byte for byte, a trailing newline included.";

export function formatOutcome(outcome: ProbeOutcome): string {
  if (outcome.status === "skipped") return `${outcome.mode}: skipped (${outcome.reason})`;
  if (outcome.mode !== "consent") {
    return `${outcome.mode}: ${outcome.seen}/${outcome.reads} saw the write (session ${outcome.session})`;
  }
  const web = sessionLabel(outcome.webSession);
  if (outcome.renewedSession === undefined) {
    return `consent: MISMATCH, the web app's session ${web} came back with no demo_sid cookie. ${SECRET_HINT}`;
  }
  if (outcome.renewedSession !== outcome.webSession) {
    return `consent: MISMATCH, the web app's session ${web} came back as ${sessionLabel(outcome.renewedSession)}. ${SECRET_HINT}`;
  }
  return `consent: the renewed cookie carries the web app's session (session ${web})`;
}

const failed = (outcome: ProbeOutcome): boolean => {
  if (outcome.status !== "ran") return false;
  if (outcome.mode === "consent") return outcome.renewedSession !== outcome.webSession;
  return outcome.seen < outcome.reads;
};

/** Non-zero when a mode that ran saw fewer reads than it made or lost the session; a skipped mode is not a failure. */
export function exitCodeOf(outcomes: readonly ProbeOutcome[]): 0 | 1 {
  return outcomes.some(failed) ? 1 : 0;
}
