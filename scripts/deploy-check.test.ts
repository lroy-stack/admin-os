import { describe, expect, it } from "vitest";

import { deployCheckMessage, missingSecrets, siteUrlError, WORKERS } from "./deploy-check.mjs";

const [web, mcp] = WORKERS;
const deployWithUrl = "NEXT_PUBLIC_SITE_URL=https://admin-os.example.com npm run deploy";
const NOT_AN_ORIGIN = "not the public https origin of the site";

describe("siteUrlError", () => {
  it("asks for the public URL when it is not set", () => {
    expect(siteUrlError(undefined)).toBe(
      [
        "NEXT_PUBLIC_SITE_URL is not set. The build writes it into canonical, Open Graph and sitemap links; deploy with your public URL:",
        "",
        deployWithUrl,
      ].join("\n"),
    );
  });

  it("treats an empty value as not set", () => {
    expect(siteUrlError("")).toBe(siteUrlError(undefined));
  });

  it("refuses a localhost URL", () => {
    expect(siteUrlError("http://localhost:3000")).toBe(
      [
        'NEXT_PUBLIC_SITE_URL is "http://localhost:3000", not the public https origin of the site (scheme and host only). The build writes it into canonical, Open Graph and sitemap links; deploy with your public URL:',
        "",
        deployWithUrl,
      ].join("\n"),
    );
  });

  it("refuses a loopback address over https", () => {
    expect(siteUrlError("https://127.0.0.1")).toContain(NOT_AN_ORIGIN);
  });

  it("refuses any address of the loopback range", () => {
    expect(siteUrlError("https://127.0.0.2")).toContain(NOT_AN_ORIGIN);
  });

  it("refuses localhost written with a trailing dot", () => {
    expect(siteUrlError("https://localhost.")).toContain(NOT_AN_ORIGIN);
  });

  it("refuses a public host over plain http", () => {
    expect(siteUrlError("http://admin-os.example.com")).toContain(NOT_AN_ORIGIN);
  });

  it("refuses a value that is not a URL", () => {
    expect(siteUrlError("admin-os.example.com")).toContain(NOT_AN_ORIGIN);
  });

  it("refuses a trailing slash, which would double the slash in the sitemap's links", () => {
    expect(siteUrlError("https://admin-os.example.com/")).toContain(NOT_AN_ORIGIN);
  });

  it("refuses a path after the host", () => {
    expect(siteUrlError("https://admin-os.example.com/app")).toContain(NOT_AN_ORIGIN);
  });

  it("refuses surrounding whitespace, which the links would keep", () => {
    expect(siteUrlError(" https://admin-os.example.com")).toContain(NOT_AN_ORIGIN);
  });

  it("is empty for a public https URL", () => {
    expect(siteUrlError("https://admin-os.example.com")).toBe("");
  });
});
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
