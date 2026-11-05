import { describe, expect, it } from "vitest";

import { MODULES } from "@/config/modules.generated";
import { SLOT_FILLS } from "@/config/modules.slots.generated";
import type { ModuleManifest } from "@/core/module";

import { BOOKING_SLOTS } from "./guest-slots";

const declared: readonly string[] = Object.values(BOOKING_SLOTS);
const manifests: readonly ModuleManifest[] = MODULES;

describe("the bookings route's slots (ADR 0017 §4)", () => {
  it("declares every bookings slot an installed module fills", () => {
    const filled = manifests
      .flatMap(({ slots }) => (slots ?? []).map(({ slot }) => slot))
      .filter((slot) => slot.startsWith("bookings."));

    expect(filled.filter((slot) => !declared.includes(slot))).toEqual([]);
  });

  it("takes no client fill that it does not declare", () => {
    expect(Object.keys(SLOT_FILLS).filter((slot) => slot.startsWith("bookings.") && !declared.includes(slot))).toEqual(
      [],
    );
  });
});
