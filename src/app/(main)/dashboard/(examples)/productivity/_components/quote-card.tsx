import { Quote } from "lucide-react";

import { getMessages } from "@/config/locale.server";

import { productivityMessages } from "./messages.server";

export async function QuoteCard() {
  const text = (await getMessages(productivityMessages)).quote;

  return (
    <section className="bg-card rounded-2xl border p-6 shadow-xs">
      <div className="flex items-start gap-4">
        <div className="text-muted-foreground grid size-8 shrink-0 place-items-center">
          <Quote className="size-6" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xl leading-snug tracking-tight break-words hyphens-auto">{text.title}</p>
          <p className="text-muted-foreground">{text.subtitle}</p>
        </div>
      </div>
    </section>
  );
}
