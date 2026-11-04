import { LocaleBundles } from "@/app/_components/locale-root";
import { getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { formatDate } from "@/core/i18n/client";

import { CustomerReviews } from "./_components/customer-reviews";
import { EcommerceFilterBar, EcommerceFiltersProvider, EcommerceScope } from "./_components/ecommerce-filters";
import { Inventory } from "./_components/inventory";
import { KpiStrip } from "./_components/kpi-strip";
import { ecommerceBundle, ecommerceMessages } from "./_components/messages.server";
import { RecentOrders } from "./_components/recent-orders";
import { StoreTraffic } from "./_components/store-traffic";
import { TopProducts } from "./_components/top-products";
import { TrafficSources } from "./_components/traffic-sources";

export const generateMetadata = () => pageMetadata("/dashboard/ecommerce", ecommerceMessages);

export default async function Page() {
  const locale = await getLocale();
  const text = ecommerceMessages[locale];
  const formattedDate = formatDate(new Date(), locale, "UTC", { dateStyle: "full" });

  return (
    <LocaleBundles bundles={[ecommerceBundle]}>
      <EcommerceFiltersProvider>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-3xl leading-none tracking-tight">{text.title}</h1>
              <p className="text-muted-foreground text-sm">{formattedDate}</p>
              <EcommerceScope />
            </div>

            <EcommerceFilterBar />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <KpiStrip />
            <div className="xl:col-span-5">
              <StoreTraffic />
            </div>
            <div className="xl:col-span-7">
              <TrafficSources />
            </div>
            <div className="xl:col-span-4">
              <TopProducts />
            </div>
            <div className="xl:col-span-4">
              <Inventory />
            </div>
            <div className="xl:col-span-4">
              <CustomerReviews />
            </div>
            <div className="xl:col-span-12">
              <RecentOrders />
            </div>
          </div>
        </div>
      </EcommerceFiltersProvider>
    </LocaleBundles>
  );
}
