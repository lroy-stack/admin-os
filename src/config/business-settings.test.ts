import { describe, expect, it } from "vitest";

import { DEFAULT_ROLES, permissionsOf, type RoleId } from "@/core/access";
import type { ApprovalContext } from "@/core/capability";
import { type Actor, createClient } from "@/core/client";
import { fixedClock } from "@/core/clock";
import { createMockAdapter, createSessionStore } from "@/core/mock";
import { isAwaitingApproval } from "@/core/result";
import { createSettingsReader } from "@/core/settings";

import { CATALOG } from "./catalog";
import { DEMO, heldWritesFor, MOCK_HANDLERS } from "./demo-kernel";
import { SETTINGS } from "./settings";
import { VERTICALS } from "./vertical";

const actorOf = (roleId: RoleId): Actor => {
  const role = DEFAULT_ROLES.find((preset) => preset.id === roleId) ?? DEFAULT_ROLES[0];
  return {
    actorId: `demo-${roleId}`,
    roleId,
    permissions: permissionsOf(role, CATALOG, VERTICALS.hospitality.modules),
  };
};

/** The hospitality demo, one store for every visitor: `as(role, session)` acts as that role in that session. */
const demo = () => {
  const store = createSessionStore(DEMO.hospitality.seed);
  const as = (roleId: RoleId, sessionId: string, via: ApprovalContext["via"] = "ui") =>
    createClient(
      CATALOG,
      createMockAdapter({
        handlers: MOCK_HANDLERS,
        store,
        sessionId,
        clock: fixedClock(DEMO.hospitality.clock),
        settings: createSettingsReader(SETTINGS, VERTICALS.hospitality.settingsDefaults),
        heldWrites: heldWritesFor("hospitality"),
      }),
      { actor: actorOf(roleId), via, retryDelayMs: 0, logger: () => undefined, mode: "production" },
    );
  return { store, as };
};

const presetProfile = VERTICALS.hospitality.settingsDefaults["business.profile"];
const renamed = { ...presetProfile, tradeName: "Lumbre Bistro & Bar" };

const profileOf = async (client: ReturnType<ReturnType<typeof demo>["as"]>) => {
  const answer = await client.call("settings.values.get", { keys: ["business.profile"] });
  return "ok" in answer && answer.ok ? (answer.value as { values: Record<string, unknown> }).values : answer;
};

/** The id a held write answers with; a write that was not held has none to approve. */
const approvalIdOf = (answer: Awaited<ReturnType<ReturnType<ReturnType<typeof demo>["as"]>["call"]>>) =>
  isAwaitingApproval(answer) ? answer.approvalId : "not-held";

describe("business details a demo session changes (spec 008)", () => {
  it("are what settings.values.get answers in the same session after the owner changes them (AC1)", async () => {
    const { as } = demo();
    await as("owner", "visitor").call("settings.values.update", { values: { "business.profile": renamed } });
    expect(await profileOf(as("staff", "visitor"))).toEqual({ "business.profile": renamed });
  });

  it("leave another visitor's session on the preset's company (AC1)", async () => {
    const { as } = demo();
    await as("owner", "visitor").call("settings.values.update", { values: { "business.profile": renamed } });
    expect(await profileOf(as("owner", "someone-else"))).toEqual({ "business.profile": presetProfile });
  });

  it("return to the preset's company when the demo data is reset (AC1)", async () => {
    const { store, as } = demo();
    await as("owner", "visitor").call("settings.values.update", { values: { "business.profile": renamed } });
    store.reset("visitor");
    expect(await profileOf(as("owner", "visitor"))).toEqual({ "business.profile": presetProfile });
  });

  it("refuse a value that breaks the profile's rules, naming the field (AC2)", async () => {
    const { as } = demo();
    const broken = { ...presetProfile, email: "billing" };
    expect(
      await as("owner", "visitor").call("settings.values.update", { values: { "business.profile": broken } }),
    ).toMatchObject({
      ok: false,
      error: { code: "schema.invalid_input", details: { paths: ["values.business.profile.email"] } },
    });
  });

  it.each(["manager", "staff"] as const)("cannot be changed by the %s (AC3)", async (roleId) => {
    const { as } = demo();
    expect(
      await as(roleId, "visitor").call("settings.values.update", { values: { "business.profile": renamed } }),
    ).toMatchObject({ ok: false, error: { code: "access.forbidden" } });
  });

  it("never reach the approval policy, which only the owner's own control changes", async () => {
    const { as } = demo();
    expect(
      await as("owner", "visitor").call("settings.values.update", { values: { "approvals.policy": "none" } }),
    ).toMatchObject({
      ok: false,
      error: { code: "settings.not_writable", details: { capability: "approvals.policy.set" } },
    });
  });

  it("wait for a person when an assistant changes them, under the default policy", async () => {
    const { as } = demo();
    expect(
      await as("owner", "visitor", "mcp").call("settings.values.update", { values: { "business.profile": renamed } }),
    ).toMatchObject({ status: "awaiting_approval" });
  });

  it("are applied when approved after the owner saved another setting meanwhile", async () => {
    const { as } = demo();
    const held = await as("owner", "visitor", "mcp").call("settings.values.update", {
      values: { "business.profile": renamed },
    });
    const payment = { ...VERTICALS.hospitality.settingsDefaults["business.payment"], bank: "Other Bank" };
    await as("owner", "visitor").call("settings.values.update", { values: { "business.payment": payment } });
    await as("owner", "visitor").call("approvals.approve", { approvalId: approvalIdOf(held) });
    expect(await profileOf(as("owner", "visitor"))).toEqual({ "business.profile": renamed });
  });

  it("are applied when the owner approves the assistant's change", async () => {
    const { as } = demo();
    const held = await as("owner", "visitor", "mcp").call("settings.values.update", {
      values: { "business.profile": renamed },
    });
    await as("owner", "visitor").call("approvals.approve", { approvalId: approvalIdOf(held) });
    expect(await profileOf(as("owner", "visitor"))).toEqual({ "business.profile": renamed });
  });
});
