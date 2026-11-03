import { describe, expect, it } from "vitest";
import { z } from "zod";

import { catalogPermissions, DEFAULT_ROLES, moduleOf, permissionsOf, type RolePreset } from "@/core/access";
import { type Catalog, defineCapability } from "@/core/capability";

const capability = <const Id extends string>(
  id: Id,
  permission: `${string}:${string}`,
  effect: "read" | "write" | "destructive",
  elevated?: boolean,
) =>
  defineCapability({
    id,
    summary: id,
    input: z.object({}),
    output: z.object({}),
    permission,
    effect,
    riskTier: effect === "read" ? 0 : 2,
    elevated,
  });

const catalog: Catalog = {
  "notes.list": capability("notes.list", "read:notes", "read"),
  "notes.create": capability("notes.create", "create:notes", "write"),
  "notes.delete": capability("notes.delete", "delete:notes", "destructive"),
  "notes.export": capability("notes.export", "export:notes", "read", true),
  "billing.list": capability("billing.list", "read:billing", "read"),
};

const roleNamed = (id: string) => DEFAULT_ROLES.find((role) => role.id === id) as RolePreset;

describe("moduleOf", () => {
  it("is the first segment of a capability id", () => {
    expect(moduleOf("bookings.list")).toBe("bookings");
  });
});

describe("permissionsOf", () => {
  it.each([
    ["owner", ["create:notes", "delete:notes", "export:notes", "read:notes"]],
    ["manager", ["create:notes", "delete:notes", "read:notes"]],
    ["staff", ["create:notes", "read:notes"]],
  ] as const)("%s over the notes module", (id, expected) => {
    expect(permissionsOf(roleNamed(id), catalog, ["notes"])).toEqual(expected);
  });

  it("grants nothing of a disabled module", () => {
    expect(permissionsOf(roleNamed("owner"), catalog, ["notes"])).not.toContain("read:billing");
  });

  it("grants nothing when no module is enabled", () => {
    expect(permissionsOf(roleNamed("owner"), catalog, [])).toEqual([]);
  });

  it("withholds a slug shared by a write and a destructive capability from staff", () => {
    const shared: Catalog = {
      "notes.update": capability("notes.update", "manage:notes", "write"),
      "notes.purge": capability("notes.purge", "manage:notes", "destructive"),
    };
    expect(permissionsOf(roleNamed("staff"), shared, ["notes"])).toEqual([]);
  });

  it("withholds a slug shared by a plain and an elevated capability from managers", () => {
    const shared: Catalog = {
      "notes.update": capability("notes.update", "manage:notes", "write"),
      "notes.audit": capability("notes.audit", "manage:notes", "read", true),
    };
    expect(permissionsOf(roleNamed("manager"), shared, ["notes"])).toEqual([]);
  });

  it("ignores a denied capability of a disabled module that shares the slug", () => {
    const shared: Catalog = {
      "notes.update": capability("notes.update", "manage:shared", "write"),
      "billing.purge": capability("billing.purge", "manage:shared", "destructive"),
    };
    expect(permissionsOf(roleNamed("staff"), shared, ["notes"])).toEqual(["manage:shared"]);
  });
});

describe("catalogPermissions", () => {
  it("lists the distinct permissions of the enabled modules, sorted", () => {
    expect(catalogPermissions(catalog, ["billing", "notes"])).toEqual([
      "create:notes",
      "delete:notes",
      "export:notes",
      "read:billing",
      "read:notes",
    ]);
  });
});

describe("kernel modules", () => {
  const withKernel: Catalog = {
    ...catalog,
    "access.me.get": capability("access.me.get", "read:access", "read"),
    "clock.get": capability("clock.get", "read:clock", "read"),
  };

  it.each(DEFAULT_ROLES.map((role) => [role.id, role] as const))(
    "%s reads the actor and the clock even when no business module is enabled",
    (_id, role) => {
      expect(permissionsOf(role, withKernel, [])).toEqual(["read:access", "read:clock"]);
    },
  );

  it("lists the kernel permissions in the catalogue's permissions", () => {
    expect(catalogPermissions(withKernel, [])).toEqual(["read:access", "read:clock"]);
  });
});
