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

const IDEMPOTENCY_ARGUMENT_DESCRIPTION =
  "A new unique string (a UUID works) for each distinct operation. Retrying with the same key and the same arguments returns the first result instead of applying it twice; the same key with other arguments fails with client.idempotency_conflict.";

/** The client the projection dispatches through, bound to the calling actor and one correlation id per call. */
export type ClientFactory = (actor: Actor, correlationId: string) => DataClient<Catalog>;

/** What the server's `instructions` are built from: the capabilities this actor is offered as tools. */
export interface InstructionsContext {
  readonly toolIds: ReadonlySet<string>;
  readonly readOnly: boolean;
}

/**
 * The log line of a call refused before it reaches the client (unknown, forbidden or read-only tool, missing or bad
 * key), so a write attempted against a read-only server is audited too. `status` is the error code.
 */
export interface RefusalLogLine {
  readonly event: "mcp.refused";
  readonly tool: string;
  readonly status: string;
  readonly correlationId: string;
  readonly actorRole: string;
  readonly via: "mcp";
}

export interface ProjectionOptions {
  readonly catalog: Catalog;
  /** Which capabilities are tools, and their titles (spec 004 D5); every capability of `catalog` has an entry. */
  readonly manifest: McpManifest;
  readonly actor: Actor;
  readonly createClient: ClientFactory;
  /** Lists and runs read tools only; a write the actor could otherwise call answers `access.forbidden`. */
  readonly readOnly?: boolean;
  /** The server's `instructions`, from the tools this actor sees: how to find ids and what a held write means. */
  readonly instructions?: (context: InstructionsContext) => string;
  /** Where refusal lines go; the client writes the line of every call it dispatches. Defaults to `console.info`. */
  readonly logRefusal?: (line: RefusalLogLine) => void;
}

const SERVER_NAME = "admin-os";
const JSON_SCHEMA_TARGET = "draft-2020-12";

/**
 * `tools/list` cache hint (protocol 2026-07-28). The list is fixed for a deployment and a token, and a deploy that
 * changes it changes `serverInfo.version`; `private` because the list depends on who asks.
 */
export const TOOL_LIST_CACHE_HINT = { ttlMs: 5 * 60 * 1000, cacheScope: "private" } as const;

/** What a write held for a human returns: a pending state, not an error (ADR 0005). */
export const awaitingApprovalSchema = z.strictObject({
  status: z.literal("awaiting_approval"),
  approvalId: z.string().min(1),
});

/** `bookings.list` → `bookings_list`: MCP clients and models handle underscores in tool names best. */
export const toolNameOf = (capabilityId: string): string => capabilityId.replaceAll(".", "_");

/**
 * The hints from the descriptor (spec 004 U2). A write is destructive unless its `change` only adds or moves a
 * state; it is idempotent when it declares an idempotency mode (`target-state`: a repeat reaches the same state;
 * `key`: a retry with the same key replays) or requires a key. A write that declares neither keeps the MCP defaults:
 * destructive and not idempotent.
 */
export const annotationsOf = (capability: AnyCapability): ToolAnnotations => {
  const isRead = capability.effect === "read";
  const { change } = capability;
  return {
    readOnlyHint: isRead,
    destructiveHint: !isRead && (capability.effect === "destructive" || (change !== "add" && change !== "set")),
    idempotentHint: isRead || capability.idempotency !== undefined || capability.requiresIdempotencyKey === true,
    // Capabilities act on this business's own data, never on an open world of external entities.
    openWorldHint: false,
  };
};

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

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A summary names other capabilities by id (`customers.create`); an agent calls them by tool name, so each id of a
 * listed tool is written as its tool name. A longer dotted name (`bookings.walk_in.undo_seconds`, a setting) is left
 * alone.
 */
const withToolNames = (text: string, toolIds: ReadonlySet<string>): string => {
  if (toolIds.size === 0) return text;
  const alternatives = [...toolIds].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const mention = new RegExp(`(?<![\\w.])(?:${alternatives.join("|")})(?![\\w]|\\.\\w)`, "g");
  return text.replace(mention, toolNameOf);
};

/**
 * "customerId with customers_list or customers_duplicates_check": where each id field's valid values come from,
 * naming only tools in `toolIds`, and only the `fields` asked for when given.
 */
const idSourcesOf = (entry: ExposedEntry, toolIds: ReadonlySet<string>, fields?: readonly string[]): string[] =>
  Object.entries(entry.ids ?? {})
    .filter(([field]) => fields === undefined || fields.includes(field))
    .map(([field, ids]) => [field, ids.filter((id) => toolIds.has(id))] as const)
    .filter(([, ids]) => ids.length > 0)
    .map(([field, ids]) => `${field} with ${ids.map(toolNameOf).join(" or ")}`);

