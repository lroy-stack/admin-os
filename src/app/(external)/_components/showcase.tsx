import { Card } from "@/components/ui/card";
import { getMessages } from "@/config/locale.server";

import defaultDarkImage from "../../../../media/default/default-dark.webp";
import defaultLightImage from "../../../../media/default/default-light.webp";
import { landingMessages } from "./messages.server";

export async function Showcase() {
  const text = await getMessages(landingMessages);

  return (
    <section aria-label={text.showcase.label}>
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
    </section>
  );
}
