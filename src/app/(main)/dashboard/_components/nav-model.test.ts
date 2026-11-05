import { describe, expect, it } from "vitest";

import { examplesNav } from "../(examples)/_nav/examples-nav";
import { buildShellNav, type NavData } from "./nav-model";

const text = Object.fromEntries(
  examplesNav.flatMap((group) => [group, ...group.items].map((entry) => [entry.id, `en:${entry.id}`])),
) as Parameters<typeof buildShellNav>[1]["text"];
const examples = { groups: examplesNav, text };

const data = (overrides: Partial<NavData>): NavData => ({
  presetId: "salon",
  visibleIds: ["home", "bookings"],
  labels: { home: "Home", bookings: "Appointments" },
  groupLabels: { overview: "Overview", operations: "Operations" },
  showExamples: false,
  ...overrides,
});

const titles = (items: readonly { title: string }[]) => items.map((item) => item.title);

describe("buildShellNav", () => {
  it("lists the preset areas with the labels the server resolved", () => {
    expect(titles(buildShellNav(data({}), examples).top)).toEqual(["Home", "Appointments"]);
  });

  it.each([
    ["only home", ["home"], ["Home"]],
    ["nothing", [], []],
    ["an id the preset does not define", ["staff"], []],
  ])("hides entries that are not visible: %s", (_name, visibleIds, expected) => {
    expect(titles(buildShellNav(data({ visibleIds }), examples).top)).toEqual(expected);
  });

  it("groups the preset entries for the search dialog", () => {
    expect(buildShellNav(data({}), examples).searchGroups.map((group) => [group.id, group.label])).toEqual([
      ["overview", "Overview"],
      ["operations", "Operations"],
    ]);
  });

  it("leaves the showcase screens out unless asked", () => {
    expect(buildShellNav(data({}), examples).rail).toEqual([]);
  });

  it("puts the preset first and the showcase screens after it", () => {
    const nav = buildShellNav(data({ showExamples: true }), examples);
    expect([titles(nav.top).slice(0, 2), nav.top.length > 2]).toEqual([["Home", "Appointments"], true]);
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
