/**
 * Pre-commit guard for a public repository: planning documents and local agent files never get committed, and
 * neither do names that must stay private. Those names are listed one per line in `.git/info/private-terms`, a file
 * inside `.git` that git never commits, so the public repository never contains the names it protects.
 */

/** Paths that stay on the developer's machine: planning specs and local agent state. */
export const BLOCKED_PATHS: readonly RegExp[] = [/^docs\/specs\//, /^\.claude\//];

export interface StagedChange {
  readonly path: string;
  /** Lines this commit adds to the file, with their line numbers in the new version. */
  readonly addedLines: readonly { readonly line: number; readonly text: string }[];
}

/** One message per problem, ready to print; empty when the commit may proceed. */
export function findViolations(changes: readonly StagedChange[], privateTerms: readonly string[]): string[] {
  const terms = privateTerms.map((term) => term.trim().toLowerCase()).filter(Boolean);
  return changes.flatMap((change) => {
    const blocked = BLOCKED_PATHS.some((pattern) => pattern.test(change.path))
      ? [`${change.path}: this path stays local (planning docs and agent files are never committed)`]
      : [];
    const leaks = change.addedLines.flatMap(({ line, text }) =>
      terms.filter((term) => text.toLowerCase().includes(term)).map(() => `${change.path}:${line}: a private name`),
    );
    return [...blocked, ...leaks];
  });
}

/** Parses `git diff --cached --unified=0` into the added lines per file. */
export function parseStagedDiff(diff: string): StagedChange[] {
  const changes: { path: string; addedLines: { line: number; text: string }[] }[] = [];
  let current: (typeof changes)[number] | undefined;
  let nextLine = 0;
  for (const row of diff.split("\n")) {
    const file = /^\+\+\+ b\/(.+)$/.exec(row);
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(row);
    if (file) {
      current = { path: file[1] ?? "", addedLines: [] };
      changes.push(current);
    } else if (hunk) {
      nextLine = Number(hunk[1]);
    } else if (current && row.startsWith("+") && !row.startsWith("+++")) {
      current.addedLines.push({ line: nextLine, text: row.slice(1) });
      nextLine += 1;
    }
  }
  return changes;
}
