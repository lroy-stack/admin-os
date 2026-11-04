"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { ecommerceMessageKey } from "./messages";
import { channels, type EcommerceChannel, type EcommercePeriod, isChannel, isPeriod, periods } from "./order-view";

interface EcommerceFilterState {
  readonly period: EcommercePeriod;
  readonly channel: EcommerceChannel;
  readonly setPeriod: (period: EcommercePeriod) => void;
  readonly setChannel: (channel: EcommerceChannel) => void;
}

const FilterContext = createContext<EcommerceFilterState | null>(null);

/** The period and channel the screen shows; the orders and the traffic read them. */
export function useEcommerceFilters(): EcommerceFilterState {
  const state = useContext(FilterContext);
  if (!state) throw new Error("useEcommerceFilters needs an EcommerceFiltersProvider above it");
  return state;
}

export function EcommerceFiltersProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<EcommercePeriod>("thisMonth");
  const [channel, setChannel] = useState<EcommerceChannel>("all");
  return <FilterContext.Provider value={{ period, channel, setPeriod, setChannel }}>{children}</FilterContext.Provider>;
}

/** The two selects of the page header and the line that says what the widgets are showing. */
export function EcommerceFilterBar() {
  const text = useMessages(ecommerceMessageKey).filters;
  const { period, channel, setPeriod, setChannel } = useEcommerceFilters();

  return (
    <div className="flex flex-wrap items-end justify-end gap-2 lg:w-fit">
      <Select value={period} onValueChange={(value) => isPeriod(value) && setPeriod(value)}>
        <SelectTrigger aria-label={text.periodLabel} className="min-w-34" id="ecommerce-period" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {periods.map((value) => (
              <SelectItem key={value} value={value}>
                {text.period[value]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select value={channel} onValueChange={(value) => isChannel(value) && setChannel(value)}>
        <SelectTrigger aria-label={text.channelLabel} className="min-w-40" id="ecommerce-channel" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {channels.map((value) => (
              <SelectItem key={value} value={value}>
                {text.channel[value]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

/** Says what the widgets show: the period and channel, for the widgets that carry no filter of their own. */
export function EcommerceScope() {
  const text = useMessages(ecommerceMessageKey).filters;
  const locale = useLocale();
  const { period, channel } = useEcommerceFilters();
  return (
    <p className="text-muted-foreground text-xs" aria-live="polite">
      {format(text.showing, locale, { period: text.period[period], channel: text.channel[channel] })}
    </p>
  );
}
