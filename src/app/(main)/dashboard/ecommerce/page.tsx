import { Settings2 } from "lucide-react";

import { LocaleBundles } from "@/app/_components/locale-root";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { formatDate } from "@/core/i18n/client";

import { CustomerReviews } from "./_components/customer-reviews";
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-3xl leading-none tracking-tight">{text.title}</h1>
            <p className="text-muted-foreground text-sm">{formattedDate}</p>
          </div>

          <div className="flex flex-wrap items-end justify-end gap-2 lg:w-fit">
            <Select defaultValue="this-month">
              <SelectTrigger aria-label={text.filters.periodLabel} className="min-w-34" id="ecommerce-period" size="sm">
                <SelectValue placeholder={text.filters.period.thisMonth} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="this-month">{text.filters.period.thisMonth}</SelectItem>
                  <SelectItem value="last-month">{text.filters.period.lastMonth}</SelectItem>
                  <SelectItem value="last-30-days">{text.filters.period.last30Days}</SelectItem>
                  <SelectItem value="year-to-date">{text.filters.period.yearToDate}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select defaultValue="all-channels">
              <SelectTrigger
                aria-label={text.filters.channelLabel}
                className="min-w-40"
                id="ecommerce-channel"
                size="sm"
              >
                <SelectValue placeholder={text.filters.channel.all} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all-channels">{text.filters.channel.all}</SelectItem>
                  <SelectItem value="online-store">{text.filters.channel.onlineStore}</SelectItem>
                  <SelectItem value="marketplace">{text.filters.channel.marketplace}</SelectItem>
                  <SelectItem value="social">{text.filters.channel.social}</SelectItem>
                  <SelectItem value="retail">{text.filters.channel.retail}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Separator orientation="vertical" />

            <Button aria-label={text.filters.settings} size="icon-sm" variant="outline">
              <Settings2 />
            </Button>
          </div>
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
    </LocaleBundles>
  );
}
