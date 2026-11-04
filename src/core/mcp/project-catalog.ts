import {
  type CallToolResult,
  type JSONValue,
  Server,
  type ServerContext,
  type Tool,
  type ToolAnnotations,
} from "@modelcontextprotocol/server";
import { z } from "zod";

import type { AnyCapability, Catalog } from "@/core/capability";
import { type Actor, type DataClient, idempotencyKeySchema } from "@/core/client";
import { ErrorCodes } from "@/core/errors";
import { type CallResult, isAwaitingApproval } from "@/core/result";

import { type ExposedEntry, exposedCapabilities, type McpManifest } from "./manifest";

/**
 * The MCP projection of the catalogue (ADR 0009): one tool per capability the manifest exposes and the actor may
 * call, dispatched through the same client as the UI, so permissions, approval, validation and error codes match by
 * construction (spec D4).
 */

/**
 * The argument a create or add tool requires, so a retry applies once (spec 004 D6): a model writes `arguments`,
 * while `_meta` belongs to the host.
 */
export const IDEMPOTENCY_ARGUMENT = "idempotencyKey";

/** `_meta` key a host may also set on `tools/call` to make a write safe to retry (ADR 0005 idempotency). */
export const IDEMPOTENCY_META_KEY = "admin-os/idempotencyKey";

/** Tool `_meta` key with the capability's risk tier (0 to 3). */
export const RISK_TIER_META_KEY = "admin-os/riskTier";

/** Tool `_meta` key, present and true when the tool requires the `IDEMPOTENCY_ARGUMENT` argument. */
export const REQUIRES_KEY_META_KEY = "admin-os/requiresIdempotencyKey";

const IDEMPOTENCY_ARGUMENT_DESCRIPTION =
  "A new unique string (a UUID works) for each distinct operation. Retrying with the same key and the same arguments returns the first result instead of applying it twice; the same key with other arguments fails with client.idempotency_conflict.";

/** The client the projection dispatches through, bound to the calling actor and one correlation id per call. */
export type ClientFactory = (actor: Actor, correlationId: string) => DataClient<Catalog>;

export interface ProjectionOptions {
  readonly catalog: Catalog;
  /** Which capabilities are tools, and their titles (spec 004 D5); every capability of `catalog` has an entry. */
  readonly manifest: McpManifest;
  readonly actor: Actor;
  readonly createClient: ClientFactory;
  readonly serverInfo?: { readonly name: string; readonly version: string };
  /** Lists and runs read tools only; a write the actor could otherwise call answers `access.forbidden`. */
  readonly readOnly?: boolean;
}

const DEFAULT_SERVER_INFO = { name: "admin-os", version: "0.1.0" } as const;
const JSON_SCHEMA_TARGET = "draft-2020-12";

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

/** The capability's input, plus the required `idempotencyKey` argument when the capability needs a key (D6). */
const inputSchemaOf = (capability: AnyCapability): JsonObjectSchema => {
  const schema = jsonSchemaOf(capability.input, "input");
  if (capability.requiresIdempotencyKey !== true) return schema;
  const { properties } = schema;
  if (properties === undefined || Object.hasOwn(properties, IDEMPOTENCY_ARGUMENT)) {
    throw new Error(
      `${capability.id} needs an idempotency key, so its input must be an object without a field named "${IDEMPOTENCY_ARGUMENT}"`,
    );
  }
  const { $schema: _dialect, ...keySchema } = z.toJSONSchema(
    idempotencyKeySchema.describe(IDEMPOTENCY_ARGUMENT_DESCRIPTION),
    { target: JSON_SCHEMA_TARGET },
  );
  return {
    ...schema,
    properties: { ...properties, [IDEMPOTENCY_ARGUMENT]: keySchema as JSONValue },
    required: [...(schema.required ?? []), IDEMPOTENCY_ARGUMENT],
  };
};

/**
 * The exposed capabilities the actor holds the permission for: a tool the actor cannot call is never offered
 * (ADR 0006), and a UI-only capability is never a tool.
 */
export const visibleCapabilities = (catalog: Catalog, manifest: McpManifest, actor: Actor): AnyCapability[] => {
  const held = new Set(actor.permissions);
  return exposedCapabilities(catalog, manifest).filter((capability) => held.has(capability.permission));
};

export const toolOf = (capability: AnyCapability, entry: ExposedEntry): Tool => ({
  name: toolNameOf(capability.id),
  title: entry.title,
  description: capability.summary,
  inputSchema: inputSchemaOf(capability),
  outputSchema: jsonSchemaOf(resultSchemaOf(capability), "output"),
  annotations: annotationsOf(capability),
  _meta: {
    [RISK_TIER_META_KEY]: capability.riskTier,
    ...(capability.requiresIdempotencyKey === true ? { [REQUIRES_KEY_META_KEY]: true } : {}),
  },
});

