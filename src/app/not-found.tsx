import Link from "next/link";

import { LocaleRoot } from "@/app/_components/locale-root";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/config/locale.server";

import { notFoundMessages } from "./not-found-messages.server";

export async function generateMetadata() {
  return (await getMessages(notFoundMessages)).meta;
}

export default async function NotFound() {
  const text = await getMessages(notFoundMessages);

  return (
    <LocaleRoot>
      <div className="flex h-dvh flex-col items-center justify-center space-y-2 text-center">
        <h1 className="text-2xl font-semibold">{text.title}</h1>
        <p className="text-muted-foreground">{text.description}</p>
        <Link prefetch={false} replace href="/dashboard/default">
          <Button variant="outline">{text.home}</Button>
        </Link>
      </div>
    </LocaleRoot>
  );
}
