import {
  type CallToolResult,
  Server,
  type ServerContext,
  type Tool,
  type ToolAnnotations,
} from "@modelcontextprotocol/server";
import { z } from "zod";

import type { AnyCapability, Catalog } from "@/core/capability";
import type { Actor, DataClient } from "@/core/client";
import { ErrorCodes } from "@/core/errors";
import { type CallResult, isAwaitingApproval } from "@/core/result";

/**
 * The MCP projection of the catalogue (ADR 0009): one tool per capability the actor may call, dispatched through the
 * same client as the UI, so permissions, approval, validation and error codes match by construction (spec D4).
 */

/** `_meta` key a client may set on `tools/call` to make a write safe to retry (ADR 0005 idempotency). */
export const IDEMPOTENCY_META_KEY = "admin-os/idempotencyKey";

/** The client the projection dispatches through, bound to the calling actor and one correlation id per call. */
export type ClientFactory = (actor: Actor, correlationId: string) => DataClient<Catalog>;

export interface ProjectionOptions {
  readonly catalog: Catalog;
  readonly actor: Actor;
  readonly createClient: ClientFactory;
  readonly serverInfo?: { readonly name: string; readonly version: string };
}

const DEFAULT_SERVER_INFO = { name: "admin-os", version: "0.1.0" } as const;
const JSON_SCHEMA_TARGET = "draft-2020-12";
const idempotencyKeySchema = z.string().min(1).max(128);

/** What a write held for a human returns: a pending state, not an error (ADR 0005). */
export const awaitingApprovalSchema = z.strictObject({
  status: z.literal("awaiting_approval"),
  approvalId: z.string().min(1),
});

/** `bookings.list` → `bookings_list`: MCP clients and models handle underscores in tool names best. */
export const toolNameOf = (capabilityId: string): string => capabilityId.replaceAll(".", "_");

export const annotationsOf = (capability: AnyCapability): ToolAnnotations => ({
  readOnlyHint: capability.effect === "read",
  destructiveHint: capability.effect === "destructive",
  idempotentHint: capability.effect === "read",
  // Capabilities act on this business's own data, never on an open world of external entities.
  openWorldHint: false,
});

/** A write may answer with its value or with `awaiting_approval`, so its advertised output covers both. */
const resultSchemaOf = (capability: AnyCapability): z.ZodType =>
  capability.effect === "read" ? capability.output : z.union([capability.output, awaitingApprovalSchema]);

type JsonObjectSchema = Tool["inputSchema"];

/** MCP requires object roots; a union root (`anyOf`) is object-shaped by construction, as the SDK also assumes. */
const jsonSchemaOf = (schema: z.ZodType, io: "input" | "output"): JsonObjectSchema => {
  const json = z.toJSONSchema(schema, { target: JSON_SCHEMA_TARGET, io }) as Record<string, unknown>;
  if (json.type !== undefined && json.type !== "object") {
    throw new Error(`MCP tool schemas must describe objects; got ${JSON.stringify(json.type)}`);
  }
  return { ...json, type: "object" };
};

/** The capabilities the actor holds the permission for: a tool the actor cannot call is never offered (ADR 0006). */
export const visibleCapabilities = (catalog: Catalog, actor: Actor): AnyCapability[] => {
  const held = new Set(actor.permissions);
  return Object.values(catalog).filter((capability) => held.has(capability.permission));
};

export const toolOf = (capability: AnyCapability): Tool => ({
  name: toolNameOf(capability.id),
  description: capability.summary,
  inputSchema: jsonSchemaOf(capability.input, "input"),
  outputSchema: jsonSchemaOf(resultSchemaOf(capability), "output"),
  annotations: annotationsOf(capability),
  _meta: { riskTier: capability.riskTier },
});

