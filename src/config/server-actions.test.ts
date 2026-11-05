import { describe, expect, it } from "vitest";

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Every export of a `"use server"` module is a public endpoint that any visitor can call with any arguments. This
 * inventory makes adding one a reviewed change: confirm the new action validates every argument, never reads or
 * writes a cookie whose name comes from the caller, and checks permission or the demo flag, then list it here.
 */
const REVIEWED_ACTIONS: Readonly<Record<string, readonly string[]>> = {
  "src/app/(main)/dashboard/_components/demo-actions.ts": ["resetDemoData", "setDemoPreset", "setDemoRole"],
  "src/app/(main)/dashboard/_components/notification-actions.ts": ["bellAction"],
  "src/app/(main)/dashboard/bookings/actions.ts": [
    "advanceStatus",
    "cancelBooking",
    "createGuest",
    "createReservation",
    "findAvailability",
    "markNoShow",
    "searchGuests",
    "seatWalkIn",
    "undoStatus",
    "undoWalkIn",
  ],
  "src/app/(main)/dashboard/customers/actions.ts": ["createContact", "findDuplicateContacts"],
  "src/app/(main)/dashboard/settings/actions.ts": ["updateBusinessDetails"],
  "src/ds/preferences/actions.ts": ["setCurrency", "setLocale", "setPreference"],
};

const ROOT = join(__dirname, "..", "..");

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });

const actionModules = sourceFiles(join(ROOT, "src"))
  .filter((path) => /^\s*["']use server["']/.test(readFileSync(path, "utf8")))
  .map((path) => relative(ROOT, path))
  .sort();

const exportsOf = (path: string) =>
  [...readFileSync(join(ROOT, path), "utf8").matchAll(/^export\s+(?:async\s+function|function|const|let)\s+(\w+)/gm)]
    .map((match) => match[1])
    .sort();

type Actions = Readonly<Record<string, readonly string[]>>;

/**
 * What the inventory finds (spec 006 D12): a use-server module nobody reviewed and a module whose exports differ from
 * its reviewed list fail; a reviewed module whose file is gone is only reported (stale), so removing a module never
 * fails it. `main` carries no stale entry at release.
 */
function inventoryReport(present: Actions, reviewed: Actions) {
  const sorted = (names: readonly string[]) => [...names].sort().join(",");
  return {
    unreviewed: Object.keys(present).filter((path) => !(path in reviewed)),
    mismatched: Object.keys(present).filter(
      (path) => path in reviewed && sorted(present[path] ?? []) !== sorted(reviewed[path] ?? []),
    ),
    stale: Object.keys(reviewed).filter((path) => !(path in present)),
  };
}

const report = inventoryReport(
  Object.fromEntries(actionModules.map((path) => [path, exportsOf(path)])),
  REVIEWED_ACTIONS,
);

describe("Server Actions inventory", () => {
  it("has no unreviewed use-server module", () => {
    expect(report.unreviewed).toEqual([]);
  });

  it("has each reviewed module export only its reviewed actions", () => {
    expect(report.mismatched).toEqual([]);
  });

  // The release check: `RELEASE=1 npx vitest run src/config/server-actions.test.ts` must show stale = 0.
  it.skipIf(process.env.RELEASE !== "1")(
    `has no stale entry at release (stale = ${report.stale.length}${report.stale.length > 0 ? `: ${report.stale.join(", ")}` : ""})`,
    () => {
      expect(report.stale).toEqual([]);
    },
  );
});

describe("the inventory rule (spec 006 D12), on a fixture tree", () => {
  const reviewed: Actions = { "kept.ts": ["one"], "gone.ts": ["two"] };

  it("reports a listed file that no longer exists, and passes", () => {
    expect(inventoryReport({ "kept.ts": ["one"] }, reviewed)).toEqual({
      unreviewed: [],
      mismatched: [],
      stale: ["gone.ts"],
    });
  });

  it("fails a present export that is not listed", () => {
    expect(inventoryReport({ "kept.ts": ["one", "extra"] }, reviewed).mismatched).toEqual(["kept.ts"]);
  });

  it("fails a renamed export", () => {
    expect(inventoryReport({ "kept.ts": ["uno"] }, reviewed).mismatched).toEqual(["kept.ts"]);
  });

  it("fails a use-server module nobody reviewed", () => {
    expect(inventoryReport({ "kept.ts": ["one"], "new.ts": ["three"] }, reviewed).unreviewed).toEqual(["new.ts"]);
  });
});
