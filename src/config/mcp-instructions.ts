import { type InstructionsContext, toolNameOf } from "@/core/mcp/server";

import { CATALOG, type CapabilityId } from "./catalog";

const ID_SOURCES = [
  ["booking ids", ["bookings.list"]],
  ["customer ids", ["customers.list", "customers.duplicates.check"]],
  ["resource ids", ["resources.list", "bookings.availability.get"]],
  ["notification ids", ["notifications.list"]],
] as const satisfies readonly (readonly [string, readonly CapabilityId[]])[];

const toolNamesOf = (ids: readonly string[], toolIds: ReadonlySet<string>): string[] =>
  ids.filter((id) => toolIds.has(id)).map(toolNameOf);

/**
 * The server's `instructions` (spec 004 U2): where ids come from and what a held write means, naming only the tools
 * this actor is offered, as the descriptions do.
 */
export const mcpInstructions = ({ toolIds, readOnly }: InstructionsContext): string => {
  const offered = [...toolIds].sort();
  const sources = ID_SOURCES.map(([what, ids]) => [what, toolNamesOf(ids, toolIds)] as const)
    .filter(([, names]) => names.length > 0)
    .map(([what, names]) => `${what} with ${names.join(" or ")}`);
  const keyed = toolNamesOf(
    offered.filter((id) => CATALOG[id]?.requiresIdempotencyKey === true),
    toolIds,
  );
  const writes = offered.some((id) => CATALOG[id]?.effect !== "read");
  return [
    "admin-OS runs one small business: bookings, customers, resources (tables, chairs or bays), staff, catalog items and notifications.",
    ...(sources.length > 0 ? [`Never guess an id: find ${sources.join(", ")}.`] : []),
    ...(toolIds.has("clock.get") ? ["clock_get gives today's business day."] : []),
    ...(readOnly ? ["This server is read-only: it lists and runs read tools only."] : []),
    ...(keyed.length > 0
      ? [
          `${keyed.join(", ")} require an idempotencyKey argument: a new UUID for each operation, the same one when you retry it.`,
        ]
      : []),
    ...(writes ? ["A write may answer awaiting_approval: a person must approve it first, so do not retry it."] : []),
    "An error names the field to fix and, for an id, the tool that lists valid ones.",
  ].join(" ");
};
