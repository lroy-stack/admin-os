import Link from "next/link";

import { ArrowRight } from "lucide-react";
import { siGithub } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";
import { getMessages } from "@/config/locale.server";

import { landingMessages } from "./messages.server";

export async function Intro() {
  const text = await getMessages(landingMessages);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl leading-snug font-medium tracking-tight text-balance sm:text-3xl" id="hero-title">
          {text.hero.title}
        </h1>
        <p className="text-muted-foreground text-sm leading-6 text-pretty sm:text-base">{text.hero.lead}</p>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button asChild>
          <Link href="/dashboard" prefetch={false}>
            {text.hero.demo}
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <a href={APP_CONFIG.repository} target="_blank" rel="noreferrer">
            <SimpleIcon icon={siGithub} aria-hidden data-icon="inline-start" className="fill-current" />
            {text.hero.github}
          </a>
        </Button>
      </div>

      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <span aria-hidden="true" className="bg-brand size-1.5 shrink-0 rounded-full" />
        {text.hero.status}
      </p>
    </div>
  );
}
