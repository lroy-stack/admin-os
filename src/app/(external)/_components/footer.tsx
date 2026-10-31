import { siGithub } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";
import { getMessages } from "@/config/locale.server";

import { landingMessages } from "./messages.server";

const AUTHOR = { handle: "@lroy-stack", profile: "https://github.com/lroy-stack" };

export async function Footer() {
  const text = await getMessages(landingMessages);
  // The template places the author link where `{author}` sits, so each language keeps its own word order.
  const [beforeAuthor, afterAuthor] = text.footer.madeBy.split("{author}");

  return (
    <footer>
      <div className="text-muted-foreground flex flex-row items-center justify-between gap-6 text-sm">
        <p>
          {beforeAuthor}
          <a
            className="text-foreground decoration-border hover:decoration-foreground underline underline-offset-4 transition-colors"
            href={AUTHOR.profile}
            target="_blank"
            rel="noreferrer"
          >
            {AUTHOR.handle}
          </a>
          {afterAuthor}
        </p>
        <div className="flex items-center gap-3">
          <Button asChild size="icon-sm" variant="link">
            <a href={APP_CONFIG.repository} target="_blank" rel="noreferrer" aria-label={text.footer.github}>
              <SimpleIcon icon={siGithub} aria-hidden className="size-4.5 fill-current" />
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}
