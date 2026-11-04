import { describe, expect, it } from "vitest";
import { z } from "zod";

import { defineCapability } from "@/core/capability";

import { effectivePermissions, needsWriteScope, scopesOf } from "./server";

const output = z.object({});

const notesList = defineCapability({
  id: "notes.list",
  summary: "List notes.",
  input: z.strictObject({}),
  output,
  permission: "read:notes",
  effect: "read",
  riskTier: 0,
});

const notesAdd = defineCapability({
  id: "notes.add",
  summary: "Add a note.",
  input: z.strictObject({}),
  output,
  permission: "create:notes",
  effect: "write",
  riskTier: 2,
  change: "add",
  idempotency: "key",
});

const notesClear = defineCapability({
  id: "notes.clear",
  summary: "Delete every note.",
  input: z.strictObject({}),
  output,
  permission: "delete:notes",
  effect: "destructive",
  riskTier: 3,
  change: "remove",
  idempotency: "target-state",
});

/** A read that shares its permission slug with a write: the slug is a write's, so `read` alone never grants it. */
const tagsList = defineCapability({
  id: "tags.list",
  summary: "List tags.",
  input: z.strictObject({}),
  output,
  permission: "manage:tags",
  effect: "read",
  riskTier: 0,
});

const tagsSet = defineCapability({
  id: "tags.set",
  summary: "Set tags.",
  input: z.strictObject({}),
  output,
  permission: "manage:tags",
  effect: "write",
  riskTier: 2,
  change: "set",
  idempotency: "target-state",
});

const CATALOG = {
  "notes.list": notesList,
  "notes.add": notesAdd,
  "notes.clear": notesClear,
  "tags.list": tagsList,
  "tags.set": tagsSet,
};

const OWNER = ["create:notes", "delete:notes", "manage:tags", "read:notes"];
const STAFF = ["create:notes", "read:notes"];

describe("effectivePermissions (spec 004 D3)", () => {
  it("keeps only the role's read permissions with read", () => {
    expect(effectivePermissions(CATALOG, OWNER, ["read"])).toEqual(["read:notes"]);
  });

  it("adds the role's writes with write", () => {
    expect(effectivePermissions(CATALOG, OWNER, ["read", "write"])).toEqual(OWNER);
  });

  it("treats write as including read", () => {
    expect(effectivePermissions(CATALOG, STAFF, ["write"])).toEqual(STAFF);
  });

  it("never grants more than the role holds", () => {
    expect(effectivePermissions(CATALOG, STAFF, ["read", "write"])).not.toContain("delete:notes");
  });

  it("keeps nothing without a scope", () => {
    expect(effectivePermissions(CATALOG, OWNER, [])).toEqual([]);
  });

  it("does not let read reach a slug a write shares", () => {
    expect(effectivePermissions(CATALOG, OWNER, ["read"])).not.toContain("manage:tags");
  });
});

describe("needsWriteScope (ADR 0016, resolution 1)", () => {
  it.each([
    ["a write the role holds, with read", notesAdd, OWNER, ["read"], true],
    ["a destructive write the role holds, with read", notesClear, OWNER, ["read"], true],
    ["a write the role lacks, with read", notesClear, STAFF, ["read"], false],
    ["a write with write", notesAdd, OWNER, ["read", "write"], false],
    ["a read with read", notesList, OWNER, ["read"], false],
  ] as const)("is %s: %s", (_case, capability, role, scopes, expected) => {
    expect(needsWriteScope(CATALOG, capability, role, scopes)).toBe(expected);
  });
});

describe("scopesOf", () => {
  it("keeps the scopes this server knows and drops the rest", () => {
    expect(scopesOf(["offline_access", "write", "read", "admin"])).toEqual(["read", "write"]);
  });
});
