import Link from "next/link";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Opens an app the dashboard embeds (mail, chat) as its own full-window page in a new tab. */
export function OpenStandaloneButton({ href }: { href: string }) {
  return (
    <Button asChild variant="ghost" size="icon-sm">
      <Link href={href} prefetch={false} target="_blank" rel="noreferrer" aria-label="Open as a standalone page">
        <ExternalLink />
      </Link>
    </Button>
  );
}
