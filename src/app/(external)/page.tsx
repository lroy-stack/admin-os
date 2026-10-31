import Link from "next/link";

import { AppLogo } from "@/components/app-logo";
import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";
import { appMessages } from "@/config/app-messages.server";
import { getMessages } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { AppBackdrop } from "@/ds/shell";

import { Features } from "./_components/features";
import { Footer } from "./_components/footer";
import { Intro } from "./_components/intro";
import { LandingThemeSwitcher } from "./_components/landing-theme-switcher";
import { landingMessages } from "./_components/messages.server";
import { Project } from "./_components/project";
import { Showcase } from "./_components/showcase";

export const generateMetadata = () => pageMetadata("/", appMessages);

export default async function Home() {
  const text = await getMessages(landingMessages);
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_CONFIG.name,
    url: new URL("/", APP_CONFIG.url).href,
  };

  // `data-landing-page` pins the Lime theme (presets/lime.css), so the page ignores the visitor's saved preset.
  return (
    <main className="bg-background text-foreground relative isolate min-h-screen" data-landing-page>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD uses app configuration with HTML-sensitive characters escaped.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <AppBackdrop />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:gap-8 sm:p-6 md:p-8">
        <header className="flex items-start justify-between gap-4 sm:items-center sm:gap-6">
          <Link
            className="inline-flex items-center gap-2 text-base font-medium tracking-tight"
            href="/"
            aria-label={text.home}
            prefetch={false}
          >
            <AppLogo className="size-4 shrink-0" viewBox="72 96 356 308" />
            <span>{APP_CONFIG.name}</span>
          </Link>
          <LandingThemeSwitcher />
        </header>
        <Intro />
        <Showcase />
        <Separator />
        <Features />
        <Separator />
        <Project />
        <Separator />
        <Footer />
      </div>
    </main>
  );
}
