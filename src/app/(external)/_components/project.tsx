import { APP_CONFIG } from "@/config/app-config";
import { getLocale, getMessages } from "@/config/locale.server";
import { format, formatList } from "@/core/i18n/client";

import { landingMessages } from "./messages.server";

// Product names, never translated; the list itself is joined in the reader's language.
const STACK = ["Next.js", "React", "TypeScript", "Tailwind CSS", "shadcn/ui"];

export async function Project() {
  const [text, locale] = await Promise.all([getMessages(landingMessages), getLocale()]);
  const { repository } = APP_CONFIG;
  const links = [
    { label: text.links.source, href: repository },
    { label: text.links.start, href: `${repository}#getting-started` },
    { label: text.links.mcp, href: `${repository}#mcp` },
    { label: text.links.architecture, href: `${repository}/tree/main/docs/adr` },
    { label: text.links.license, href: `${repository}/blob/main/LICENSE` },
  ];

  return (
    <section aria-labelledby="run-title">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] md:gap-16">
        <div className="flex flex-col gap-4">
          <h2 className="text-muted-foreground text-xs font-medium" id="run-title">
            {text.run.title}
          </h2>
          <p className="text-muted-foreground text-sm leading-6">{text.run.body}</p>
          <p className="text-muted-foreground text-sm leading-6">
            {format(text.run.stack, locale, { stack: formatList(STACK, locale) })}
          </p>
        </div>

        <nav aria-labelledby="links-title" className="flex flex-col gap-4">
          <h2 className="text-muted-foreground text-xs font-medium" id="links-title">
            {text.links.title}
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  className="decoration-border hover:decoration-foreground underline underline-offset-4 transition-colors"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
