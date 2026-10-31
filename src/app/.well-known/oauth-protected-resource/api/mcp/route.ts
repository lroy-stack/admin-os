import { protectedResourceMetadata } from "@/config/mcp-http.server";

/** RFC 9728 protected-resource metadata for `/api/mcp`, at the path-aware well-known location (ADR 0009). */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protectedResourceMetadata;
