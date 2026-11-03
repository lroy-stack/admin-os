import { LocaleBundles } from "@/app/_components/locale-root";
import { getMessages } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";

import { ConfirmSection } from "./_components/confirm-section";
import { FormSection } from "./_components/form-section";
import { kitBundle, kitMessages } from "./_components/messages.server";
import { PanelSection } from "./_components/panel-section";
import { QuickSection } from "./_components/quick-section";

export const generateMetadata = () => pageMetadata("/dashboard/kit", kitMessages);

export default async function Page() {
  const text = await getMessages(kitMessages);

  return (
    <LocaleBundles bundles={[kitBundle]}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight break-words hyphens-auto">{text.title}</h1>
          <p className="text-muted-foreground text-sm">{text.subtitle}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <PanelSection />
          <ConfirmSection />
          <QuickSection />
          <FormSection />
        </div>
      </div>
    </LocaleBundles>
  );
}
