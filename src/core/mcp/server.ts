import "server-only";

export {
  type ExposedEntry,
  exposedCapabilities,
  isExposed,
  type ManifestEntry,
  type McpManifest,
  type ToolManifest,
  type UiOnlyEntry,
} from "./manifest";
export {
  annotationsOf,
  awaitingApprovalSchema,
  type ClientFactory,
  CORRELATION_META_KEY,
  IDEMPOTENCY_META_KEY,
  type ProjectionOptions,
  projectCatalog,
  TOOL_LIST_CACHE_HINT,
  toCallToolResult,
  toolListVersion,
  toolNameOf,
  toolOf,
  visibleCapabilities,
} from "./project-catalog";
