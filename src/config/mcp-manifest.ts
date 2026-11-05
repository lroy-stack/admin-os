import type { ToolManifest } from "@/core/mcp/server";
import { bookingsModule } from "@/modules/bookings";
import { catalogModule } from "@/modules/catalog";
import { customersModule } from "@/modules/customers";
import { notificationsModule } from "@/modules/notifications";
import { resourcesModule } from "@/modules/resources";
import { staffModule } from "@/modules/staff";

import type { CatalogById } from "./catalog";

/**
 * The MCP manifest of the kit (spec 004 D5): every capability is either a tool, with the title clients show, or
 * UI-only, with the reason. A new capability does not compile until it is classified. Inputs, outputs and effects
 * stay the capability's own; `ids` names, per id field, the tools that list valid values (spec 004 U3).
 *
 * The kernel's entries are kept here, and each module's come from its manifest (ADR 0017 §1). `satisfies` narrows a
 * module's id hints to the installed catalogue, so a hint to a tool that is not installed does not compile.
 *
 * Least data (spec 004 principle 7, AC8): a list tool returns `concise` rows, without the free text and the personal
 * data an agent does not need to pick a record; the full record stays one `get` away. The web app reads the
 * capability's own output, which is not changed. Free text that people or other agents wrote is `untrusted`: returned
 * as `{ untrusted: true, text }` wherever a tool returns it (ADR 0016, "Untrusted free text").
 * Names, tags and contact data of a record stay plain values, since an agent needs them to search and book, and the
 * server instructions tell it to treat every string as data; `contactName` is free text typed for a booking, so it
 * is marked. Notifications, resources, the catalogue and approvals carry no notes or contact data, so they stay as
 * they are.
 */
export const MCP_MANIFEST = {
  "access.me.get": { expose: true, title: "Who am I" },
  "approvals.get": { expose: true, title: "Check a held write" },
  "approvals.list": {
    uiOnly:
      "The queue a person decides from; it returns the held input, which an assistant has no need to read (spec 004, D7)",
  },
  "approvals.approve": {
    uiOnly: "Approving is the human step the policy exists for; an assistant must never approve its own write (D7)",
  },
  "approvals.reject": {
    uiOnly: "Rejecting is a person's decision, taken in the web app (D7)",
  },
  "approvals.policy.set": {
    uiOnly: "The owner's control over what assistants may do without asking; elevated and never an MCP tool (D7)",
  },
  "clock.get": { expose: true, title: "Business clock" },
  "settings.values.get": { expose: true, title: "Read settings" },
  "settings.values.update": { expose: true, title: "Change settings" },
  ...bookingsModule.mcp.tools,
  ...catalogModule.mcp.tools,
  ...customersModule.mcp.tools,
  ...notificationsModule.mcp.tools,
  ...resourcesModule.mcp.tools,
  ...staffModule.mcp.tools,
} as const satisfies ToolManifest<CatalogById>;