/** Tool name → capability for the actor; two ids that project to the same name are a catalogue bug and throw. */
const toolIndex = (
  catalog: Catalog,
  manifest: McpManifest,
  actor: Actor,
  readOnly: boolean,
): ReadonlyMap<string, AnyCapability> => {
  const index = new Map<string, AnyCapability>();
  const listed = visibleCapabilities(catalog, manifest, actor).filter(
    (capability) => !readOnly || capability.effect === "read",
  );
  for (const capability of listed) {
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

const readOnlyRefusal = (name: string) =>
  toolError(
    ErrorCodes.forbidden,
    `Tool "${name}" changes data, and this server is read-only: it lists and runs read tools only.`,
  );

type ToolArguments = Readonly<Record<string, unknown>>;

/** What a call carries for the client: the capability's own arguments and, for a write, the idempotency key. */
type PreparedCall =
  | { readonly ok: true; readonly input: ToolArguments; readonly key?: string }
  | { readonly ok: false; readonly error: CallToolResult };

const keyIssue = (where: string) =>
  toolError(ErrorCodes.invalidInput, `${where} must be a string of 1 to 128 characters`, { paths: [where] });

/**
 * Splits the key from the arguments (spec 004 D6). A create or add takes `idempotencyKey` as an argument; a host may
 * also send `_meta["admin-os/idempotencyKey"]`, and when both arrive they must be the same key. Set-state writes take
 * no key argument but keep a `_meta` key when the host sends one; reads ignore both.
 */
const prepareCall = (capability: AnyCapability, args: ToolArguments, meta: ServerContext["mcpReq"]["_meta"]) => {
  if (capability.effect === "read") return { ok: true, input: args } satisfies PreparedCall;
  const keyed = capability.requiresIdempotencyKey === true;
  const { [IDEMPOTENCY_ARGUMENT]: rawArgument, ...rest } = args;
  const input = keyed ? rest : args;
  const rawMeta = meta?.[IDEMPOTENCY_META_KEY];
  const fromMeta = idempotencyKeySchema.safeParse(rawMeta);
  if (rawMeta !== undefined && !fromMeta.success) {
    return { ok: false, error: keyIssue(`_meta.${IDEMPOTENCY_META_KEY}`) } satisfies PreparedCall;
  }
  const fromArgument = idempotencyKeySchema.safeParse(rawArgument);
  if (keyed && rawArgument !== undefined && !fromArgument.success) {
    return { ok: false, error: keyIssue(IDEMPOTENCY_ARGUMENT) } satisfies PreparedCall;
  }
  const argumentKey = keyed && fromArgument.success ? fromArgument.data : undefined;
  const metaKey = fromMeta.success ? fromMeta.data : undefined;
  if (argumentKey !== undefined && metaKey !== undefined && argumentKey !== metaKey) {
    return {
      ok: false,
      error: toolError(
        ErrorCodes.invalidInput,
        `The ${IDEMPOTENCY_ARGUMENT} argument and _meta.${IDEMPOTENCY_META_KEY} carry different keys; send one key, or the same key in both`,
        { paths: [IDEMPOTENCY_ARGUMENT, `_meta.${IDEMPOTENCY_META_KEY}`] },
      ),
    } satisfies PreparedCall;
  }
  const key = argumentKey ?? metaKey;
  if (keyed && key === undefined) {
    return {
      ok: false,
      error: toolError(
        ErrorCodes.idempotencyRequired,
        `${toolNameOf(capability.id)} needs the ${IDEMPOTENCY_ARGUMENT} argument`,
        {
          paths: [IDEMPOTENCY_ARGUMENT],
        },
      ),
    } satisfies PreparedCall;
  }
  return { ok: true, input, ...(key === undefined ? {} : { key }) } satisfies PreparedCall;
};

/**
 * A low-level MCP `Server` for one actor, transport-agnostic: the transports (ADR 0009, T8b) resolve the actor and
 * connect it. It lists only the actor's tools and answers unlisted names with `access.forbidden`, like the UI.
 */
export function projectCatalog(options: ProjectionOptions): Server {
  const { catalog, manifest, actor, createClient, serverInfo = DEFAULT_SERVER_INFO, readOnly = false } = options;
  const index = toolIndex(catalog, manifest, actor, readOnly);
  const withheldWrites = new Set(
    readOnly
      ? visibleCapabilities(catalog, manifest, actor)
          .filter((capability) => capability.effect !== "read")
          .map((capability) => toolNameOf(capability.id))
      : [],
  );
  const tools = [...index.values()].map((capability) => toolOf(capability, manifest[capability.id] as ExposedEntry));
  const outputSchemas = new Map(tools.map((tool) => [tool.name, tool.outputSchema]));

  // The list is fixed for this instance (one actor), so no list-changed notifications are ever sent.
  const server = new Server({ ...serverInfo }, { capabilities: { tools: { listChanged: false } } });

  server.setRequestHandler("tools/list", () => ({ tools }));

  server.setRequestHandler("tools/call", async (request, ctx) => {
    const { name } = request.params;
    const capability = index.get(name);
    if (capability === undefined) return withheldWrites.has(name) ? readOnlyRefusal(name) : forbidden(name);
    const prepared: PreparedCall = prepareCall(capability, request.params.arguments ?? {}, ctx.mcpReq._meta);
    if (!prepared.ok) return prepared.error;
    const client = createClient(actor, crypto.randomUUID());
    // The client validates the arguments itself, so a bad input is `schema.invalid_input` exactly as in the UI.
    const result = await client.call(capability.id, prepared.input, {
      signal: ctx.mcpReq.signal,
      ...(prepared.key === undefined ? {} : { idempotencyKey: prepared.key }),
    });
    return server.projectCallToolResult(toCallToolResult(result), outputSchemas.get(name));
  });

  return server;
}
