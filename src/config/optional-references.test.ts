import { describe, expect, it } from "vitest";

import { createClient } from "@/core/client";
import { fixedClock } from "@/core/clock";
import { ErrorCodes } from "@/core/errors";
import { createMockAdapter, createSessionStore } from "@/core/mock";

import { inputBeforeCall, ownerOf } from "./adapter-contract.testkit";
import { CATALOG } from "./catalog";
import { DEMO, type DemoSeed, MOCK_HANDLERS, settingsFor } from "./demo-kernel";
import { MODULES } from "./modules.generated";
import { VERTICALS, type VerticalId } from "./vertical";

const quiet = { retryDelayMs: 0, logger: () => undefined, mode: "production" } as const;
const verticalIds = Object.keys(VERTICALS) as VerticalId[];

/**
 * Each module with optional references, and the seed collections of every module those references name: the data
 * the module must do without (ADR 0017 §3).
 */
const withoutOptionalTargets = MODULES.flatMap(({ id, capabilities, references }) => {
  const targets = new Set(references.filter(({ required }) => !required).map(({ module }) => module));
  const absent = MODULES.filter((target) => targets.has(target.id)).flatMap(({ seed }) => Object.keys(seed));
  return targets.size === 0 ? [] : [{ id, capabilities: Object.keys(capabilities), absent: new Set(absent) }];
});

const cases = withoutOptionalTargets.flatMap(({ id, capabilities, absent }) =>
  verticalIds
    .filter((vertical) => (VERTICALS[vertical].modules as readonly string[]).includes(id))
    .flatMap((vertical) => capabilities.map((capability) => [capability, vertical, absent] as const)),
);

/** A session on the preset's seed without the given collections, as if their modules were not installed. */
function sessionWithout(vertical: VerticalId, absent: ReadonlySet<string>) {
  const seed = Object.fromEntries(Object.entries(DEMO[vertical].seed).filter(([name]) => !absent.has(name)));
  const adapter = createMockAdapter({
    handlers: MOCK_HANDLERS,
    // The seed lacks the absent modules' collections, which an installed composition's types require: the point here.
    store: createSessionStore(seed as unknown as DemoSeed),
    sessionId: crypto.randomUUID(),
    clock: fixedClock(DEMO[vertical].clock),
    settings: settingsFor(vertical),
  });
  return { adapter, client: createClient(CATALOG, adapter, { ...quiet, actor: ownerOf(vertical) }) };
}

const customersCollections = new Set(Object.keys(MODULES.find(({ id }) => id === "customers")?.seed ?? {}));

describe("optional references with their targets absent (ADR 0017 §3)", () => {
  it("covers the modules that reference another optionally", () => {
    expect(withoutOptionalTargets.map(({ id }) => id)).toEqual(["bookings", "notifications"]);
  });

  it.each(cases)("%s answers on %s without throwing", async (capability, vertical, absent) => {
    const { adapter, client } = sessionWithout(vertical, absent);
    const input = await inputBeforeCall(client, capability, vertical, adapter);
    const result = await client.call(capability as never, input as never, { idempotencyKey: crypto.randomUUID() });
    expect(result).not.toMatchObject({ ok: false, error: { code: ErrorCodes.unavailable } });
  });

  it.each(verticalIds)("refuses a booking for a customer on %s when no customer exists", async (vertical) => {
    const { adapter, client } = sessionWithout(vertical, customersCollections);
    const input = await inputBeforeCall(client, "bookings.create", vertical, adapter);
    const result = await client.call("bookings.create", input as never, { idempotencyKey: crypto.randomUUID() });
    expect(result).toMatchObject({ ok: false, error: { code: "bookings.not_found" } });
  });
});
