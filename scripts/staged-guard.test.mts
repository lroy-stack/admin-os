import { describe, expect, it } from "vitest";

import { findViolations, parseStagedDiff } from "./staged-guard.mts";

const TERMS = ["acme-private"];

describe("findViolations", () => {
  it.each([["docs/specs/001-v0-1/plan.md"], ["docs/specs/002-roadmap/spec.md"], [".claude/settings.local.json"]])(
    "blocks %s",
    (path) => {
      expect(findViolations([{ path, addedLines: [] }], TERMS)).toEqual([
        `${path}: this path stays local (planning docs and agent files are never committed)`,
      ]);
    },
  );

  it.each([["docs/adr/0001-floor-plan-rendering.md"], ["README.md"], ["src/core/result/index.ts"]])(
    "allows %s",
    (path) => {
      expect(findViolations([{ path, addedLines: [{ line: 1, text: "generic text" }] }], TERMS)).toEqual([]);
    },
  );

  it("reports a private name in an added line, case-insensitively, with its location", () => {
    const changes = [{ path: "src/a.ts", addedLines: [{ line: 7, text: "// ported from ACME-Private" }] }];
    expect(findViolations(changes, TERMS)).toEqual(["src/a.ts:7: a private name"]);
  });

  it("ignores blank lines in the private terms file", () => {
    const changes = [{ path: "src/a.ts", addedLines: [{ line: 1, text: "anything at all" }] }];
    expect(findViolations(changes, ["", "  "])).toEqual([]);
  });
});

describe("parseStagedDiff", () => {
  it("collects added lines with their new line numbers per file", () => {
    const diff = [
      "diff --git a/src/a.ts b/src/a.ts",
      "--- a/src/a.ts",
      "+++ b/src/a.ts",
      "@@ -3,0 +4,2 @@",
      "+first",
      "+second",
      "diff --git a/README.md b/README.md",
      "--- a/README.md",
      "+++ b/README.md",
      "@@ -10 +10 @@",
      "-old",
      "+new",
    ].join("\n");
    expect(parseStagedDiff(diff)).toEqual([
      {
        path: "src/a.ts",
        addedLines: [
          { line: 4, text: "first" },
          { line: 5, text: "second" },
        ],
      },
      { path: "README.md", addedLines: [{ line: 10, text: "new" }] },
    ]);
  });
});
