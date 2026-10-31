import "server-only";

import { resolveVertical } from "./vertical";

/** The preset of this deployment, read from `VERTICAL` on every call so it never freezes into a module constant. */
export function getVertical() {
  return resolveVertical(process.env.VERTICAL);
}
