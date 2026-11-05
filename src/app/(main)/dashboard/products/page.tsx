import { LocaleBundles } from "@/app/_components/locale-root";
import { getMessages } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { VIEW_RENDERERS } from "@/config/modules.client.generated";
import type { ViewData } from "@/core/views";
import { ReadState } from "@/ds/feedback";

import { loadProducts } from "./_components/load-products.server";
import { productsBundle, productsMessages } from "./_components/messages.server";
import { ProductViews } from "./_components/product-views";

export const generateMetadata = () => pageMetadata("/dashboard/products", productsMessages);

export default async function Page() {
  const [text, loaded] = await Promise.all([getMessages(productsMessages), loadProducts()]);

  const heading = (
    <div className="flex min-w-0 flex-col gap-2">
      <h1 className="text-3xl leading-none font-normal tracking-tight">{text.title}</h1>
      <p className="text-muted-foreground text-sm">{text.subtitle}</p>
    </div>
  );

  return (
    <LocaleBundles bundles={[productsBundle, ...loaded.bundles]}>
      <div data-content-padding="false">
        <div className="flex h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 min-w-0 flex-col gap-4 md:gap-6">
          {loaded.refusal ? (
            <>
              <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-4 pt-4 md:px-6 md:pt-6">
                {heading}
              </div>
              <div className="px-4 md:px-6">
                <ReadState state={loaded.refusal.state} reason={loaded.refusal.reason} emptyTitle={text.title}>
                  {null}
                </ReadState>
              </div>
            </>
          ) : (
            <ProductViews
              heading={heading}
              views={loaded.views.map(({ id, kind, label, data }) => {
                const Renderer = VIEW_RENDERERS[kind];
                // The loader of a kind returns the rows its own renderer takes; the map joins them by kind id.
                return { id, label, content: <Renderer data={data as ViewData<never>} /> };
              })}
            />
          )}
        </div>
      </div>
    </LocaleBundles>
  );
}
