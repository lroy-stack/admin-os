import { LocaleBundles } from "@/app/_components/locale-root";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getLocale } from "@/config/locale.server";
import { readCookie } from "@/ds/preferences/server";

import { createMails } from "./data";
import { MailComponent } from "./mail";
import { MAIL_LAYOUT_COOKIE, parseMailLayout } from "./mail-layout-config";
import { MailSidebar } from "./mail-sidebar";
import { mailBundle, mailMessages } from "./messages.server";

/**
 * The mail app, filling its parent. The dashboard embeds it with `standaloneHref`, which adds the button that opens
 * the standalone page; `/mail` renders it on its own. The demo mails are written for the request's locale here, once,
 * so both routes show the same content and no other locale reaches the browser.
 */
export async function MailApp({ standaloneHref }: { standaloneHref?: string }) {
  const [layout, locale] = await Promise.all([readCookie(MAIL_LAYOUT_COOKIE).then(parseMailLayout), getLocale()]);
  const mails = createMails(Date.now(), mailMessages[locale], locale);

  return (
    <LocaleBundles bundles={[mailBundle]}>
      <SidebarProvider className="h-full min-h-0">
        <MailSidebar />
        <div className="size-full min-h-0 overflow-hidden">
          <MailComponent mails={mails} defaultLayout={layout} standaloneHref={standaloneHref} />
        </div>
      </SidebarProvider>
    </LocaleBundles>
  );
}
