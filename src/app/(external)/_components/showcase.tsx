import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getMessages } from "@/config/locale.server";

import defaultDarkImage from "../../../../media/default/default-dark.webp";
import defaultLightImage from "../../../../media/default/default-light.webp";
import { landingMessages } from "./messages.server";

export async function Showcase() {
  const text = await getMessages(landingMessages);

  // The capture is the demo's Home, so it opens the demo like the hero's primary button; the visible image's alt
  // names the link.
  return (
    <section aria-label={text.showcase.label}>
      <Link
        className="focus-visible:ring-ring/50 block rounded-lg outline-none focus-visible:ring-3"
        href="/dashboard"
        prefetch={false}
      >
        <Card className="rounded-lg py-0" data-landing-dashboard-preview>
          {/* biome-ignore lint/performance/noImgElement: These landing images are optimized separately. */}
          <img
            alt={text.showcase.alt}
            className="h-auto w-full rounded-lg! dark:hidden"
            height={defaultLightImage.height}
            src={defaultLightImage.src}
            width={defaultLightImage.width}
          />
          {/* biome-ignore lint/performance/noImgElement: These landing images are optimized separately. */}
          <img
            alt={text.showcase.alt}
            className="hidden h-auto w-full rounded-lg! dark:block"
            height={defaultDarkImage.height}
            src={defaultDarkImage.src}
            width={defaultDarkImage.width}
          />
        </Card>
      </Link>
    </section>
  );
}
