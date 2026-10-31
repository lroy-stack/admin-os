import type { Metadata } from "next";

import { MailApp } from "./_components/mail-app";

export const metadata: Metadata = {
  title: "Open Source Email Client with shadcn/ui",
  description:
    "Explore an open source email client with inbox navigation, message search, reading, replying, and archiving.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/mail",
  },
};

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
