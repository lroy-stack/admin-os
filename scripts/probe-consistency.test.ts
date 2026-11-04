import { describe, expect, it } from "vitest";

import {
  consentOutcome,
  countSeen,
  exitCodeOf,
  formatOutcome,
  type ProbeOutcome,
  parseConfig,
  parseModes,
  sessionIdOf,
  sessionLabel,
  setCookieValue,
} from "./probe-consistency-report";

/** The pure half of `npm run probe:consistency` (spec 004, AC6): what counts as seen, and what the probe prints. */

const ran = (mode: "web" | "mcp", seen: number, reads = 12): ProbeOutcome => ({
  mode,
  status: "ran",
  seen,
  reads,
  session: "3f9a1c7e",
});
const skipped = (mode: "web" | "mcp", reason: string): ProbeOutcome => ({ mode, status: "skipped", reason });

describe("countSeen", () => {
  it.each([
    [["<h3>Probe 17</h3>", "<h3>Probe 17</h3>", "<h3>Probe 17</h3>"], 3],
    [["<h3>Probe 17</h3>", "<h3>Bravo</h3>", "", "<h3>Probe 17</h3>"], 2],
    [["<h3>Bravo</h3>", ""], 0],
    [[], 0],
  ] as const)("counts the bodies that contain the marker: %j", (bodies, expected) => {
    expect(countSeen(bodies, "Probe 17")).toBe(expected);
  });

  it("does not take a shorter marker for the one it looks for", () => {
    expect(countSeen(["Probe 1"], "Probe 17")).toBe(0);
  });
});

describe("formatOutcome", () => {
  it("prints how many reads saw the write and the first 8 characters of the session", () => {
    expect(formatOutcome(ran("web", 12))).toBe("web: 12/12 saw the write (session 3f9a1c7e)");
  });

  it("prints a partial result as it is, so a stale isolate shows", () => {
    expect(formatOutcome(ran("mcp", 1))).toBe("mcp: 1/12 saw the write (session 3f9a1c7e)");
  });

  it("prints a skipped mode with its reason", () => {
    expect(formatOutcome(skipped("mcp", "server is read-only"))).toBe("mcp: skipped (server is read-only)");
  });
});

describe("sessionLabel", () => {
  it("keeps the first 8 characters only", () => {
    expect(sessionLabel("3f9a1c7e-0b2d-4c55-9d1a-aaaaaaaaaaaa")).toBe("3f9a1c7e");
  });
});

describe("exitCodeOf", () => {
  it.each([
    ["every read saw the write", [ran("web", 12), ran("mcp", 12)], 0],
    ["one read missed it", [ran("web", 11)], 1],
    ["only one of two modes missed it", [ran("web", 12), ran("mcp", 3)], 1],
    ["the other mode was skipped", [ran("web", 12), skipped("mcp", "server is read-only")], 0],
    ["everything was skipped", [skipped("mcp", "server is read-only")], 0],
  ] as const)("is %s", (_case, outcomes, expected) => {
    expect(exitCodeOf(outcomes)).toBe(expected);
  });
});

describe("parseConfig", () => {
  it("defaults to the local wrangler dev ports and 12 reads, with no MCP token", () => {
    expect(parseConfig({})).toEqual({
      baseUrl: "http://localhost:8788",
      mcpUrl: "http://localhost:8789/mcp",
      reads: 12,
      mcpToken: undefined,
    });
  });

  it("reads the four variables and drops a trailing slash from the web URL", () => {
    expect(
      parseConfig({
        BASE_URL: "https://admin-os.lr0y.dev/",
        MCP_URL: "https://mcp.admin-os.lr0y.dev/mcp",
        READS: "5",
        MCP_TOKEN: " t0ken ",
      }),
    ).toEqual({
      baseUrl: "https://admin-os.lr0y.dev",
      mcpUrl: "https://mcp.admin-os.lr0y.dev/mcp",
      reads: 5,
      mcpToken: "t0ken",
    });
  });

  it("treats an empty MCP_TOKEN as unset", () => {
    expect(parseConfig({ MCP_TOKEN: "" }).mcpToken).toBeUndefined();
  });

  it.each(["0", "-1", "1.5", "twelve", "501"])("refuses READS=%s and says what to write", (reads) => {
    expect(() => parseConfig({ READS: reads })).toThrow(/READS must be a whole number from 1 to 500/);
  });

  it("refuses a BASE_URL without a scheme", () => {
    expect(() => parseConfig({ BASE_URL: "localhost:8788" })).toThrow(/BASE_URL must start with http/);
  });

  it("refuses an MCP_URL without a scheme", () => {
    expect(() => parseConfig({ MCP_URL: "localhost:8789/mcp" })).toThrow(/MCP_URL must start with http/);
  });
});

