import { describe, expect, it } from "vitest";

import {
  countSeen,
  exitCodeOf,
  formatOutcome,
  type ProbeOutcome,
  parseConfig,
  parseModes,
  sessionLabel,
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
});
