/**
 * What the signed-in role may do on the bookings screen, as the booleans the controls need. The page derives it from
 * the actor's permissions on the server (ADR 0006), so a control a role may not use is not rendered; the server still
 * refuses the call (ADR 0005).
 */
export interface BookingAbilities {
  /** `create:bookings`: seat a walk-in. */
  readonly seat: boolean;
  /** `update:bookings`: confirm, seat, complete and take a step back. */
  readonly advance: boolean;
  /** `cancel:bookings`. */
  readonly cancel: boolean;
  /** `noshow:bookings`. */
  readonly noShow: boolean;
}

export const NO_ABILITIES: BookingAbilities = { seat: false, advance: false, cancel: false, noShow: false };

export const abilitiesOf = (permissions: readonly string[]): BookingAbilities => ({
  seat: permissions.includes("create:bookings"),
  advance: permissions.includes("update:bookings"),
  cancel: permissions.includes("cancel:bookings"),
  noShow: permissions.includes("noshow:bookings"),
});
