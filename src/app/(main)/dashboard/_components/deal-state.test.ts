import { describe, expect, it } from "vitest";

import type { OpenDeal } from "@/lib/crm";

import {
  addOutcome,
  CLOSED_ON,
  closeDeal,
  createDeal,
  type DealFields,
  EMPTY_DEALS_STATE,
  editDeal,
  entryOf,
  moveDeal,
  removeDeal,
  resolveDeal,
  resolveDeals,
  restoreEntry,
} from "./deal-state";

const alpha: OpenDeal = {
  id: "a",
  title: "Alpha",
  customerId: "c01",
  stage: "qualification",
  value: 100,
  closeDate: "2026-12-01",
  ownerIds: ["iv"],
};
const beta: OpenDeal = {
  id: "b",
  title: "Beta",
  customerId: "c02",
  stage: "proposal",
  value: 250,
  closeDate: "2026-12-02",
  ownerIds: ["km"],
};
const base = [alpha, beta];

const fields: DealFields = {
  title: "Gamma",
  customerId: "c03",
  stage: "closing",
  value: 900,
  closeDate: "2026-11-30",
  ownerIds: ["lb", "th"],
};

describe("creating a deal", () => {
  it("adds it to the session with a unique id", () => {
    const first = createDeal(EMPTY_DEALS_STATE, fields);
    const second = createDeal(first.state, { ...fields, title: "Delta" });

    expect([first.deal.id, second.deal.id]).toEqual(["session-1", "session-2"]);
    expect(resolveDeals(base, second.state, true).open.map((deal) => deal.title)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
      "Delta",
    ]);
  });

  it("stays out of a screen that does not take created deals", () => {
    const { state } = createDeal(EMPTY_DEALS_STATE, fields);

    expect(resolveDeals(base, state, false).open.map((deal) => deal.id)).toEqual(["a", "b"]);
  });
});

describe("editing a deal", () => {
  it("shows the new fields and leaves the other deals alone", () => {
    const state = editDeal(EMPTY_DEALS_STATE, "a", fields);

    expect(resolveDeal(alpha, state)).toMatchObject({ id: "a", ...fields });
    expect(resolveDeal(beta, state)).toBe(beta);
  });

  it("keeps an edit when the deal is moved afterwards", () => {
    const state = moveDeal(editDeal(EMPTY_DEALS_STATE, "a", fields), "a", "negotiation");

    expect(resolveDeal(alpha, state)).toMatchObject({ title: "Gamma", stage: "negotiation" });
  });
});

describe("moving a deal", () => {
  it("changes only its stage", () => {
    const state = moveDeal(EMPTY_DEALS_STATE, "b", "closing");

    expect(resolveDeal(beta, state)).toEqual({ ...beta, stage: "closing" });
  });
});

describe("closing a deal", () => {
  it("moves it out of the open list into the outcome, closed today", () => {
    const state = closeDeal(EMPTY_DEALS_STATE, "b", "won");
    const resolved = resolveDeals(base, state, true);

    expect(resolved.open.map((deal) => deal.id)).toEqual(["a"]);
    expect(resolved.won).toEqual([{ ...beta, stage: "won", closeDate: CLOSED_ON }]);
    expect(resolved.lost).toEqual([]);
    expect(resolveDeal(beta, state)).toBeNull();
  });

  it("adds the closed deals to the month's figures", () => {
    const state = closeDeal(closeDeal(EMPTY_DEALS_STATE, "a", "lost"), "b", "lost");

    expect(addOutcome({ count: 2, value: 1000 }, resolveDeals(base, state, true).lost)).toEqual({
      count: 4,
      value: 1350,
    });
  });
});

describe("deleting a deal", () => {
  it("removes it from every list", () => {
    const state = removeDeal(EMPTY_DEALS_STATE, "a");
    const resolved = resolveDeals(base, state, true);

    expect(resolved.open.map((deal) => deal.id)).toEqual(["b"]);
    expect([resolved.won, resolved.lost]).toEqual([[], []]);
    expect(resolveDeal(alpha, state)).toBeNull();
  });
});

describe("undo", () => {
  it("brings back a deleted deal with its edits", () => {
    const edited = editDeal(EMPTY_DEALS_STATE, "a", fields);
    const deleted = removeDeal(edited, "a");

    expect(resolveDeal(alpha, restoreEntry(deleted, "a", entryOf(edited, "a")))).toMatchObject({ title: "Gamma" });
  });

  it("clears the entry of an untouched deal", () => {
    const moved = moveDeal(EMPTY_DEALS_STATE, "a", "closing");

    expect(restoreEntry(moved, "a", undefined)).toEqual(EMPTY_DEALS_STATE);
  });

  it("undoes one deal without touching a later action on another", () => {
    const closed = closeDeal(moveDeal(EMPTY_DEALS_STATE, "a", "closing"), "b", "won");

    const undone = restoreEntry(closed, "a", undefined);

    expect(resolveDeal(alpha, undone)).toBe(alpha);
    expect(resolveDeal(beta, undone)).toBeNull();
  });
});
