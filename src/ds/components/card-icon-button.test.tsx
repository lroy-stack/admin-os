import { MoreHorizontalIcon } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { CardIconButton } from "./card-icon-button";

const moreLabel = "More actions";
const openLabel = "Open pipeline";

describe("CardIconButton", () => {
  it("receives the trigger props a DropdownMenuTrigger asChild passes down", () => {
    const html = renderToStaticMarkup(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <CardIconButton icon={MoreHorizontalIcon} label={moreLabel} />
        </DropdownMenuTrigger>
      </DropdownMenu>,
    );

    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain(`aria-label="${moreLabel}"`);
  });

  it("renders a link named by its label when it has an href", () => {
    const html = renderToStaticMarkup(<CardIconButton icon={MoreHorizontalIcon} label={openLabel} href="/crm" />);

    expect(html).toMatch(/^<a [^>]*href="\/crm"/);
    expect(html).toContain(`aria-label="${openLabel}"`);
  });
});
