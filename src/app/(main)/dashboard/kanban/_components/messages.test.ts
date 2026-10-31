import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { initialBoard } from "./data";
import { kanbanMessages } from "./messages.server";

// Identical on purpose: "Backend" is the same technical word in all four languages.
const SAME_EVERYWHERE = ["teams.Backend"];

describe("kanban dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(kanbanMessages, SAME_EVERYWHERE)).not.toThrow();
  });

  it.each(Object.keys(kanbanMessages))("has text for every task of the board in %s", (locale) => {
    const taskIds = Object.values(initialBoard).flatMap((tasks) => tasks.map((task) => task.id));

    expect(Object.keys(kanbanMessages[locale as keyof typeof kanbanMessages].tasks).sort()).toEqual(taskIds.sort());
  });
});
