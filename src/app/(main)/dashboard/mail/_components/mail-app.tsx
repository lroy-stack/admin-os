import { SidebarProvider } from "@/components/ui/sidebar";
import { readCookie } from "@/ds/preferences/server";

import { mails } from "./data";
import { MailComponent } from "./mail";
import { MAIL_LAYOUT_COOKIE, parseMailLayout } from "./mail-layout-config";
import { MailSidebar } from "./mail-sidebar";

/**
 * The mail app, filling its parent. The dashboard embeds it with `standaloneHref`, which adds the button that opens
 * the standalone page; `/mail` renders it on its own.
 */
export async function MailApp({ standaloneHref }: { standaloneHref?: string }) {
  const layout = parseMailLayout(await readCookie(MAIL_LAYOUT_COOKIE));

  return (
    <SidebarProvider className="h-full min-h-0">
      <MailSidebar />
      <div className="size-full min-h-0 overflow-hidden">
        <MailComponent mails={mails} defaultLayout={layout} standaloneHref={standaloneHref} />
      </div>
    </SidebarProvider>
  );
}
