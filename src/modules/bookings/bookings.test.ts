import { describe, expect, it } from "vitest";

import { descriptorViolations } from "@/core/capability";
import { assertDictionaryParity, errorText } from "@/core/i18n";
import { createSettingsReader } from "@/core/settings";

import { bookingsCapabilities } from "./capabilities";
import { bookingsErrors } from "./messages";
import { overlaps, serviceMinute, slotStarts, stayEnd } from "./rules";
import {
  bookingCancelInput,
  bookingCreateInput,
  bookingPatchSchema,
  bookingStatusAdvanceInput,
  walkInSeatInput,
} from "./schema";
import { bookingsSettings, serviceWindow } from "./settings";

const create = { businessDay: "2026-10-31", startMin: 1200, partySize: 2, channel: "phone" } as const;

describe("booking write schemas", () => {
  it("accepts a customer id alone and defaults resources and tags to none", () => {
    expect(bookingCreateInput.parse({ ...create, customerId: "c1" })).toMatchObject({ resourceIds: [], tags: [] });
  });

  it("accepts a contact name alone", () => {
    expect(bookingCreateInput.safeParse({ ...create, contactName: "Rey" }).success).toBe(true);
  });

  it.each([
    ["neither", {}],
    ["both", { customerId: "c1", contactName: "Rey" }],
  ])("refuses a create that names %s of customerId and contactName", (_label, who) => {
    expect(bookingCreateInput.safeParse({ ...create, ...who }).success).toBe(false);
  });

  it("refuses a repeated resource id, which would count its seats twice", () => {
    expect(bookingCreateInput.safeParse({ ...create, contactName: "Rey", resourceIds: ["a", "a"] }).success).toBe(
      false,
    );
  });

  it.each([0, -1, 1.5])("refuses the party size %s", (partySize) => {
    expect(bookingCreateInput.safeParse({ ...create, contactName: "Rey", partySize }).success).toBe(false);
  });

  it("refuses a walk-in without a resource", () => {
    expect(walkInSeatInput.safeParse({ partySize: 2, resourceIds: [] }).success).toBe(false);
  });

  it("trims the cancel reason and refuses a blank one", () => {
    expect([
      bookingCancelInput.parse({ id: "b", reason: "  Guest called  " }).reason,
      bookingCancelInput.safeParse({ id: "b", reason: "   " }).success,
    ]).toEqual(["Guest called", false]);
  });

  it("refuses a cancel reason that is too long", () => {
    expect(bookingCancelInput.safeParse({ id: "b", reason: "x".repeat(501) }).success).toBe(false);
  });

  it.each([{ status: "confirmed" }, { id: "b" }, { endMin: 1300 }])("refuses the patch field %j", (patch) => {
    expect(bookingPatchSchema.safeParse(patch).success).toBe(false);
  });

  it("refuses a status that does not exist", () => {
    expect(bookingStatusAdvanceInput.safeParse({ id: "b", to: "seated" }).success).toBe(false);
  });
});

describe("booking capabilities", () => {
  it.each(Object.values(bookingsCapabilities))("$id breaks no descriptor rule", (capability) => {
    expect(descriptorViolations(capability)).toEqual([]);
  });

  it.each(Object.values(bookingsCapabilities).filter((capability) => capability.effect !== "read"))(
    "$id is a tier 2 write that requires an idempotency key",
    (capability) => {
      expect([capability.riskTier, capability.requiresIdempotencyKey]).toEqual([2, true]);
    },
  );

  it.each(["bookings.cancel", "bookings.no_show.mark"] as const)("%s is destructive", (id) => {
    expect(bookingsCapabilities[id].effect).toBe("destructive");
  });

  it("lets anyone who may update a booking take back a status step", () => {
    expect(bookingsCapabilities["bookings.status.undo"].permission).toBe("update:bookings");
  });

  it("reads the availability at tier 0", () => {
    expect(bookingsCapabilities["bookings.availability.get"]).toMatchObject({ effect: "read", riskTier: 0 });
  });
});

describe("booking rules", () => {
  it("lists the slots on the grid inside the window, end excluded", () => {
    expect(slotStarts({ startMin: 1140, endMin: 1260 }, 30)).toEqual([1140, 1170, 1200, 1230]);
  });

  it("starts the first slot on the next grid line when the window starts between two", () => {
    expect(slotStarts({ startMin: 1145, endMin: 1200 }, 30)).toEqual([1170]);
  });

  it("does not count stays that touch as overlapping", () => {
    expect(overlaps({ startMin: 600, endMin: 660 }, { startMin: 660, endMin: 720 })).toBe(false);
  });

  it("counts stays that share a minute as overlapping", () => {
    expect(overlaps({ startMin: 600, endMin: 661 }, { startMin: 660, endMin: 720 })).toBe(true);
  });

  it("holds a stay to the end of the business day", () => {
    expect(stayEnd(1400, 90)).toBe(1440);
  });

  it("continues the minute past midnight when the clock is before the cut-off", () => {
    expect(
      serviceMinute({ businessDay: "2026-10-30", today: "2026-10-31", nowMin: 30, cutoffMin: 300, timeZone: "UTC" }),
    ).toBe(1470);
  });
});

describe("booking settings", () => {
  it("rejects a service window that ends before it starts", () => {
    expect(serviceWindow.schema.safeParse({ startMin: 600, endMin: 600 }).success).toBe(false);
  });

  it("registers a default that parses for every setting", () => {
    expect(bookingsSettings.filter((setting) => !setting.schema.safeParse(setting.defaultValue).success)).toEqual([]);
  });

  it("keeps the dinner service window as the default", () => {
    const registry = Object.fromEntries(bookingsSettings.map((setting) => [setting.key, setting]));
    expect(createSettingsReader(registry).get(serviceWindow)).toEqual({ startMin: 1140, endMin: 1440 });
  });
});

describe("booking error texts", () => {
  it("passes the dictionary parity check in four languages", () => {
    expect(() => assertDictionaryParity(bookingsErrors)).not.toThrow();
  });

  it("explains a busy resource in French from its own code", () => {
    expect(errorText({ code: "bookings.resource_busy" }, bookingsErrors, "fr")).toContain("déjà réservé");
  });

  it("explains an expired status undo in French from its own code", () => {
    expect(errorText({ code: "bookings.status_undo_expired" }, bookingsErrors, "fr")).toContain("trop tard");
  });

  it("falls back to the class text for a code it does not own", () => {
    expect(errorText({ code: "bookings.forbidden" }, bookingsErrors, "en")).toBe(
      "You do not have permission to do this.",
    );
  });
});