const descriptionOf = (capability: AnyCapability, entry: ExposedEntry, toolIds: ReadonlySet<string>): string => {
  const summary = withToolNames(capability.summary, toolIds);
  const sources = idSourcesOf(entry, toolIds);
  return sources.length === 0 ? summary : `${summary} Find valid ids: ${sources.join("; ")}.`;
};

/** `toolIds` are the capabilities listed as tools, so the description can name them by tool name. */
export const toolOf = (
  capability: AnyCapability,
  entry: ExposedEntry,
  toolIds: ReadonlySet<string> = new Set(),
): Tool => ({
  name: toolNameOf(capability.id),
  title: entry.title,
  description: descriptionOf(capability, entry, toolIds),
  inputSchema: inputSchemaOf(capability),
  outputSchema: jsonSchemaOf(resultSchemaOf(capability), "output"),
  annotations: annotationsOf(capability),
  // The key requirement is the required `idempotencyKey` argument itself, so `_meta` carries the tier only.
  _meta: { [RISK_TIER_META_KEY]: capability.riskTier },
});

/** Tools in name order, so the list does not depend on how the catalogue was merged (spec 004 D8). */
const byName = (a: Tool, b: Tool): number => Number(a.name > b.name) - Number(a.name < b.name);

/** cyrb53: a fast, stable 53-bit string hash, as 14 hex digits. A fingerprint, not a security boundary. */
const hashOf = (text: string): string => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
};

const versions = new WeakMap<Catalog, WeakMap<McpManifest, Map<boolean, string>>>();

/**
 * `serverInfo.version`: a hash of the manifest, the read-only switch and every tool the deployment exposes, whoever
 * asks (spec 004 D8), so a client that caches the tool list sees a new version whenever a title, schema, annotation
 * or classification changes, or a deploy only flips `MCP_READ_ONLY`.
 */
export const toolListVersion = (catalog: Catalog, manifest: McpManifest, readOnly = false): string => {
  const known = versions.get(catalog)?.get(manifest)?.get(readOnly);
  if (known !== undefined) return known;
  const exposed = exposedCapabilities(catalog, manifest).filter(
    (capability) => !readOnly || capability.effect === "read",
  );
  const toolIds = new Set(exposed.map((capability) => capability.id));
  const tools = exposed
    .map((capability) => toolOf(capability, manifest[capability.id] as ExposedEntry, toolIds))
    .sort(byName);
  const version = hashOf(JSON.stringify({ manifest, readOnly, tools }));
  const forCatalog = versions.get(catalog) ?? new WeakMap<McpManifest, Map<boolean, string>>();
  const forManifest = forCatalog.get(manifest) ?? new Map<boolean, string>();
  forManifest.set(readOnly, version);
  forCatalog.set(manifest, forManifest);
  versions.set(catalog, forCatalog);
  return version;
};

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

const KEY_ADVICE = "send a new UUID for this operation, and the same one if you retry it";

const keyIssue = (where: string) =>
  toolError(ErrorCodes.invalidInput, `${where} must be a string of 1 to 128 characters: ${KEY_ADVICE}.`, {
    paths: [where],
  });

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
        `${toolNameOf(capability.id)} needs the ${IDEMPOTENCY_ARGUMENT} argument, a string of 1 to 128 characters: ${KEY_ADVICE}. Nothing was changed.`,
        { paths: [IDEMPOTENCY_ARGUMENT] },
      ),
    } satisfies PreparedCall;
  }
  return { ok: true, input, ...(key === undefined ? {} : { key }) } satisfies PreparedCall;
};

/**
 * The client's `schema.invalid_input` names the failing paths; an agent also needs what is wrong with each and where a
 * valid id comes from. The arguments are parsed again here, on the error path only, for the issue messages.
 */
