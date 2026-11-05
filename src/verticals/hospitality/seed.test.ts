import { describe, expect, it } from "vitest";

import { partySchema } from "@/modules/parties";

import { catalogItemExtSchema, customerExtSchema } from "./extensions";
import { hospitalitySeed } from "./seed";

const NOW_MIN = 20 * 60 + 40;
const LATE_AFTER_MIN = 10;

const { bookings, catalog, customers } = hospitalitySeed;

describe("hospitality seed", () => {
  // Bookings' references to resources, catalog items and customers are checked for every preset by the seed
  // contract test, from the modules' `references` (ADR 0017 §3). A bundle's sections point inside the catalog itself.
  it("references only existing catalog items from bundle sections", () => {
    const known = new Set(catalog.map((item) => item.id));
    const fromSections = catalog.flatMap((item) => item.sections?.flatMap((section) => section.itemIds) ?? []);
    expect(fromSections.filter((id) => !known.has(id))).toEqual([]);
  });

  it("places tables in areas across two levels", () => {
    expect(new Set(hospitalitySeed.areas.map((area) => area.levelId)).size).toBe(2);
  });

  it("includes a seated booking", () => {
    expect(bookings.filter((booking) => booking.status === "in_progress")).not.toHaveLength(0);
  });

  it("includes a late booking", () => {
    const late = bookings.filter(
      (booking) => booking.status === "confirmed" && booking.startMin + LATE_AFTER_MIN < NOW_MIN,
    );
    expect(late).not.toHaveLength(0);
  });

  it("includes an unassigned booking", () => {
    expect(
      bookings.filter((booking) => booking.resourceIds.length === 0 && booking.status === "confirmed"),
    ).not.toHaveLength(0);
  });

  it("includes a walk-in booking", () => {
    expect(bookings.filter((booking) => booking.origin === "walk_in")).not.toHaveLength(0);
  });

  it("names a one-off phone caller without a customer record", () => {
    const callers = bookings.filter((booking) => booking.channel === "phone" && !booking.customerId);
    expect(callers.map((booking) => booking.contactName)).toEqual(["Rey", "Herrera"]);
  });

  it("includes a booking awaiting a deposit", () => {
    expect(
      bookings.filter((booking) => booking.status === "awaiting_payment" && booking.deposit?.status === "due"),
    ).toHaveLength(1);
  });

  it("includes a booking with a captured deposit", () => {
    expect(bookings.filter((booking) => booking.deposit?.status === "captured")).toHaveLength(1);
  });

  it("gives one staff member a contract", () => {
    expect(hospitalitySeed.staff.filter((member) => member.contract)).toHaveLength(1);
  });

  it("includes a large group", () => {
    expect(bookings.filter((booking) => (booking.partySize ?? 1) >= 8)).not.toHaveLength(0);
  });

  it("includes a cancelled booking", () => {
    expect(bookings.filter((booking) => booking.status === "cancelled")).not.toHaveLength(0);
  });

  it("includes a customer with allergies in ext", () => {
    const withAllergies = customers.filter((customer) => customerExtSchema.parse(customer.ext).allergens.length > 0);
    expect(withAllergies).not.toHaveLength(0);
  });

  it("includes a tasting menu bundle with course sections", () => {
    const bundle = catalog.find((item) => item.kind === "bundle");
    expect(bundle?.sections).toHaveLength(3);
  });

  it("includes a dish of the day", () => {
    expect(catalog.filter((item) => catalogItemExtSchema.parse(item.ext).dishOfTheDay)).toHaveLength(1);
  });
});

describe("hospitality parties seed", () => {
  it("parses with the module schema", () => {
    expect(hospitalitySeed.parties.map((party) => partySchema.safeParse(party).success)).toEqual(
      hospitalitySeed.parties.map(() => true),
    );
  });

  it("has unique ids", () => {
    expect(new Set(hospitalitySeed.parties.map((party) => party.id)).size).toBe(hospitalitySeed.parties.length);
  });

  it("uses only fictitious addresses ending in .example", () => {
    expect(hospitalitySeed.parties.filter((party) => !party.email.endsWith(".example"))).toEqual([]);
  });
});
