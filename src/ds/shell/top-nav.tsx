"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";
import { Bell, Inbox } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { LiquidThumb, useLiquidThumb } from "@/ds/components";
import { useGuardedLink } from "@/ds/feedback";
import { PopoverOrSheet } from "@/ds/overlays";

import { AccountMenu } from "./account-menu";
import { isActiveLink } from "./active-link";
import { shellMessageKey } from "./messages";
import type { ShellAccount, ShellBrand, ShellDemo, ShellNavItem, ShellNotifications } from "./types";

// Demo count until the feed engine supplies the real one.

const headerButtonClassName = "liquid-glass liquid-glass-solid size-9 rounded-full hover:bg-foreground/10";

function NavPills({
  items,
  pathname,
  className,
}: {
  items: readonly ShellNavItem[];
  pathname: string;
  className?: string;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const guardLink = useGuardedLink();
  // Move the lens on click instead of waiting for the route to commit; any pathname change clears it.
  const [pending, setPending] = useState<{ url: string; from: string } | null>(null);
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setPending(null);
  }

  const currentIndex = items.findIndex((item) => isActiveLink(pathname, item.url));
  const activeUrl = pending?.from === pathname ? pending.url : items[currentIndex]?.url;
  const thumb = useLiquidThumb(listRef, activeUrl);

  // In the scrollable phone/tablet row, keep the current section in view. Only the row scrolls: `scrollIntoView` would
  // also scroll every ancestor, and on a phone it shifted the whole page sideways for a section far to the right.
  useEffect(() => {
    const current = listRef.current?.querySelector<HTMLElement>(`[data-thumb-key="${CSS.escape(activeUrl ?? "")}"]`);
    const row = listRef.current?.closest("nav");
    if (!current || !row) return;
    const item = current.getBoundingClientRect();
    const box = row.getBoundingClientRect();
    row.scrollBy({ left: item.left + item.width / 2 - (box.left + box.width / 2) });
  }, [activeUrl]);

  return (
    <ul
      ref={listRef}
      className={cn("liquid-glass liquid-glass-solid flex items-center gap-0.5 rounded-full p-1", className)}
    >
      <li aria-hidden="true" className="contents">
        <LiquidThumb {...thumb} />
      </li>
      {items.map((item, index) => {
        const active = item.url === activeUrl;
        return (
          <li key={item.id} className="shrink-0">
            <Link
              prefetch={false}
              href={item.url}
              data-thumb-key={item.url}
              transitionTypes={[index > currentIndex ? "nav-forward" : "nav-back"]}
              aria-current={isActiveLink(pathname, item.url) ? "page" : undefined}
              onNavigate={(event) => {
                // A held navigation (unsaved changes) must not leave the lens on the page that was refused.
                guardLink(item.url, { transitionTypes: [index > currentIndex ? "nav-forward" : "nav-back"] })({
                  preventDefault: () => {
                    event.preventDefault();
                    setPending(null);
                  },
                });
              }}
              onClick={(event) => {
                // Modified or non-primary clicks open elsewhere; the current page stays active.
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                setPending({ url: item.url, from: pathname });
              }}
              className={cn(
                "text-foreground/75 hover:text-foreground focus-visible:ring-ring relative block rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-300 outline-none focus-visible:ring-2",
                active && "text-foreground",
                active && !thumb.rect && "bg-foreground/15",
              )}
            >
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** True once the page has scrolled past `offset`, so sticky chrome can add a scrim behind itself. */
function useScrolledPast(offset: number) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > offset);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [offset]);

  return scrolled;
}

export function TopNav({
  brand,
  items,
  account,
  demo,
  inboxHref,
  accountHref,
  settingsHref,
  logoutHref,
  notifications,
}: {
  brand: ShellBrand;
  items: readonly ShellNavItem[];
  account: ShellAccount;
  /** The demo switches; omitted outside the demo build. */
  demo?: ShellDemo;
  /** Where the inbox button goes; the app owns its routes. */
  inboxHref: string;
  /** Where the account menu's Account item goes: the signed-in person's own page. */
  accountHref: string;
  /** Where the account menu's business settings go. */
  settingsHref: string;
  /** Where the account menu's Log out goes. */
  logoutHref: string;
  /** The bell and its panel; omitted when the actor cannot read notifications. */
  notifications?: ShellNotifications;
}) {
  const pathname = usePathname();
  const { landmarks, header } = useMessages(shellMessageKey);
  const locale = useLocale();
  const scrolled = useScrolledPast(8);
  const guardLink = useGuardedLink();
  // Held here so the account menu's Notifications item opens the same inbox as the bell.
  const [bellOpen, setBellOpen] = useState(false);

  return (
    <header
      data-scrolled={scrolled}
      className={cn(
        "relative z-40 px-4 pt-4 pb-3 md:px-6 [html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0",
        // Frosted band that fades in under the sticky header once content scrolls beneath it.
        "before:bg-background/85 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-bottom-8 before:-z-10 before:mask-b-from-65% before:opacity-0 before:backdrop-blur-xl before:transition-opacity before:duration-300 data-[scrolled=true]:before:opacity-100",
      )}
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 xl:grid-cols-[1fr_auto_1fr]">
        <Link
          prefetch={false}
          href={brand.href}
          onNavigate={guardLink(brand.href)}
          className="flex w-fit items-center gap-2.5 rounded-xl"
        >
          <span className="liquid-glass-brand bg-brand text-brand-foreground grid size-9 place-items-center rounded-xl">
            <AppLogo className="size-5" />
          </span>
          <span className="text-lg font-medium tracking-tight">{brand.name}</span>
        </Link>

        <nav aria-label={landmarks.sections} className="hidden xl:block">
          <NavPills items={items} pathname={pathname} />
        </nav>

        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" size="icon" className={headerButtonClassName}>
            <Link prefetch={false} href={inboxHref} onNavigate={guardLink(inboxHref)} aria-label={header.inbox}>
              <Inbox />
            </Link>
          </Button>
          {notifications ? (
            <PopoverOrSheet
              open={bellOpen}
              onOpenChange={setBellOpen}
              align="end"
              title={notifications.title}
              className="w-96 p-0"
              trigger={
                <Button variant="ghost" size="icon" className={headerButtonClassName}>
                  <Bell />
                  {notifications.unread > 0 ? (
                    <span className="bg-destructive absolute top-2 right-2.5 size-1.5 rounded-full" />
                  ) : null}
                  <span className="sr-only">{format(header.unread, locale, { count: notifications.unread })}</span>
                </Button>
              }
            >
              {notifications.panel}
            </PopoverOrSheet>
          ) : null}
          <AccountMenu
            account={account}
            demo={demo}
            accountHref={accountHref}
            settingsHref={settingsHref}
            logoutHref={logoutHref}
            onOpenNotifications={notifications ? () => setBellOpen(true) : undefined}
          />
        </div>
      </div>

      <nav
        aria-label={landmarks.sections}
        className="-mx-4 mt-3 [scrollbar-width:none] overflow-x-auto px-4 py-1 xl:hidden"
      >
        <NavPills items={items} pathname={pathname} className="w-max" />
      </nav>
    </header>
  );
}
