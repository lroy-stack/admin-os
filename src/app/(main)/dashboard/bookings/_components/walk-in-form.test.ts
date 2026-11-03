import { describe, expect, it } from "vitest";

import { seatedBookingId, toSeatInput, walkInFormSchema } from "./walk-in-form";

const schema = walkInFormSchema({ coversInvalid: "Enter 1 to 20 covers.", nameTooLong: "Too long." });

describe("walkInFormSchema", () => {
  it("accepts covers inside the bounds and trims the name", () => {
    expect(schema.parse({ covers: 4, name: "  Rey  " })).toEqual({ covers: 4, name: "Rey" });
  });

  it.each([0, 21, 1.5])("refuses %s covers with the localized text", (covers) => {
    expect(schema.safeParse({ covers, name: "" }).error?.issues[0]?.message).toBe("Enter 1 to 20 covers.");
  });

  it("refuses a name that is too long", () => {
    expect(schema.safeParse({ covers: 2, name: "x".repeat(121) }).error?.issues[0]?.message).toBe("Too long.");
  });
});

describe("toSeatInput", () => {
  it("seats the party on the chosen table", () => {
    expect(toSeatInput({ covers: 3, name: "" }, "S4")).toEqual({ partySize: 3, resourceIds: ["S4"] });
  });

  it("carries the guest name when there is one", () => {
    expect(toSeatInput({ covers: 2, name: "Rey" }, "S4")).toEqual({
      partySize: 2,
      resourceIds: ["S4"],
      contactName: "Rey",
    });
  });
});

describe("seatedBookingId", () => {
  it("reads the id of the booking that was seated", () => {
    expect(seatedBookingId({ id: "bk-1", status: "in_progress" })).toBe("bk-1");
  });

  it("reads nothing from an answer that is not a booking", () => {
    expect(seatedBookingId("ok")).toBeNull();
  });
});
