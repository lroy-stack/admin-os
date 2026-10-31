import { type Browser, expect, type Page, test } from "@playwright/test";

import { type Frame, writeAnimation, writeStill } from "./encode";

/**
 * The README and landing media, rebuilt from the running app by `npm run media`. Everything is shown in English,
 * with the reference theme (Lime) and the demo data of the hospitality preset.
 */

const DEVICES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  recording: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  tablet: { viewport: { width: 834, height: 1194 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
} as const;

type Device = keyof typeof DEVICES;
type Mode = "dark" | "light";

/**
 * `motion: "reduce"` switches the page transitions off (motion.css honours prefers-reduced-motion): a tour across
 * pages then shows each page at once and stays a few megabytes, while the room and theme recordings keep their motion.
 */
async function openPage(
  browser: Browser,
  baseURL: string,
  device: Device,
  mode: Mode,
  motion: "reduce" | "no-preference" = "no-preference",
): Promise<Page> {
  const context = await browser.newContext({
    ...DEVICES[device],
    colorScheme: mode,
    reducedMotion: motion,
    locale: "en-US",
    baseURL,
  });
  await context.addCookies(
    Object.entries({ locale: "en", theme_mode: mode, theme_preset: "lime" }).map(([name, value]) => ({
      name,
      value,
      url: baseURL,
    })),
  );
  return context.newPage();
}

/** A pause for whoever watches the recording, not a wait for the app: every state change is awaited before it. */
const beat = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function ready(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole("main")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

/** The floor plan draws on a canvas after the route renders, so a room screen waits for its tables. */
async function roomReady(page: Page) {
  await expect(page.getByRole("button", { name: /^S1,/ })).toBeVisible();
  await beat(1500);
}

async function still(page: Page, name: string, width: number) {
  await page.mouse.move(0, 0);
  await beat(400);
  await writeStill(`media/${name}.webp`, await page.screenshot({ animations: "disabled", caret: "hide" }), width);
}

/** A mouse pointer on desktop; on a phone, a fingertip dot where each tap lands. */
const POINTERS = {
  mouse: { cursor: "pointer", style: { title: "display: none" } },
  touch: {
    cursor: "none",
    style: {
      title: "display: none",
      point:
        "width: 40px; height: 40px; border-radius: 50%; background: rgb(255 255 255 / 0.35); border: 2px solid rgb(255 255 255 / 0.85)",
    },
  },
} as const;

async function record(
  page: Page,
  name: string,
  width: number,
  pointer: keyof typeof POINTERS,
  act: () => Promise<void>,
) {
  const frames: Frame[] = [];
  const viewport = page.viewportSize() ?? DEVICES.recording.viewport;
  const scale = await page.evaluate(() => window.devicePixelRatio);
  await page.screencast.start({
    size: { width: viewport.width * scale, height: viewport.height * scale },
    quality: 92,
    fps: 10,
    onFrame: ({ data, timestamp }) => {
      frames.push({ data, timestamp });
    },
  });
  // The title overlay stays hidden: by default it prints the Playwright call into the recording.
  await page.screencast.showActions({ ...POINTERS[pointer], duration: 600 });
  await act();
  await beat(300);
  await page.screencast.stop();
  await writeAnimation(`media/flows/${name}.webp`, frames, width, 1800);
}

test.describe("desktop screens", () => {
  test("full screens in dark and light", async ({ browser, baseURL }) => {
    const screens = [
      { name: "bookings", path: "/dashboard/bookings", room: true },
      { name: "home", path: "/dashboard/default", room: false },
      { name: "calendar", path: "/dashboard/calendar", room: false },
      { name: "mail", path: "/dashboard/mail", room: false },
      { name: "chat", path: "/dashboard/chat", room: false },
      { name: "pipeline", path: "/dashboard/crm", room: false },
    ] as const;
    for (const mode of ["dark", "light"] as const) {
      const page = await openPage(browser, baseURL ?? "", "desktop", mode);
      for (const screen of screens) {
        await ready(page, screen.path);
        if (screen.room) await roomReady(page);
        await still(page, `desktop/${screen.name}-${mode}`, 2880);
      }
      await page.context().close();
    }
  });

  test("the 3D room", async ({ browser, baseURL }) => {
    const page = await openPage(browser, baseURL ?? "", "desktop", "dark");
    await ready(page, "/dashboard/bookings");
    await roomReady(page);
    await page.getByRole("radio", { name: "3D" }).click();
    await beat(1500);
    await still(page, "desktop/bookings-3d-dark", 2880);
    await page.context().close();
  });

  test("landing showcase with the preferences open", async ({ browser, baseURL }) => {
    for (const mode of ["dark", "light"] as const) {
      const page = await openPage(browser, baseURL ?? "", "desktop", mode);
      await ready(page, "/dashboard/default");
      await page.getByRole("button", { name: "Preferences" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await beat(500);
      await writeStill(
        `media/default/default-${mode}.webp`,
        await page.screenshot({ animations: "disabled", caret: "hide" }),
        2400,
      );
      await page.context().close();
    }
  });
});

test.describe("tablet and phone screens", () => {
  test("tablet", async ({ browser, baseURL }) => {
    for (const mode of ["dark", "light"] as const) {
      const page = await openPage(browser, baseURL ?? "", "tablet", mode);
      await ready(page, "/dashboard/bookings");
      await roomReady(page);
      await still(page, `devices/tablet-bookings-${mode}`, 1668);
      await ready(page, "/dashboard/default");
      await still(page, `devices/tablet-home-${mode}`, 1668);
      await page.context().close();
    }
  });

  test("phone", async ({ browser, baseURL }) => {
    for (const mode of ["dark", "light"] as const) {
      const page = await openPage(browser, baseURL ?? "", "phone", mode);
      await ready(page, "/dashboard/bookings");
      await roomReady(page);
      await still(page, `devices/phone-bookings-${mode}`, 780);
      await ready(page, "/dashboard/calendar");
      await still(page, `devices/phone-calendar-${mode}`, 780);
      await page.context().close();
    }
  });
});

test.describe("recordings", () => {
  test("tour of the areas", async ({ browser, baseURL }) => {
    const page = await openPage(browser, baseURL ?? "", "recording", "dark", "reduce");
    await ready(page, "/dashboard/default");
    await record(page, "tour", 1024, "mouse", async () => {
      await beat(1200);
      await page.getByRole("link", { name: "Reservations", exact: true }).first().click();
      await roomReady(page);
      await page.getByRole("link", { name: "Pipeline", exact: true }).first().click();
      await beat(1500);
      await page.getByRole("link", { name: "Schedule", exact: true }).first().click();
      await beat(1500);
      await page.getByRole("link", { name: "Email", exact: true }).first().click();
      await beat(1500);
      await page.getByRole("link", { name: "Chat", exact: true }).first().click();
      await beat(1500);
    });
    await page.context().close();
  });

  test("the bookings room", async ({ browser, baseURL }) => {
    const page = await openPage(browser, baseURL ?? "", "recording", "dark");
    await ready(page, "/dashboard/bookings");
    await roomReady(page);
    await record(page, "room", 1024, "mouse", async () => {
      await beat(800);
      await page.getByRole("radio", { name: "3D" }).click();
      await beat(1800);
      await page.getByRole("radio", { name: "2D" }).click();
      await beat(1500);
      await page.getByRole("radio", { name: "2.5D" }).click();
      await beat(1200);
      await page.getByRole("button", { name: /^S3,/ }).click();
      await beat(1800);
      await page.keyboard.press("Escape");
      await page.getByRole("radio", { name: "Agenda" }).click();
      await beat(1600);
      await page.getByRole("radio", { name: "List" }).click();
      await beat(1600);
      await page.getByRole("radio", { name: "Floor" }).click();
      await roomReady(page);
    });
    await page.context().close();
  });

  test("themes, modes and languages", async ({ browser, baseURL }) => {
    const page = await openPage(browser, baseURL ?? "", "recording", "dark");
    await ready(page, "/dashboard/default");
    await record(page, "preferences", 1024, "mouse", async () => {
      await beat(800);
      await page.getByRole("button", { name: "Preferences" }).click();
      const panel = page.getByRole("dialog");
      await expect(panel).toBeVisible();
      for (const preset of ["Ember", "Rose", "Tide", "Cobalt", "Lime"]) {
        await panel.getByRole("combobox").first().click();
        await page.getByRole("option", { name: preset }).click();
        await beat(900);
      }
      await panel.getByRole("radio", { name: "Light" }).click();
      await beat(1400);
      await panel.getByRole("radio", { name: "Dark" }).click();
      await beat(1000);
      for (const [language, code] of [
        ["Español", "es"],
        ["Deutsch", "de"],
        ["Français", "fr"],
        ["English", "en"],
      ] as const) {
        await panel.getByRole("combobox").nth(2).click();
        await page.getByRole("option", { name: language }).click();
        await expect(page.locator("html")).toHaveAttribute("lang", code);
        await beat(1300);
      }
    });
    await page.context().close();
  });

  test("phone", async ({ browser, baseURL }) => {
    const page = await openPage(browser, baseURL ?? "", "phone", "dark", "reduce");
    await ready(page, "/dashboard/default");
    await record(page, "phone", 500, "touch", async () => {
      await beat(1000);
      await page.mouse.wheel(0, 700);
      await beat(1200);
      await page.getByRole("link", { name: "Reservations", exact: true }).first().click();
      await roomReady(page);
      await page.getByRole("button", { name: /^S3,/ }).click();
      await beat(1800);
      await page.keyboard.press("Escape");
      await page.getByRole("radio", { name: "Agenda" }).click();
      await beat(1600);
    });
    await page.context().close();
  });
});
