"use client";

import Link from "next/link";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/core/i18n/client";

import { dashboardMessageKey } from "./messages";

/** Opens an app the dashboard embeds (mail, chat) as its own full-window page in a new tab. */
export function OpenStandaloneButton({ href }: { href: string }) {
  const text = useMessages(dashboardMessageKey);
  return (
    <Button asChild variant="ghost" size="icon-sm">
      <Link href={href} prefetch={false} target="_blank" rel="noreferrer" aria-label={text.openStandalone}>
        <ExternalLink />
      </Link>
    </Button>
  );
}
