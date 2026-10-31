import { Client } from "@modelcontextprotocol/client";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { afterEach, describe, expect, it } from "vitest";

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Smoke check of `npm run --silent mcp:stdio` (ADR 0009): the real process, outside Next and outside Vitest's
 * `server-only` alias, answers over stdio and keeps stdout for the protocol.
 */

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const COMMAND = { command: "npm", args: ["run", "--silent", "mcp:stdio"], cwd: ROOT } as const;
const STARTUP_MS = 30_000;

const open: Client[] = [];

afterEach(async () => {
  await Promise.all(open.splice(0).map((client) => client.close()));
});

const connect = async (env: Record<string, string>, versionNegotiation: { mode: "legacy" | { pin: string } }) => {
  const client = new Client({ name: "admin-os-stdio-smoke", version: "0.0.0" }, { versionNegotiation });
  const transport = new StdioClientTransport({
    ...COMMAND,
    args: [...COMMAND.args],
    env: { ...getDefaultEnvironment(), ...env },
    stderr: "ignore",
  });
  await client.connect(transport);
  open.push(client);
  return client;
};

const linesOf = (text: string) => text.split("\n").filter((line) => line !== "");

/**
 * Everything the process writes to stdout for a scripted 2025 session, split into lines. Stdin stays open until
 * the expected answers arrive, since the transport drops requests still in flight when stdin ends.
 */
const rawStdout = (input: readonly object[], answers: number) =>
  new Promise<string[]>((resolve, reject) => {
    const child = spawn(COMMAND.command, [...COMMAND.args], { cwd: ROOT, stdio: ["pipe", "pipe", "ignore"] });
    let out = "";
    child.stdout.on("data", (chunk: Buffer) => {
      out += chunk.toString("utf8");
      if (linesOf(out).length >= answers) child.stdin.end();
    });
    child.on("error", reject);
    child.on("close", () => resolve(linesOf(out)));
    child.stdin.write(`${input.map((message) => JSON.stringify(message)).join("\n")}\n`);
  });

describe("npm run mcp:stdio", () => {
  it.each([
    ["legacy", { mode: "legacy" }],
    ["modern", { mode: { pin: "2026-07-28" } }],
  ] as const)(
    "answers tools/list as staff by default over the %s era",
    async (era, negotiation) => {
      const client = await connect({}, negotiation);
      const [{ tools }, me] = await Promise.all([
        client.listTools(),
        client.callTool({ name: "access_me_get", arguments: {} }),
      ]);
      expect([client.getProtocolEra(), tools.map((tool) => tool.name), me.structuredContent]).toEqual([
        era,
        expect.arrayContaining(["bookings_list", "customers_list"]),
        expect.objectContaining({ roleId: "staff" }),
      ]);
    },
    STARTUP_MS,
  );

  it(
    "acts as MCP_ROLE",
    async () => {
      const client = await connect({ MCP_ROLE: "owner" }, { mode: "legacy" });
      await client.listTools();
      const me = await client.callTool({ name: "access_me_get", arguments: {} });
      expect(me.structuredContent).toMatchObject({ roleId: "owner" });
    },
    STARTUP_MS,
  );

  it(
    "writes nothing but JSON-RPC to stdout",
    async () => {
      const lines = await rawStdout(
        [
          {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "raw", version: "0" } },
          },
          { jsonrpc: "2.0", method: "notifications/initialized" },
          { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "bookings_list", arguments: { limit: 1 } } },
        ],
        2,
      );
      expect(lines.map((line) => JSON.parse(line))).toEqual([
        expect.objectContaining({ jsonrpc: "2.0", id: 1 }),
        expect.objectContaining({ jsonrpc: "2.0", id: 2 }),
      ]);
    },
    STARTUP_MS,
  );
});
