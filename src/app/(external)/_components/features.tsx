import { getMessages } from "@/config/locale.server";

import { landingMessages } from "./messages.server";

export async function Features() {
  const text = await getMessages(landingMessages);
  const { bookings, glass, presets, languages, roles, data, mcp } = text.features.items;

  return (
    <section aria-labelledby="features-title" className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-xs font-medium">{text.features.eyebrow}</p>
        <h2 className="text-xl leading-7 tracking-tight text-pretty" id="features-title">
          {text.features.title}
        </h2>
      </div>

      <ul className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
        {[bookings, glass, presets, languages, roles, data, mcp].map((feature) => (
          <li className="flex flex-col gap-1.5" key={feature.title}>
            <h3 className="text-sm font-medium">{feature.title}</h3>
            <p className="text-muted-foreground text-sm leading-6">{feature.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
