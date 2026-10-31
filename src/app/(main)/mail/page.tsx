import type { Metadata } from "next";

import { MailApp } from "@/app/(main)/dashboard/mail/_components/mail-app";

export const metadata: Metadata = {
  title: "Open Source Email Client with shadcn/ui",
  description:
    "Explore an open source email client with inbox navigation, message search, reading, replying, and archiving.",
  alternates: {
    canonical: "/mail",
  },
};

export default function Page() {
  return (
    <div className="relative h-dvh min-h-0 overflow-hidden">
      <MailApp />
    </div>
  );
}