describe("parseModes", () => {
  it.each([
    [[], ["web", "mcp"]],
    [["web"], ["web"]],
    [["mcp"], ["mcp"]],
    [
      ["mcp", "web"],
      ["web", "mcp"],
    ],
  ] as const)("reads %j as %j", (args, expected) => {
    expect(parseModes(args)).toEqual(expected);
  });

  it("refuses a mode it does not know", () => {
    expect(() => parseModes(["both"])).toThrow(/Unknown mode "both"/);
  });

  it("reads consent as a mode of its own", () => {
    expect(parseModes(["consent"])).toEqual(["consent"]);
  });

  it("keeps the fixed order whatever the command line says", () => {
    expect(parseModes(["consent", "web"])).toEqual(["web", "consent"]);
  });

  it("leaves consent out when no mode is named, as it registers a client", () => {
    expect(parseModes([])).toEqual(["web", "mcp"]);
  });
});

/** The consent probe (plan 005-D3): the cookie the web app signed against the one the consent page renewed. */

const WEB_SESSION = "3f9a1c7e-0b2d-4c55-9d1a-aaaaaaaaaaaa";
const OTHER_SESSION = "9b2e41d0-0000-4000-8000-000000000000";
const WEB_COOKIE = `${WEB_SESSION}.1793800000.c2lnbmF0dXJl`;
const renewedLine = (sessionId: string): string =>
  `demo_sid=${encodeURIComponent(`${sessionId}.1793800100.b3RoZXI`)}; Path=/; Max-Age=7200; HttpOnly; SameSite=Lax`;

describe("sessionIdOf", () => {
  it("is the part of a signed demo_sid before the first dot", () => {
    expect(sessionIdOf(WEB_COOKIE)).toBe(WEB_SESSION);
  });
});

describe("setCookieValue", () => {
  it("reads the value of the named cookie and drops its attributes", () => {
    expect(setCookieValue(["demo_role=owner; Path=/", renewedLine(WEB_SESSION)], "demo_sid")).toBe(
      `${WEB_SESSION}.1793800100.b3RoZXI`,
    );
  });

  it("keeps the last of two cookies with the same name, as a browser does", () => {
    expect(setCookieValue(["demo_sid=first; Path=/", "demo_sid=second; Path=/"], "demo_sid")).toBe("second");
  });

  it("is undefined when no line sets the cookie", () => {
    expect(setCookieValue(["demo_role=owner; Path=/"], "demo_sid")).toBeUndefined();
  });

  it("does not take a cookie whose name only ends like the one it looks for", () => {
    expect(setCookieValue(["x_demo_sid=nope; Path=/"], "demo_sid")).toBeUndefined();
  });
});

describe("consentOutcome", () => {
  it("keeps the web session and the renewed one apart", () => {
    expect(consentOutcome(WEB_COOKIE, [renewedLine(OTHER_SESSION)])).toEqual({
      mode: "consent",
      status: "ran",
      webSession: WEB_SESSION,
      renewedSession: OTHER_SESSION,
    });
  });

  it("leaves the renewed session undefined when the consent page set no demo_sid", () => {
    expect(consentOutcome(WEB_COOKIE, [])).toMatchObject({ webSession: WEB_SESSION, renewedSession: undefined });
  });
});

describe("the consent probe's verdict", () => {
  const same = consentOutcome(WEB_COOKIE, [renewedLine(WEB_SESSION)]);
  const other = consentOutcome(WEB_COOKIE, [renewedLine(OTHER_SESSION)]);
  const none = consentOutcome(WEB_COOKIE, []);

  it("prints a pass when the renewed cookie carries the same session id", () => {
    expect(formatOutcome(same)).toBe("consent: the renewed cookie carries the web app's session (session 3f9a1c7e)");
  });

  it("exits 0 when the renewed cookie carries the same session id", () => {
    expect(exitCodeOf([same])).toBe(0);
  });

  it("names both sessions and the trailing newline when the consent page started another session", () => {
    expect(formatOutcome(other)).toMatch(
      /^consent: MISMATCH, the web app's session 3f9a1c7e came back as 9b2e41d0\. .*trailing newline included\.$/,
    );
  });

  it("exits 1 when the consent page started another session", () => {
    expect(exitCodeOf([other])).toBe(1);
  });

  it("says no cookie came back when the consent page set none", () => {
    expect(formatOutcome(none)).toMatch(/^consent: MISMATCH, .* came back with no demo_sid cookie\. /);
  });

  it("exits 1 when the consent page set no cookie", () => {
    expect(exitCodeOf([none])).toBe(1);
  });

  it("fails the whole run when only consent is wrong", () => {
    expect(exitCodeOf([ran("web", 12), ran("mcp", 12), other])).toBe(1);
  });
});
