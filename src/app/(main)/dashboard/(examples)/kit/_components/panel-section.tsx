"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/core/i18n/client";
import { ResponsivePanel } from "@/ds/overlays";

import { KitSection } from "./kit-section";
import { kitMessageKey } from "./messages";

export function PanelSection() {
  const text = useMessages(kitMessageKey).panel;
  const [open, setOpen] = useState(false);

  return (
    <KitSection title={text.title} description={text.description}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {text.open}
      </Button>
      <ResponsivePanel
        open={open}
        onOpenChange={setOpen}
        title={text.panelTitle}
        description={text.panelDescription}
        className="data-[vaul-drawer-direction=right]:sm:max-w-md"
      >
        <p className="px-4 pb-4 text-sm">{text.panelBody}</p>
      </ResponsivePanel>
    </KitSection>
  );
}
