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
  IDEMPOTENCY_META_KEY,
  type ProjectionOptions,
  projectCatalog,
  toCallToolResult,
  toolNameOf,
  toolOf,
  visibleCapabilities,
} from "./project-catalog";
