import { describe, expect, it } from "vitest";

import { missingSecrets } from "./require-deploy-secret.mjs";

describe("missingSecrets", () => {
  it("names the required secret the Worker lacks", () => {
    const listed = JSON.stringify([{ name: "MCP_TOKENS", type: "secret_text" }]);
    expect(missingSecrets(listed)).toEqual(["DEMO_SESSION_SECRET"]);
  });

  it("is empty when the Worker has every required secret", () => {
    const listed = JSON.stringify([
      { name: "MCP_TOKENS", type: "secret_text" },
      { name: "DEMO_SESSION_SECRET", type: "secret_text" },
    ]);
    expect(missingSecrets(listed)).toEqual([]);
  });

  it("names every missing secret of a longer list", () => {
    expect(missingSecrets("[]", ["A", "B"])).toEqual(["A", "B"]);
  });
});
