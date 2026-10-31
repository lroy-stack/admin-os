import type { ReactNode } from "react";

import { Command } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";
import { getMessages } from "@/config/locale.server";

import { authMessages } from "../_components/messages.server";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const text = await getMessages(authMessages);

  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="bg-primary relative order-2 hidden h-full rounded-3xl lg:flex">
          <div className="text-primary-foreground absolute top-10 space-y-1 px-10">
            <Command className="size-10" />
            <h1 className="text-2xl font-medium">{APP_CONFIG.name}</h1>
            <p className="text-sm">{text.brand.tagline}</p>
          </div>

          <div className="absolute bottom-10 flex w-full justify-between gap-3 px-10">
            <div className="text-primary-foreground min-w-0 flex-1 space-y-1">
              <h2 className="font-medium break-words hyphens-auto">{text.brand.launchTitle}</h2>
              <p className="text-sm break-words hyphens-auto">{text.brand.launchText}</p>
            </div>
            <Separator orientation="vertical" className="mx-3 h-auto!" />
            <div className="text-primary-foreground min-w-0 flex-1 space-y-1">
              <h2 className="font-medium break-words hyphens-auto">{text.brand.helpTitle}</h2>
              <p className="text-sm break-words hyphens-auto">{text.brand.helpText}</p>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
