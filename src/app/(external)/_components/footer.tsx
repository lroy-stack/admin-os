import { siGithub } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer>
      <div className="text-muted-foreground flex flex-row items-center justify-between gap-6 text-sm">
        <p>
          Brought to you by{" "}
          <a
            className="text-foreground decoration-border hover:decoration-foreground underline underline-offset-4 transition-colors"
            href="https://github.com/lroy-stack"
            target="_blank"
            rel="noreferrer"
          >
            @lroy-stack
          </a>
        </p>
        <div className="flex items-center gap-3">
          <Button asChild size="icon-sm" variant="link">
            <a
              href="https://github.com/lroy-stack/admin-os"
              target="_blank"
              rel="noreferrer"
              aria-label="admin-OS on GitHub"
            >
              <SimpleIcon icon={siGithub} aria-hidden className="size-4.5 fill-current" />
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}
