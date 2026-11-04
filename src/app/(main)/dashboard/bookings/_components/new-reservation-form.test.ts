import { describe, expect, it } from "vitest";

import {
  createdBooking,
  emptyReservation,
  parseTags,
  pointAtField,
  reservationFormSchema,
  toCreateBookingInput,
} from "./new-reservation-form";

const text = {
  guestRequired: "Pick a guest.",
  dateInvalid: "Pick a date.",
  coversInvalid: "Enter 1 to 40 guests.",
  slotRequired: "Pick a time.",
  noteTooLong: "Too long.",
  tagsInvalid: "Bad tags.",
};
const contactInvalid = { name: "Name?", phone: "Phone?", email: "Email?" };
const schema = reservationFormSchema(text, contactInvalid);

const filled = { ...emptyReservation("2026-11-01", 4), customerId: "cu-1", startMin: "1200" };
const messagesOf = (input: unknown) => schema.safeParse(input).error?.issues.map((issue) => issue.message);

describe("reservationFormSchema", () => {
  it("accepts an existing guest, a slot and a table, and parses the tags", () => {
    expect(schema.parse({ ...filled, tableId: "S3", note: " Window ", tags: "VIP, birthday ,VIP" })).toEqual({
      guest: { kind: "existing", customerId: "cu-1" },
      date: "2026-11-01",
      covers: 4,
      startMin: 1200,
      tableId: "S3",
      channel: "phone",
      note: "Window",
      tags: ["VIP", "birthday"],
    });
  });

  it("asks for a date, a time and a guest", () => {
    expect(messagesOf(emptyReservation("", 2))).toEqual(["Pick a date.", "Pick a time.", "Pick a guest."]);
  });

  it("judges a new contact by the shared contact rules", () => {
    const parsed = schema.parse({ ...filled, mode: "new", name: "Rey", phone: "+34 600 000 101", email: "" });
    expect(parsed.guest).toEqual({ kind: "new", contact: { name: "Rey", phone: "+34600000101", email: undefined } });
    expect(messagesOf({ ...filled, mode: "new", name: "", phone: "12", email: "" })).toEqual(["Name?", "Phone?"]);
  });

  it("ignores the contact fields while the guest is an existing one", () => {
    expect(schema.safeParse({ ...filled, name: "", phone: "bad" }).success).toBe(true);
  });

  it.each([0, 41, 2.5])("refuses %s guests", (covers) => {
    expect(messagesOf({ ...filled, covers })).toEqual(["Enter 1 to 40 guests."]);
  });

  it("refuses a note and tags beyond the capability's bounds", () => {
    expect(messagesOf({ ...filled, note: "x".repeat(501) })).toEqual(["Too long."]);
    expect(messagesOf({ ...filled, tags: "x".repeat(41) })).toEqual(["Bad tags."]);
  });
});

describe("parseTags", () => {
  it("trims, drops blanks and repeats and keeps the order typed", () => {
    expect(parseTags(" a, ,b,a ,c")).toEqual(["a", "b", "c"]);
    expect(parseTags("")).toEqual([]);
  });
});

describe("toCreateBookingInput", () => {
  it("sends the table, the note and the tags that were given", () => {
    const values = schema.parse({ ...filled, tableId: "S3", note: "Quiet", tags: "VIP" });
    expect(toCreateBookingInput(values, "cu-9")).toEqual({
      businessDay: "2026-11-01",
      startMin: 1200,
      partySize: 4,
      customerId: "cu-9",
      channel: "phone",
      resourceIds: ["S3"],
      guestNote: "Quiet",
      tags: ["VIP"],
    });
  });

  it("leaves out what was left blank", () => {
    const plain = toCreateBookingInput(schema.parse(filled), "cu-1");
    expect(Object.keys(plain).sort()).toEqual(["businessDay", "channel", "customerId", "partySize", "startMin"]);
  });
});

describe("pointAtField", () => {
  const refused = (code: string) => ({ status: "error", code, text: "Refused." }) as const;

  it.each([
    ["bookings.not_enough_seats", "tableId"],
    ["bookings.resource_busy", "tableId"],
    ["bookings.outside_window", "startMin"],
    ["bookings.off_grid", "startMin"],
    ["bookings.start_passed", "startMin"],
  ])("points %s at %s", (code, field) => {
    expect(pointAtField(refused(code))).toEqual({
      status: "invalid",
      issues: [{ path: [field], message: "Refused." }],
    });
  });

  it("leaves other errors, successes and a refused submit as they are", () => {
    const other = refused("bookings.not_found");
    expect(pointAtField(other)).toBe(other);
    expect(pointAtField({ status: "ok", value: 1 })).toEqual({ status: "ok", value: 1 });
    expect(pointAtField(null)).toBeNull();
  });
});

describe("createdBooking", () => {
  it("reads what the toast needs", () => {
    const booking = { id: "bk-1", businessDay: "2026-11-01", startMin: 1200, partySize: 4 };
    expect(createdBooking({ ...booking, status: "confirmed" })).toEqual(booking);
    expect(createdBooking("ok")).toBeNull();
  });
});