const explainInvalidInput = (
  capability: AnyCapability,
  entry: ExposedEntry,
  toolIds: ReadonlySet<string>,
  input: ToolArguments,
  details: Readonly<Record<string, unknown>> | undefined,
): CallToolResult | undefined => {
  const parsed = capability.input.safeParse(input);
  if (parsed.success) return undefined;
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".") || "(arguments)"}: ${issue.message}`);
  const fields = parsed.error.issues.map((issue) => String(issue.path[0] ?? ""));
  const sources = idSourcesOf(entry, toolIds, fields);
  const message = [
    `${toolNameOf(capability.id)} rejected its arguments: ${issues.join("; ")}.`,
    "Fix these fields to match the tool's inputSchema in tools/list and call again; nothing was changed.",
    ...(sources.length === 0 ? [] : [`Find valid ids: ${sources.join("; ")}.`]),
  ].join(" ");
  return toolError(ErrorCodes.invalidInput, message, details);
};

/** A `<module>.not_found` answer points to the tools that list valid ids, when the manifest names them. */
const explainNotFound = (
  entry: ExposedEntry,
  toolIds: ReadonlySet<string>,
  error: { readonly code: string; readonly message: string; readonly details?: Readonly<Record<string, unknown>> },
): CallToolResult | undefined => {
  const sources = idSourcesOf(entry, toolIds);
  if (!error.code.endsWith(".not_found") || sources.length === 0) return undefined;
  return toolError(error.code, `${error.message}. Find valid ids: ${sources.join("; ")}.`, error.details);
};

/** Result `_meta` key with the call's correlation id, the one in the server's call log line (spec 004 U3). */
export const CORRELATION_META_KEY = "admin-os/correlationId";

const withCorrelation = (result: CallToolResult, correlationId: string): CallToolResult => ({
  ...result,
  _meta: { ...result._meta, [CORRELATION_META_KEY]: correlationId },
});

/**
 * A low-level MCP `Server` for one actor, transport-agnostic: the transports (ADR 0009, T8b) resolve the actor and
 * connect it. It lists only the actor's tools and answers unlisted names with `access.forbidden`, like the UI.
 */
export function projectCatalog(options: ProjectionOptions): Server {
  const {
    catalog,
    manifest,
    actor,
    createClient,
    readOnly = false,
    instructions,
    logRefusal = (line) => console.info(JSON.stringify(line)),
  } = options;
  const index = toolIndex(catalog, manifest, actor, readOnly);
  const withheldWrites = new Set(
    readOnly
      ? visibleCapabilities(catalog, manifest, actor)
          .filter((capability) => capability.effect !== "read")
          .map((capability) => toolNameOf(capability.id))
      : [],
  );
  // Descriptions name only tools this actor is offered: another role's tool, or a write on a read-only server, would
  // be a name the agent cannot call.
  const toolIds = new Set([...index.values()].map((capability) => capability.id));
  const tools = [...index.values()]
    .map((capability) => toolOf(capability, manifest[capability.id] as ExposedEntry, toolIds))
    .sort(byName);
  const outputSchemas = new Map(tools.map((tool) => [tool.name, tool.outputSchema]));

  // The list is fixed for this instance (one actor), so no list-changed notifications are ever sent; a client learns
  // of a new list from the version and the cache hint.
  const server = new Server(
    { name: SERVER_NAME, version: toolListVersion(catalog, manifest, readOnly) },
    {
      capabilities: { tools: { listChanged: false } },
      cacheHints: { "tools/list": TOOL_LIST_CACHE_HINT },
      ...(instructions === undefined ? {} : { instructions: instructions({ toolIds, readOnly }) }),
    },
  );

  server.setRequestHandler("tools/list", () => ({ tools }));

  /** The client's answer as an MCP result; an input or not-found error also says how to fix the call. */
  const resultOf = (capability: AnyCapability, input: ToolArguments, result: CallResult<unknown>): CallToolResult => {
    if (isAwaitingApproval(result) || result.ok) return toCallToolResult(result);
    const entry = manifest[capability.id] as ExposedEntry;
    const explained =
      result.error.code === ErrorCodes.invalidInput
        ? explainInvalidInput(capability, entry, toolIds, input, result.error.details)
        : explainNotFound(entry, toolIds, result.error);
    return explained ?? toCallToolResult(result);
  };

  server.setRequestHandler("tools/call", async (request, ctx) => {
    const { name } = request.params;
    const correlationId = crypto.randomUUID();
    const refuse = (error: CallToolResult): CallToolResult => {
      const status = (error.structuredContent as { readonly code: string }).code;
      logRefusal({ event: "mcp.refused", tool: name, status, correlationId, actorRole: actor.roleId, via: "mcp" });
      return withCorrelation(error, correlationId);
    };
    const capability = index.get(name);
    if (capability === undefined) return refuse(withheldWrites.has(name) ? readOnlyRefusal(name) : forbidden(name));
    const prepared: PreparedCall = prepareCall(capability, request.params.arguments ?? {}, ctx.mcpReq._meta);
    if (!prepared.ok) return refuse(prepared.error);
    const client = createClient(actor, correlationId);
    // The client validates the arguments itself, so a bad input is `schema.invalid_input` exactly as in the UI.
    const result = await client.call(capability.id, prepared.input, {
      signal: ctx.mcpReq.signal,
      ...(prepared.key === undefined ? {} : { idempotencyKey: prepared.key }),
    });
    const projected = server.projectCallToolResult(
      resultOf(capability, prepared.input, result),
      outputSchemas.get(name),
    );
    return withCorrelation(projected, correlationId);
  });

  return server;
}
