import { describe, expect, it } from "vitest";

import { bookingObject, bookingSchema } from "./schema";

describe("booking schema composition", () => {
  it("lets the unrefined object drop a field with omit", () => {
    expect(Object.keys(bookingObject.omit({ id: true }).shape)).not.toContain("id");
  });

  it("lets the unrefined object make fields optional with partial", () => {
    expect(bookingObject.partial().safeParse({}).error).toBeUndefined();
  });

  it("still rejects a booking that ends before it starts", () => {
    const booking = {
      id: "b",
      status: "pending",
      businessDay: "2026-10-31",
      startMin: 600,
      endMin: 540,
      resourceIds: [],
      staffIds: [],
      lines: [],
      origin: "staff",
      tags: [],
    };
    expect(bookingSchema.safeParse(booking).success).toBe(false);
  });
});
