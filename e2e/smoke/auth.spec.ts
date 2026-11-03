import { expect, test } from "@playwright/test";

/**
 * Auth template smoke (spec 003 AC11): the demo sign-in and registration forms are not connected to a provider, so a
 * submit tells the visitor so and never echoes what they typed, the password above all (002 Q16).
 */

const PASSWORD = "correct-horse-battery";

// Parametrised tests: the loops generate one test per page; no test body branches.
for (const path of ["/auth/v1/login", "/auth/v2/login"]) {
  test(`${path} submits without echoing the password`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    await page.goto(path);

    await page.getByLabel("Email address").fill("guest@example.com");
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Log in", exact: true }).click();

    const notice = page.locator("[data-sonner-toast]").first();
    await expect(notice).toBeVisible();
    // Read while the toast is on screen: sonner removes it after a few seconds.
    expect(await notice.textContent()).not.toContain(PASSWORD);
    await expect(notice).toContainText("Sign-in is not connected in the demo.");
  });
}

for (const path of ["/auth/v1/register", "/auth/v2/register"]) {
  test(`${path} submits without echoing the password`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);
    await page.goto(path);

    await page.getByLabel("Email address").fill("guest@example.com");
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Confirm password").fill(PASSWORD);
    await page.getByRole("button", { name: "Register", exact: true }).click();

    const notice = page.locator("[data-sonner-toast]").first();
    await expect(notice).toBeVisible();
    // Read while the toast is on screen: sonner removes it after a few seconds.
    expect(await notice.textContent()).not.toContain(PASSWORD);
    await expect(notice).toContainText("Registration is not connected in the demo.");
  });
}
