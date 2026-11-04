import { CATALOG } from "@/config/catalog";
import type { McpLogLine } from "@/config/mcp.server";
import { toolNameOf } from "@/core/mcp/server";

/**
 * One structured line per tool call (ADR 0016, observability): the client's call line, or the projection's refusal,
 * reshaped for Workers Logs. No arguments, results, personal data or tokens.
 */
export interface McpCallLine {
  readonly event: "mcp.call";
  readonly correlationId: string;
  readonly clientId: string;
  readonly tool: string;
  /** `ok`, `error`, `awaiting_approval`, or `refused` when the projection answered before the client ran. */
  readonly status: string;
  readonly code?: string;
  /** How long the client's call took; a refusal never dispatches, so it has none. */
  readonly durationMs?: number;
  readonly via: "mcp-worker";
}

const KNOWN_TOOLS: ReadonlySet<string> = new Set(Object.keys(CATALOG).map(toolNameOf));
const TOOL_NAME = /^[a-z0-9_]{1,64}$/;

/** A refused call's tool name is whatever the client sent: it is logged only when it is a tool name in shape. */
export const loggedToolName = (name: string): string =>
  KNOWN_TOOLS.has(name) || TOOL_NAME.test(name) ? name : "<unknown>";

export const callLineOf = (line: McpLogLine, clientId: string): McpCallLine =>
  "event" in line
    ? {
        event: "mcp.call",
        correlationId: line.correlationId,
        clientId,
        tool: loggedToolName(line.tool),
        status: "refused",
        code: line.status,
        via: "mcp-worker",
      }
    : {
        event: "mcp.call",
        correlationId: line.correlationId,
        clientId,
        tool: toolNameOf(line.capability),
        status: line.status,
        ...(line.code === undefined ? {} : { code: line.code }),
        durationMs: line.durationMs,
        via: "mcp-worker",
      };
