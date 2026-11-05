import { describe, expect, it } from "vitest";

import { VERTICALS } from "@/config/vertical";

import { examplesNav } from "../(examples)/_nav/examples-nav";
import { buildShellNav, type NavData } from "./nav-model";

const text = Object.fromEntries(
  examplesNav.flatMap((group) => [group, ...group.items].map((entry) => [entry.id, `en:${entry.id}`])),
) as Parameters<typeof buildShellNav>[1]["text"];
const examples = { groups: examplesNav, text };

/** The fixture is the salon's own nav, so a module that leaves the preset leaves the fixture with it. */
const presetNav = VERTICALS.salon.nav;
const shown = presetNav.filter((entry) => entry.placement === "area").slice(0, 2);
const shownIds = shown.map((entry) => entry.id);
const shownTitles = shownIds.map((id) => `label:${id}`);
const shownSearchGroups = [...new Set(shown.map((entry) => entry.group))].map((group) => [group, `group:${group}`]);

const data = (overrides: Partial<NavData>): NavData => ({
  presetId: "salon",
  visibleIds: shownIds,
  labels: Object.fromEntries(presetNav.map((entry) => [entry.id, `label:${entry.id}`])),
  groupLabels: Object.fromEntries(presetNav.map((entry) => [entry.group, `group:${entry.group}`])),
  showExamples: false,
  ...overrides,
});

const titles = (items: readonly { title: string }[]) => items.map((item) => item.title);

describe("buildShellNav", () => {
  it("lists the preset areas with the labels the server resolved", () => {
    expect(titles(buildShellNav(data({}), examples).top)).toEqual(shownTitles);
  });

  it.each([
    ["only the first area", shownIds.slice(0, 1), shownTitles.slice(0, 1)],
    ["nothing", [], []],
    ["an id the preset does not define", ["staff"], []],
  ])("hides entries that are not visible: %s", (_name, visibleIds, expected) => {
    expect(titles(buildShellNav(data({ visibleIds }), examples).top)).toEqual(expected);
  });

  it("groups the preset entries for the search dialog", () => {
    expect(buildShellNav(data({}), examples).searchGroups.map((group) => [group.id, group.label])).toEqual(
      shownSearchGroups,
    );
  });

  it("leaves the showcase screens out unless asked", () => {
    expect(buildShellNav(data({}), examples).rail).toEqual([]);
  });

  it("puts the preset first and the showcase screens after it", () => {
    const nav = buildShellNav(data({ showExamples: true }), examples);
    expect(titles(nav.top).slice(0, shown.length)).toEqual(shownTitles);
    expect(nav.top.length).toBeGreaterThan(shown.length);
  });

  it.each([
    ["en:email", "rail"],
    ["en:crm", "top"],
  ] as const)("pins the showcase screen %s in the %s", (title, slot) => {
    expect(titles(buildShellNav(data({ showExamples: true }), examples)[slot])).toContain(title);
  });

  it("keeps every showcase screen reachable from the search dialog", () => {
    const ids = buildShellNav(data({ showExamples: true }), examples).searchGroups.flatMap((group) =>
      group.items.map((item) => item.id),
    );
    expect(ids).toEqual(expect.arrayContaining(examplesNav.flatMap((group) => group.items.map((item) => item.id))));
  });
});
