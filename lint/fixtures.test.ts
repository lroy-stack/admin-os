import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Runs Biome with the repo's own config over lint/fixtures: every file in leaks/ must raise exactly the diagnostic
// the finished-folder override promises (spec 001, AC2), every file in allowed/ none. The config is the repo's
// biome.json with the override widened to the fixture directory, so a change to the rules or the plugin list is what
// these tests exercise.

const root = resolve(import.meta.dirname, "..");
const fixtures = resolve(import.meta.dirname, "fixtures");

interface Diagnostic {
  readonly category: string;
  readonly description: string;
  readonly location: { readonly path: string };
}

const filesIn = (folder: string) => readdirSync(join(fixtures, folder)).filter((file) => file.endsWith(".tsx"));

const NO_JSX_LITERALS = "lint/style/noJsxLiterals";
const PLUGIN = "plugin";

const expectedLeaks: Readonly<Record<string, string>> = {
  "braced-child-single-quoted.tsx": PLUGIN,
  "braced-child.tsx": PLUGIN,
  "braced-literal-prop.tsx": PLUGIN,
  "braced-placeholder.tsx": PLUGIN,
  "caption-prop.tsx": PLUGIN,
  "conditional-alternate-child.tsx": PLUGIN,
  "conditional-alternate-prop.tsx": PLUGIN,
  "conditional-child.tsx": PLUGIN,
  "conditional-prop.tsx": PLUGIN,
  "heading-prop.tsx": PLUGIN,
  "literal-prop.tsx": PLUGIN,
  "message-prop.tsx": PLUGIN,
  "single-quoted-braced-prop.tsx": PLUGIN,
  "sr-only-braced-child.tsx": PLUGIN,
  "suffix-message-prop.tsx": PLUGIN,
  "summary-prop.tsx": PLUGIN,
  "template-child.tsx": PLUGIN,
  "template-prop.tsx": PLUGIN,
  "text-child.tsx": NO_JSX_LITERALS,
};

let workdir = "";
let diagnostics: Diagnostic[] = [];

beforeAll(() => {
  workdir = mkdtempSync(join(tmpdir(), "admin-os-lint-"));
  cpSync(fixtures, workdir, { recursive: true });

  const config = JSON.parse(readFileSync(join(root, "biome.json"), "utf8"));
  const finished = config.overrides.find((override: { plugins?: string[] }) => override.plugins !== undefined);
  const { $schema: _schema, vcs: _vcs, ...rest } = config;
  writeFileSync(
    join(workdir, "biome.json"),
    JSON.stringify({
      ...rest,
      files: { ...config.files, includes: ["**"] },
      overrides: [
        {
          ...finished,
          includes: ["**"],
          plugins: finished.plugins.map((plugin: string) => resolve(root, plugin)),
        },
      ],
    }),
  );

  // Biome exits non-zero when it reports errors, which is the point here; the report is read from stdout.
  const run = () =>
    execFileSync(
      join(root, "node_modules/.bin/biome"),
      ["lint", "--reporter=json", "--max-diagnostics=500", `--config-path=${workdir}`, workdir],
      { cwd: workdir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
  let output = "";
  try {
    output = run();
  } catch (error) {
    output = (error as { stdout: string }).stdout;
  }
  diagnostics = JSON.parse(output).diagnostics;
}, 60_000);

afterAll(() => {
  rmSync(workdir, { recursive: true, force: true });
});

const categoriesOf = (folder: string, file: string) =>
  diagnostics
    .filter((diagnostic) => diagnostic.location.path.endsWith(`${folder}/${file}`))
    .filter((diagnostic) => diagnostic.category === NO_JSX_LITERALS || diagnostic.category === PLUGIN)
    .map((diagnostic) => diagnostic.category);

describe("visible-text lint fixtures", () => {
  it("covers every leak fixture on disk", () => {
    expect(filesIn("leaks").sort()).toEqual(Object.keys(expectedLeaks).sort());
  });

  it.each(Object.entries(expectedLeaks))("flags %s once", (file, category) => {
    expect(categoriesOf("leaks", file)).toEqual([category]);
  });

  it.each(filesIn("allowed"))("allows %s", (file) => {
    expect(categoriesOf("allowed", file)).toEqual([]);
  });
});
