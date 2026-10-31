import { describe, expect, it } from "vitest";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const modulesDir = __dirname;

const schemaFiles = readdirSync(modulesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(modulesDir, entry.name, "schema.ts"))
  .map((path) => [path.slice(modulesDir.length + 1), readFileSync(path, "utf8")] as const);

describe("generic module schemas", () => {
  it.each(schemaFiles)("%s never reads an ext property", (_path, source) => {
    expect(source).not.toMatch(/\.ext\b/);
  });

  it.each(schemaFiles)("%s defines ext only as an optional record of unknown", (_path, source) => {
    const definitions = source.match(/\bext:.*$/gm) ?? [];
    expect(definitions.filter((line) => line.trim() !== "ext: z.record(z.string(), z.unknown()).optional(),")).toEqual(
      [],
    );
  });
});
