import { pageMetadata } from "@/config/metadata.server";

import { MailApp } from "./_components/mail-app";
import { mailMessages } from "./_components/messages.server";

// The embedded page is a copy of /mail: it names the standalone page as canonical and stays out of the index.
export const generateMetadata = () => pageMetadata("/mail", mailMessages, { robots: { index: false, follow: true } });

export default function Page() {
  return (
    // Full-height app page: the dashboard drops its content padding and the mail panes fill the rest of the screen.
    <div
      data-content-padding="false"
      className="bg-background relative h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 overflow-hidden rounded-lg border"
    >
      <MailApp standaloneHref="/mail" />
    </div>
  );
}
