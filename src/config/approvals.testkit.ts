import { expect, it } from "vitest";

import { DEFAULT_ROLES, moduleOf, permissionsOf, type RoleId } from "@/core/access";
import { type ApprovalPolicy, holdsForApproval } from "@/core/approvals";
import type { ApprovalContext } from "@/core/capability";
import { type Actor, createClient } from "@/core/client";
import { fixedClock } from "@/core/clock";
import { exposedCapabilities } from "@/core/mcp/server";
import { createMockAdapter, createSessionStore, type SessionStore } from "@/core/mock";
import { createSettingsReader } from "@/core/settings";

import { CATALOG } from "./catalog";
import { DEMO, type DemoSeed, heldWritesFor, MOCK_HANDLERS } from "./demo-kernel";
import { isKernelTool } from "./mcp.server.testkit";
import { MCP_MANIFEST } from "./mcp-manifest";
import { SETTINGS } from "./settings";
import { VERTICALS } from "./vertical";

/** Shared by the approvals test files: the kernel's, and one per module that has a write the policy holds. */

export const START = Date.UTC(2026, 9, 31, 12, 0, 0);

export const actorOf = (roleId: RoleId): Actor => {
  const role = DEFAULT_ROLES.find((preset) => preset.id === roleId) ?? DEFAULT_ROLES[0];
  return {
    actorId: `demo-${roleId}`,
    roleId,
    permissions: permissionsOf(role, CATALOG, VERTICALS.hospitality.modules),
  };
};

interface SetupOptions {
  readonly policy?: ApprovalPolicy;
  /** A role whose permissions have been taken away since the write was asked for. */
  readonly revokedRole?: string;
  /** Another harness's demo session, to decide there what was asked there. */
  readonly store?: SessionStore<DemoSeed>;
  /** The business minute of the demo clock, when it has moved on since the seed. */
  readonly nowMin?: number;
}

export const setup = ({
  policy,
  revokedRole,
  store = createSessionStore<DemoSeed>(DEMO.hospitality.seed),
  nowMin,
}: SetupOptions = {}) => {
  const time = { ms: START };
  const held = heldWritesFor("hospitality");
  const adapter = createMockAdapter({
    handlers: MOCK_HANDLERS,
    store,
    sessionId: "visitor",
    clock: fixedClock(nowMin === undefined ? DEMO.hospitality.clock : { ...DEMO.hospitality.clock, nowMin }),
    settings: createSettingsReader(SETTINGS, {
      ...VERTICALS.hospitality.settingsDefaults,
      ...(policy === undefined ? {} : { "approvals.policy": policy }),
    }),
    heldWrites: {
      ...held,
      permissionsOfRole: (roleId) => (roleId === revokedRole ? [] : held.permissionsOfRole(roleId)),
    },
    now: () => time.ms,
  });
  const as = (roleId: RoleId, via: ApprovalContext["via"], actor: Actor = actorOf(roleId)) =>
    createClient(CATALOG, adapter, {
      actor,
      via,
      retryDelayMs: 0,
      logger: () => undefined,
      mode: "production",
    });
  return { time, as, store, assistant: as("owner", "mcp"), person: as("owner", "ui") };
};

export type Harness = ReturnType<typeof setup>;

const capabilityOf = (id: string) => {
  const found = CATALOG[id];
  if (found === undefined) throw new Error(`The catalogue has no capability "${id}"`);
  return found;
};

export const idOf = (held: unknown): string => (held as { approvalId: string }).approvalId;

/** Rows of "which writes wait": the policy, the capability, how it is called, and whether it waits. */
export type WaitRow = readonly [ApprovalPolicy, string, ApprovalContext["via"], boolean];

export const itHoldsAsThePolicySays = (rows: readonly WaitRow[]) => {
  it.each(rows)("under %s, %s via %s waits: %s", (policy, capabilityId, via, waits) => {
    expect(holdsForApproval(policy, capabilityOf(capabilityId), via)).toBe(waits);
  });
};

/** What the default policy holds through MCP, among the tools of the kernel (`undefined`) or of one module. */
export const heldThroughMcp = (owner?: string): string[] =>
  exposedCapabilities(CATALOG, MCP_MANIFEST)
    .filter((capability) => holdsForApproval("destructive_and_sensitive", capability, "mcp"))
    .map((capability) => capability.id)
    .filter((id) => {
      const module = moduleOf(id);
      return owner === undefined ? isKernelTool(id) : module === owner;
    })
    .sort();

/** A write the policy holds, how to hold it, and what approving it must leave behind, once. */
export interface TickScenario {
  readonly label: string;
  readonly policy: ApprovalPolicy;
  readonly hold: (assistant: Harness["assistant"]) => Promise<unknown>;
  readonly applied: (person: Harness["person"]) => Promise<unknown>;
  readonly expected: unknown;
}

export const itAppliesOnceWhenApprovedTwiceInOneTick = (scenarios: readonly TickScenario[]) => {
  it.each(scenarios)("applies $label once when it is approved twice in the same tick", async (scenario) => {
    const { assistant, person } = setup({ policy: scenario.policy });
    const held = await scenario.hold(assistant);

    const answers = await Promise.all([
      person.call("approvals.approve", { approvalId: idOf(held) }),
      person.call("approvals.approve", { approvalId: idOf(held) }),
    ]);

    expect(answers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ok: true }),
        expect.objectContaining({ ok: false, error: expect.objectContaining({ code: "approvals.not_pending" }) }),
      ]),
    );
    expect(await scenario.applied(person)).toEqual(scenario.expected);
    expect(await assistant.call("approvals.get", { approvalId: idOf(held) })).toMatchObject({
      ok: true,
      value: { status: "approved" },
    });
  });
};
