import { describe, expect, it } from "vitest";

import { moduleOf } from "@/core/access";
import { ErrorCodes } from "@/core/errors";

import { inputBeforeCall, sessionWithout } from "./adapter-contract.testkit";
import { MODULES } from "./modules.generated";
import { VERTICALS, type VerticalId } from "./vertical";

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

const enabledSomewhere = (id: string) =>
  verticalIds.some((vertical) => (VERTICALS[vertical].modules as readonly string[]).includes(id));

const cases = withoutOptionalTargets.flatMap(({ id, capabilities, absent }) =>
  verticalIds
    .filter((vertical) => (VERTICALS[vertical].modules as readonly string[]).includes(id))
    .flatMap((vertical) => capabilities.map((capability) => [capability, vertical, absent] as const)),
);

describe("optional references with their targets absent (ADR 0017 §3)", () => {
  // Not vacuous: each module with an optional reference that a preset enables runs at least one call. Whether a
  // reference is optional is the manifest's; the generator's removal cases check the required ones.
  it.each(withoutOptionalTargets.map(({ id }) => id).filter(enabledSomewhere))("runs %s on some preset", (id) => {
    expect(cases.map(([capability]) => moduleOf(capability))).toContain(id);
  });

  it.each(cases)("%s answers on %s without throwing", async (capability, vertical, absent) => {
    const { adapter, client } = sessionWithout(vertical, absent);
    const input = await inputBeforeCall(client, capability, vertical, adapter);
    const result = await client.call(capability as never, input as never, { idempotencyKey: crypto.randomUUID() });
    expect(result).not.toMatchObject({ ok: false, error: { code: ErrorCodes.unavailable } });
  });
});
