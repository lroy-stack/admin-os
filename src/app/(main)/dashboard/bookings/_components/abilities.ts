/**
 * What the signed-in role may do on the bookings screen, as the booleans the controls need. The page derives it from
 * the actor's permissions on the server (ADR 0006), so a control a role may not use is not rendered; the server still
 * refuses the call (ADR 0005).
 */
export interface BookingAbilities {
  /** `create:bookings`: seat a walk-in. */
  readonly seat: boolean;
  /** `create:bookings`, and the guest slots filled (ADR 0017 §4): without them the window cannot name a guest. */
  readonly reserve: boolean;
  /** `update:bookings`: confirm, seat, complete and take a step back. */
  readonly advance: boolean;
  /** `cancel:bookings`. */
  readonly cancel: boolean;
  /** `noshow:bookings`. */
  readonly noShow: boolean;
}

export const NO_ABILITIES: BookingAbilities = {
  seat: false,
  reserve: false,
  advance: false,
  cancel: false,
  noShow: false,
};

export const abilitiesOf = (permissions: readonly string[], guestSlotsFilled: boolean): BookingAbilities => ({
  seat: permissions.includes("create:bookings"),
  reserve: permissions.includes("create:bookings") && guestSlotsFilled,
  advance: permissions.includes("update:bookings"),
  cancel: permissions.includes("cancel:bookings"),
  noShow: permissions.includes("noshow:bookings"),
});
