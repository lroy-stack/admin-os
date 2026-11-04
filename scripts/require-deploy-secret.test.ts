import { describe, expect, it } from "vitest";

import { deployCheckMessage, missingSecrets, WORKERS } from "./require-deploy-secret.mjs";

const [web, mcp] = WORKERS;
const putOnWeb = 'printf %s "$value" | npx wrangler secret put DEMO_SESSION_SECRET -c wrangler.jsonc';
const putOnMcp = 'printf %s "$value" | npx wrangler secret put DEMO_SESSION_SECRET -c workers/mcp/wrangler.jsonc';

describe("missingSecrets", () => {
  it("names the required secret the Worker lacks", () => {
    const listed = JSON.stringify([{ name: "MCP_TOKENS", type: "secret_text" }]);
    expect(missingSecrets(listed, ["DEMO_SESSION_SECRET"])).toEqual(["DEMO_SESSION_SECRET"]);
  });

  it("is empty when the Worker has every required secret", () => {
    const listed = JSON.stringify([
      { name: "MCP_TOKENS", type: "secret_text" },
      { name: "DEMO_SESSION_SECRET", type: "secret_text" },
    ]);
    expect(missingSecrets(listed, ["DEMO_SESSION_SECRET"])).toEqual([]);
  });

  it("names every missing secret of a longer list", () => {
    expect(missingSecrets("[]", ["A", "B"])).toEqual(["A", "B"]);
  });
});

describe("deployCheckMessage", () => {
  it("is empty when both Workers have the secret", () => {
    expect(
      deployCheckMessage([
        { ...web, missing: [] },
        { ...mcp, missing: [] },
      ]),
    ).toBe("");
  });

  it("gives both Workers one new value when neither has the secret", () => {
    const message = deployCheckMessage([
      { ...web, missing: ["DEMO_SESSION_SECRET"] },
      { ...mcp, missing: ["DEMO_SESSION_SECRET"] },
    ]);
    expect(message).toBe(
      [
        "The web and MCP Workers have no secret DEMO_SESSION_SECRET. Set it before deploying; they share one value:",
        "",
        'value="$(openssl rand -base64 32)"',
        putOnWeb,
        putOnMcp,
      ].join("\n"),
    );
  });

  it("puts the known value on the MCP Worker only when the web Worker has it", () => {
    const message = deployCheckMessage([
      { ...web, missing: [] },
      { ...mcp, missing: ["DEMO_SESSION_SECRET"] },
    ]);
    expect(message).toContain(
      "put it on the MCP Worker only:\n\nnpx wrangler secret put DEMO_SESSION_SECRET -c workers/mcp/wrangler.jsonc\n",
    );
    expect(message).toContain("Cloudflare cannot show a secret again.");
    expect(message).toContain(`${putOnWeb}\n${putOnMcp}`);
  });

  it("puts the known value on the web Worker only when the MCP Worker has it", () => {
    const message = deployCheckMessage([
      { ...web, missing: ["DEMO_SESSION_SECRET"] },
      { ...mcp, missing: [] },
    ]);
    expect(message).toContain(
      "put it on the web Worker only:\n\nnpx wrangler secret put DEMO_SESSION_SECRET -c wrangler.jsonc\n",
    );
    expect(message).toContain(`${putOnWeb}\n${putOnMcp}`);
  });
});
