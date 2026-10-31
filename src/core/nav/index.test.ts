import type { LucideIcon } from "lucide-react";
import { describe, expect, it } from "vitest";

import { type NavEntry, type NavManifest, visibleNavIds } from "./index";

const icon = (() => null) as unknown as LucideIcon;
const entry = (id: string, gate: Pick<NavEntry, "requiredModule" | "requiredPermission">): NavEntry => ({
  id,
  href: `/dashboard/${id}`,
  labelKey: `${id}.title`,
  icon,
  placement: "area",
  group: "operations",
  ...gate,
});

const manifest: NavManifest = [
  entry("home", { requiredModule: "access" }),
  entry("bookings", { requiredPermission: "read:bookings" }),
  entry("billing", { requiredPermission: "manage:settings.billing" }),
  entry("reports", { requiredModule: "reports" }),
  entry("both", { requiredPermission: "read:bookings", requiredModule: "reports" }),
  entry("ungated", {}),
];

describe("visibleNavIds", () => {
  it.each([
    ["an actor with a permission", ["read:bookings"], [], ["home", "bookings"]],
    ["an actor with no permissions", [], ["bookings"], ["home"]],
    ["an enabled aggregator module", [], ["reports"], ["home", "reports"]],
    ["a permission and its module together", ["read:bookings"], ["reports"], ["home", "bookings", "reports", "both"]],
    ["the billing permission", ["manage:settings.billing"], [], ["home", "billing"]],
  ] as const)("lists the visible ids for %s", (_name, permissions, modules, expected) => {
    expect(visibleNavIds(manifest, { permissions }, modules)).toEqual(expected);
  });

  it("never shows an entry without a gate", () => {
    expect(visibleNavIds(manifest, { permissions: ["read:bookings"] }, ["reports"])).not.toContain("ungated");
  });
});
