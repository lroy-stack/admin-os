import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";

// The smoke runs in Playwright's image, whose browsers match one Playwright version only: an upgrade of
// `@playwright/test` without the image's tag would leave CI looking for browsers the image does not hold.
const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8")) as {
  packages: Partial<Record<string, { version: string }>>;
};

describe("the CI smoke container", () => {
  it("is Playwright's image at the locked @playwright/test version", () => {
    const tag = /image: mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-noble/.exec(workflow)?.[1];
    expect(tag).toBe(lock.packages["node_modules/@playwright/test"]?.version);
  });

  it("installs no browser, since the image holds them", () => {
    expect(workflow).not.toMatch(/run: .*playwright install/);
  });
});
