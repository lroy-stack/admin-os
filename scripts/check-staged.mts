import { findViolations, parseStagedDiff } from "./staged-guard.mts";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Run by .husky/pre-commit. Paths of deleted files are allowed, so a commit can still remove a blocked file.
const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" });

const gitDir = git("rev-parse", "--git-common-dir").trim();
const termsFile = join(gitDir, "info", "private-terms");
const terms = existsSync(termsFile) ? readFileSync(termsFile, "utf8").split("\n") : [];

const added = git("diff", "--cached", "--name-only", "--diff-filter=ACMR").split("\n").filter(Boolean);
const changes = parseStagedDiff(git("diff", "--cached", "--unified=0", "--diff-filter=ACMR", "--no-color"));
const pathOnly = added.filter((path) => !changes.some((change) => change.path === path));
const violations = findViolations([...changes, ...pathOnly.map((path) => ({ path, addedLines: [] }))], terms);

if (violations.length > 0) {
  console.error(`Commit blocked:\n${violations.map((violation) => `  - ${violation}`).join("\n")}`);
  process.exit(1);
}
