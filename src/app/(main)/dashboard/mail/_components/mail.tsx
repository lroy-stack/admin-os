"use client";

import * as React from "react";

import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useSidebar } from "@/components/ui/sidebar";
import { useMessages } from "@/core/i18n/client";
import { setClientCookie } from "@/lib/cookie.client";

import { useMailbox } from "./mail-context";
import { MailInbox } from "./mail-inbox";
import {
  DEFAULT_MAIL_LAYOUT,
  MAIL_DETAIL_PANEL_ID,
  MAIL_LAYOUT_COOKIE,
  MAIL_LIST_PANEL_ID,
} from "./mail-layout-config";
import { MailView } from "./mail-view";
import { mailMessageKey } from "./messages";

interface MailProps {
  defaultLayout: number[] | undefined;
  /** Shows the button that opens the standalone mail page; set when the dashboard embeds the app. */
  standaloneHref?: string;
}

export function MailComponent({ defaultLayout = [...DEFAULT_MAIL_LAYOUT], standaloneHref }: MailProps) {
  const { isMobile } = useSidebar();
  const text = useMessages(mailMessageKey);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="text-muted-foreground flex size-full items-center justify-center text-sm">{text.loading}</div>
    );
  }

  return isMobile ? (
    <MailMobileLayout standaloneHref={standaloneHref} />
  ) : (
    <MailDesktopLayout defaultLayout={defaultLayout} standaloneHref={standaloneHref} />
  );
}

function MailMobileLayout({ standaloneHref }: Pick<MailProps, "standaloneHref">) {
  const { selected } = useMailbox();
  const text = useMessages(mailMessageKey);
  const [isMailOpen, setIsMailOpen] = React.useState(false);

  return (
    <>
      <MailInbox onSelectMail={() => setIsMailOpen(true)} standaloneHref={standaloneHref} />

      <Drawer open={isMailOpen} onOpenChange={setIsMailOpen}>
        <DrawerContent>
          <DrawerTitle className="sr-only">{text.view.drawerTitle}</DrawerTitle>
          <DrawerDescription className="sr-only">{text.view.drawerDescription}</DrawerDescription>
          <MailView mail={selected} onClose={() => setIsMailOpen(false)} />
        </DrawerContent>
      </Drawer>
    </>
  );
}

function MailDesktopLayout({ defaultLayout = [...DEFAULT_MAIL_LAYOUT], standaloneHref }: MailProps) {
  const { selected } = useMailbox();

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      onLayoutChanged={(layout) => {
        const sizes = [layout[MAIL_LIST_PANEL_ID], layout[MAIL_DETAIL_PANEL_ID]];
        setClientCookie(MAIL_LAYOUT_COOKIE, JSON.stringify(sizes));
      }}
      className="h-full"
    >
      <ResizablePanel id={MAIL_LIST_PANEL_ID} defaultSize={`${defaultLayout[0]}%`} minSize="30%" className="min-h-0">
        <MailInbox standaloneHref={standaloneHref} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel id={MAIL_DETAIL_PANEL_ID} defaultSize={`${defaultLayout[1]}%`} minSize="30%" className="min-h-0">
        <MailView mail={selected} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
