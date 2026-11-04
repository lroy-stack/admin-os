import { describe, expect, it } from "vitest";

import {
  DEMO_MCP_TOKENS,
  grantReadOnlyFrom,
  mcpReadOnlyFrom,
  mcpRoleFrom,
  mcpScopesFrom,
  mcpTokensFrom,
  parseMcpTokens,
  parseReadOnly,
} from "./mcp-env";

describe("MCP_TOKENS (ADR 0009)", () => {
  it("maps each token to its role", () => {
    expect([...parseMcpTokens(" token-owner:owner, token-staff:staff ,")]).toEqual([
      ["token-owner", "owner"],
      ["token-staff", "staff"],
    ]);
  });

  it.each([
    ["no role", "token-owner"],
    ["an unknown role", "token-owner:superuser"],
    ["a short token", "short:owner"],
    ["a token with spaces", "token with spaces:owner"],
    ["an empty token", ":owner"],
  ])("rejects an entry with %s", (_case, raw) => {
    expect(() => parseMcpTokens(raw)).toThrow(/MCP_TOKENS entry 1 must be "<token>:<role>"/);
  });

  it("rejects a token given twice", () => {
    expect(() => parseMcpTokens("token-one:owner,token-one:staff")).toThrow(/entry 2 repeats an earlier token/);
  });

  it("never echoes a token in its error", () => {
    expect(() => parseMcpTokens("secret-token-value:superuser")).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("secret-token-value") }),
    );
  });

  it.each([
    ["unset on the mock adapter", {}, [...parseMcpTokens(DEMO_MCP_TOKENS)]],
    ["empty on the mock adapter", { MCP_TOKENS: "", DATA_ADAPTER: "mock" }, [...parseMcpTokens(DEMO_MCP_TOKENS)]],
    ["unset on another adapter", { DATA_ADAPTER: "supabase" }, []],
    [
      "set on another adapter",
      { MCP_TOKENS: "token-real:manager", DATA_ADAPTER: "supabase" },
      [["token-real", "manager"]],
    ],
    ["set on the mock adapter", { MCP_TOKENS: "token-real:manager" }, [["token-real", "manager"]]],
  ])("uses the right tokens when MCP_TOKENS is %s", (_case, env, expected) => {
    expect([...mcpTokensFrom(env)]).toEqual(expected);
  });
});

describe("MCP_ROLE (ADR 0009)", () => {
  it.each([
    [undefined, "staff"],
    ["", "staff"],
    ["owner", "owner"],
    ["manager", "manager"],
  ])("acts as %s → %s", (raw, roleId) => {
    expect(mcpRoleFrom(raw)).toBe(roleId);
  });

  it("fails loudly on an unknown role", () => {
    expect(() => mcpRoleFrom("superuser")).toThrow(/MCP_ROLE must be one of owner, manager, staff/);
  });
});

describe("MCP_SCOPES (spec 004, plan A2)", () => {
  it.each([
    ["unset", undefined, ["read"]],
    ["empty", " ", ["read"]],
    ["read", "read", ["read"]],
    ["space-separated, as OAuth writes them", "read write", ["read", "write"]],
    ["comma-separated, in any order", "write, read", ["read", "write"]],
    ["write alone, which includes read in effectivePermissions", "write", ["write"]],
  ])("reads %s as %j", (_case, raw, scopes) => {
    expect(mcpScopesFrom(raw)).toEqual(scopes);
  });

  it("fails loudly on an unknown scope", () => {
    expect(() => mcpScopesFrom("read admin")).toThrow(/MCP_SCOPES must be scopes from read, write.*got "read admin"/);
  });
});

describe("MCP_READ_ONLY (spec 004, hotfix)", () => {
  it.each([
    ["the public demo tokens", {}, true],
    ["the public demo tokens with an explicit mock adapter", { DATA_ADAPTER: "mock" }, true],
    ["private tokens", { MCP_TOKENS: "token-owner:owner" }, false],
    ["another adapter", { DATA_ADAPTER: "supabase" }, false],
    ["private tokens with MCP_READ_ONLY=true", { MCP_TOKENS: "token-owner:owner", MCP_READ_ONLY: "true" }, true],
    ["the demo tokens with MCP_READ_ONLY=false", { MCP_READ_ONLY: "false" }, false],
  ])("is read-only for %s → %s", (_case, env, readOnly) => {
    expect(mcpReadOnlyFrom(env)).toBe(readOnly);
  });

  it.each([
    ["while the public demo tokens are in force", {}, false],
    ["with MCP_READ_ONLY=true", { MCP_READ_ONLY: "true" }, true],
  ])("lets an OAuth grant write %s → read-only %s", (_case, env, readOnly) => {
    expect(grantReadOnlyFrom(env)).toBe(readOnly);
  });

  it.each([
    [undefined, undefined],
    ["", undefined],
    [" true ", true],
    ["false", false],
  ])("parses %j as %j", (raw, parsed) => {
    expect(parseReadOnly(raw)).toBe(parsed);
  });

  it("fails loudly on a malformed value", () => {
    expect(() => parseReadOnly("yes")).toThrow(/MCP_READ_ONLY must be "true" or "false"; got "yes"/);
  });
});
