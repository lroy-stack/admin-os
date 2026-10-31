import { describe, expect, it } from "vitest";

import { LOCALES } from "@/core/i18n";
import { navMessages } from "@/navigation/shell/nav-messages.server";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { localizeNavItems, localizeSearchGroups, shellRailItems, shellSearchGroups, shellTopItems } from "./shell-data";

const navIds = [
  ...sidebarItems.map((group) => group.id),
  ...sidebarItems.flatMap((group) =>
    group.items.flatMap((item) => [item.id, ...(item.subItems ?? []).map((sub) => sub.id)]),
  ),
];

const searchItems = shellSearchGroups.flatMap((group) => group.items);
const labelsOf = (groups: typeof shellSearchGroups) => groups.flatMap((group) => group.items.map((i) => i.label));

describe("shell navigation labels", () => {
  it.each(LOCALES)("%s translates every sidebar id", (locale) => {
    const missing = navIds.filter((id) => !(id in navMessages[locale]));
    expect(missing).toEqual([]);
  });

  it("English labels equal the source titles, so there is one source of truth", () => {
    expect(localizeNavItems(shellTopItems, navMessages.en)).toEqual(shellTopItems);
    expect(localizeNavItems(shellRailItems, navMessages.en)).toEqual(shellRailItems);
    expect(localizeSearchGroups(shellSearchGroups, navMessages.en)).toEqual(shellSearchGroups);
  });

  it("translates top and rail titles by id", () => {
    expect(localizeNavItems(shellTopItems, navMessages.es).map((item) => item.title)).toContain("Reservas");
    expect(localizeNavItems(shellRailItems, navMessages.es).map((item) => item.title)).toContain("Tareas");
  });

  it("translates search group labels by stable id, not by index", () => {
    expect(localizeSearchGroups(shellSearchGroups, navMessages.de).map((group) => group.label)).toContain("Seiten");
  });

  it("translates every search item label", () => {
    const translated = labelsOf(localizeSearchGroups(shellSearchGroups, navMessages.fr));
    expect(translated).toContain("Réservations");
    expect(translated).toHaveLength(searchItems.length);
  });

  it("keeps the source label for an id the dictionary does not know", () => {
    const item = { id: "unknown", title: "Unknown", url: "/x" };
    expect(localizeNavItems([item], navMessages.de)[0]?.title).toBe("Unknown");
  });
});
