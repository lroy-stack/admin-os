import { insufficientScope, type OAuthResourceAuth } from "@cloudflare/workers-oauth-provider";

import { demoActor } from "@/config/actor";
import { CATALOG } from "@/config/catalog";
import type { McpCaller, McpEnv } from "@/config/mcp.server";
import { MCP_MANIFEST } from "@/config/mcp-manifest";
import { resolveVertical } from "@/config/vertical";
import type { AnyCapability } from "@/core/capability";
import { exposedCapabilities, needsWriteScope, SCOPES, toolNameOf } from "@/core/mcp/server";

/**
 * The step-up gate (ADR 0016 D3, request path step 5): a `tools/call` of a write the grant's role holds, from a token
 * without `write`, answers `403 insufficient_scope` naming every scope the call needs, so the client asks the person
 * for `write` and retries. It runs before the projection because SDK 2.4.0 answers per-call challenges only for an
 * `McpServer` (V5); the projection applies the same permissions, so a gate defect fails closed as `access.forbidden`.
 */

const TOOLS: ReadonlyMap<string, AnyCapability> = new Map(
  exposedCapabilities(CATALOG, MCP_MANIFEST).map((capability) => [toolNameOf(capability.id), capability]),
);

/** The tool names a JSON-RPC body calls. The body is the source of truth: 2025-era requests carry no `Mcp-Name`. */
const calledTools = (body: unknown): string[] =>
  (Array.isArray(body) ? body : [body]).flatMap((message: unknown) => {
    if (typeof message !== "object" || message === null) return [];
    const { method, params } = message as { method?: unknown; params?: { name?: unknown } };
    return method === "tools/call" && typeof params?.name === "string" ? [params.name] : [];
  });

/** A clone's body as text, or undefined once it passes `maxBytes`: the gate never buffers more than the SDK accepts. */
async function boundedText(request: Request, maxBytes: number): Promise<string | undefined> {
  const reader = request.clone().body?.getReader();
  if (reader === undefined) return undefined;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (let read = await reader.read(); !read.done; read = await reader.read()) {
    size += read.value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(read.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

/** The `403` for a call that waits on `write`, and the tool it names, for the call's log line. */
export interface ScopeChallenge {
  readonly response: Response;
  readonly tool: string;
}

/**
 * The challenge for `request`, or undefined when no call in it waits on `write`. A body past the SDK's bound, or one
 * that is not JSON, is left to the SDK (`413`, a parse error); skipping the gate only ever leaves the projection's
 * `access.forbidden`.
 */
export async function scopeChallenge(
  request: Request,
  caller: McpCaller,
  env: McpEnv,
  auth: OAuthResourceAuth,
  maxBodyBytes: number,
): Promise<ScopeChallenge | undefined> {
  if (request.method !== "POST") return undefined;
  const text = await boundedText(request, maxBodyBytes);
  if (text === undefined) return undefined;
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return undefined;
  }
  const { permissions } = demoActor(caller.roleId, resolveVertical(env.VERTICAL));
  const waiting = calledTools(body).find((name) => {
    const capability = TOOLS.get(name);
    return capability !== undefined && needsWriteScope(CATALOG, capability, permissions, caller.scopes);
  });
  return waiting === undefined ? undefined : { response: insufficientScope(auth, [...SCOPES]), tool: waiting };
}
