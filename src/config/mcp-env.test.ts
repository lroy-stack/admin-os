import { describe, expect, it } from "vitest";

import { DEMO_MCP_TOKENS, mcpRoleFrom, mcpTokensFrom, parseMcpTokens } from "./mcp-env";

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
