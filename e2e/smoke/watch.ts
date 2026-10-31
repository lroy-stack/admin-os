import type { Page } from "@playwright/test";

/** Collects what must stay empty: console errors, uncaught page errors and failed requests (aborted prefetches aside). */
export const watch = (page: Page) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText !== "net::ERR_ABORTED") {
      problems.push(`requestfailed: ${request.url()} ${request.failure()?.errorText}`);
    }
  });
  return problems;
};
