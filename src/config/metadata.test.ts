import { describe, expect, it, vi } from "vitest";

const cookieValue = vi.hoisted(() => ({ locale: "en" as string }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "locale" ? { value: cookieValue.locale } : undefined) }),
  headers: async () => ({ get: () => null }),
}));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));

const { pageMetadata } = await import("./metadata.server");

const dictionary = {
  en: { meta: { title: "Title", description: "Description" } },
  es: { meta: { title: "Título", description: "Descripción" } },
  de: { meta: { title: "Titel", description: "Beschreibung" } },
  fr: { meta: { title: "Titre", description: "Description fr" } },
};

describe("pageMetadata", () => {
  it.each([
    ["en", "en_US", "Title"],
    ["es", "es_ES", "Título"],
    ["de", "de_DE", "Titel"],
    ["fr", "fr_FR", "Titre"],
  ] as const)("writes %s metadata with og:locale %s", async (locale, ogLocale, title) => {
    cookieValue.locale = locale;
    const metadata = await pageMetadata("/dashboard/x", dictionary);
    expect([metadata.title, metadata.openGraph?.locale, metadata.alternates?.canonical]).toEqual([
      title,
      ogLocale,
      "/dashboard/x",
    ]);
  });

  it("lets a page add fields such as robots", async () => {
    cookieValue.locale = "en";
    const metadata = await pageMetadata("/x", dictionary, { robots: { index: false } });
    expect(metadata.robots).toEqual({ index: false });
  });

  it("keeps og:locale, title, url and canonical when a page adds Open Graph and alternates fields", async () => {
    cookieValue.locale = "de";
    const metadata = await pageMetadata("/x", dictionary, {
      openGraph: { images: ["/cover.png"] },
      alternates: { languages: { fr: "/fr/x" } },
    });
    expect({ openGraph: metadata.openGraph, alternates: metadata.alternates }).toMatchObject({
      openGraph: { locale: "de_DE", title: "Titel", url: "/x", images: ["/cover.png"] },
      alternates: { canonical: "/x", languages: { fr: "/fr/x" } },
    });
  });

  it("lets a page override a single default field", async () => {
    cookieValue.locale = "en";
    const metadata = await pageMetadata("/x", dictionary, { openGraph: { title: "Custom" } });
    expect(metadata.openGraph).toMatchObject({ title: "Custom", locale: "en_US", url: "/x" });
  });
});