/** Tool name → capability for the actor; two ids that project to the same name are a catalogue bug and throw. */
const toolIndex = (catalog: Catalog, actor: Actor): ReadonlyMap<string, AnyCapability> => {
  const index = new Map<string, AnyCapability>();
  for (const capability of visibleCapabilities(catalog, actor)) {
    const name = toolNameOf(capability.id);
    const clash = index.get(name);
    if (clash) throw new Error(`Capabilities "${clash.id}" and "${capability.id}" both project to tool "${name}"`);
    index.set(name, capability);
  }
  return index;
};

const toolError = (code: string, message: string, details?: Readonly<Record<string, unknown>>): CallToolResult => ({
  content: [{ type: "text", text: `${code}: ${message}` }],
  structuredContent: details === undefined ? { code, message } : { code, message, details },
  isError: true,
});

/** `CallResult` → MCP result: `ok` is structured content, an error is a tool error, approval is a pending result. */
export const toCallToolResult = (result: CallResult<unknown>): CallToolResult => {
  if (isAwaitingApproval(result)) {
    return {
      content: [
        {
          type: "text",
          text: `awaiting_approval: held for a person to approve (approvalId ${result.approvalId}). Do not retry.`,
        },
      ],
      structuredContent: { status: result.status, approvalId: result.approvalId },
    };
  }
  if (!result.ok) return toolError(result.error.code, result.error.message, result.error.details);
  const value = result.value as Record<string, unknown>;
  return { content: [{ type: "text", text: JSON.stringify(value) }], structuredContent: value };
};

const forbidden = (name: string) =>
  toolError(
    ErrorCodes.forbidden,
    `Tool "${name}" is not available to this actor. Call tools/list for the tools you may use.`,
  );

/** Reads need no key; a write carries the client's key when `_meta` offers a valid one (ADR 0009). */
const idempotencyKeyOf = (
  capability: AnyCapability,
  meta: ServerContext["mcpReq"]["_meta"],
): { readonly key?: string; readonly invalid: boolean } => {
  const raw = meta?.[IDEMPOTENCY_META_KEY];
  if (capability.effect === "read" || raw === undefined) return { invalid: false };
  const parsed = idempotencyKeySchema.safeParse(raw);
  return parsed.success ? { key: parsed.data, invalid: false } : { invalid: true };
};

/**
 * A low-level MCP `Server` for one actor, transport-agnostic: the transports (ADR 0009, T8b) resolve the actor and
 * connect it. It lists only the actor's tools and answers unlisted names with `access.forbidden`, like the UI.
 */
export function projectCatalog(options: ProjectionOptions): Server {
  const { catalog, actor, createClient, serverInfo = DEFAULT_SERVER_INFO } = options;
  const index = toolIndex(catalog, actor);
  const tools = [...index.values()].map(toolOf);
  const outputSchemas = new Map(tools.map((tool) => [tool.name, tool.outputSchema]));

  // The list is fixed for this instance (one actor), so no list-changed notifications are ever sent.
  const server = new Server({ ...serverInfo }, { capabilities: { tools: { listChanged: false } } });

  server.setRequestHandler("tools/list", () => ({ tools }));

  server.setRequestHandler("tools/call", async (request, ctx) => {
    const { name } = request.params;
    const capability = index.get(name);
    if (capability === undefined) return forbidden(name);
    const idempotency = idempotencyKeyOf(capability, ctx.mcpReq._meta);
    if (idempotency.invalid) {
      return toolError(ErrorCodes.invalidInput, `${IDEMPOTENCY_META_KEY} must be a string of 1 to 128 characters`, {
        paths: [`_meta.${IDEMPOTENCY_META_KEY}`],
      });
    }
    const client = createClient(actor, crypto.randomUUID());
    // The client validates the arguments itself, so a bad input is `schema.invalid_input` exactly as in the UI.
    const result = await client.call(capability.id, request.params.arguments ?? {}, {
      signal: ctx.mcpReq.signal,
      ...(idempotency.key === undefined ? {} : { idempotencyKey: idempotency.key }),
    });
    return server.projectCallToolResult(toCallToolResult(result), outputSchemas.get(name));
  });

  return server;
}
