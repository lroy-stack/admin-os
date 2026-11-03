"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMessages } from "@/core/i18n/client";
import { useGuardedLink } from "@/ds/feedback";

import { isActiveLink } from "./active-link";
import { LayoutControls } from "./layout-controls";
import { shellMessageKey } from "./messages";
import { railButtonClassName } from "./rail-button";
import { SearchDialog } from "./search-dialog";
import { ThemeSwitcher } from "./theme-switcher";
import type { ShellNavItem, ShellSearchGroup } from "./types";

/** Floating icon rail: vertical on the left from md, a bottom dock on phones. It floats over any content (the
 * white room included), so it uses the dense persistent-chrome glass, like the top navbar. */
export function AppRail({
  items,
  searchGroups,
}: {
  items: readonly ShellNavItem[];
  searchGroups: readonly ShellSearchGroup[];
}) {
  const pathname = usePathname();
  const guardLink = useGuardedLink();
  const { landmarks } = useMessages(shellMessageKey);

  return (
    <aside
      aria-label={landmarks.quickAccess}
      className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center md:pointer-events-auto md:sticky md:top-24 md:bottom-auto md:block md:self-start"
    >
      <div className="liquid-glass liquid-glass-solid pointer-events-auto flex max-w-full [scrollbar-width:none] items-center gap-0.5 overflow-x-auto rounded-full p-1 md:flex-col md:gap-1 md:overflow-visible md:p-1.5">
        <SearchDialog groups={searchGroups} />
        {items.map((item) => {
          const active = isActiveLink(pathname, item.url);
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" className={railButtonClassName}>
                  <Link
                    prefetch={false}
                    href={item.url}
                    onNavigate={guardLink(item.url)}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.icon && <item.icon />}
                    <span className="sr-only">{item.title}</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.title}</TooltipContent>
            </Tooltip>
          );
        })}
        <span aria-hidden="true" className="bg-border mx-1 h-5 w-px md:mx-0 md:my-1 md:h-px md:w-5" />
        <LayoutControls />
        <ThemeSwitcher />
      </div>
    </aside>
  );
}
