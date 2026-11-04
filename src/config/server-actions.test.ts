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
  "src/app/(main)/dashboard/_components/notification-actions.ts": [
    "approveHeldWrite",
    "loadNotifications",
    "markAllNotificationsRead",
    "markNotificationsRead",
    "rejectHeldWrite",
  ],
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

describe("Server Actions inventory", () => {
  it("has no unreviewed use-server module", () => {
    expect(actionModules).toEqual(Object.keys(REVIEWED_ACTIONS).sort());
  });

  it.each(Object.entries(REVIEWED_ACTIONS))("%s exports only its reviewed actions", (path, reviewed) => {
    expect(exportsOf(path)).toEqual([...reviewed].sort());
  });
});
