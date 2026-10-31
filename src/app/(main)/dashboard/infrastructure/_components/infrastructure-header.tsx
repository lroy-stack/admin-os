import { Box, Container, Filter, PlusCircle, RefreshCw, Search, Server, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { getLocale, getMessages } from "@/config/locale.server";
import { format, formatPercent, formatRelative } from "@/core/i18n/client";

import { infrastructureSummary, SEARCH_SHORTCUT } from "./infrastructure-data";
import { infrastructureMessages } from "./messages.server";

/** The monitoring data was refreshed this long ago. */
const REFRESHED_SECONDS_AGO = 30;

export async function InfrastructureHeader() {
  const [text, locale] = await Promise.all([getMessages(infrastructureMessages), getLocale()]);
  const filterButtons = [
    text.filters.organization,
    text.filters.stack,
    text.filters.cloudProvider,
    text.filters.projectType,
    text.filters.environment,
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl leading-tight font-medium tracking-tight break-words hyphens-auto sm:text-3xl sm:leading-none">
              {text.title}
            </h1>
            <p className="text-muted-foreground text-sm">{text.subtitle}</p>
          </div>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
            <span className="text-muted-foreground text-sm">
              {format(text.lastUpdated, locale, {
                time: formatRelative(-REFRESHED_SECONDS_AGO * 1000, 0, locale),
              })}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon-sm" aria-label={text.refresh}>
                <RefreshCw />
              </Button>
              <Button variant="outline" size="icon-sm" aria-label={text.settings}>
                <Settings data-icon="inline-start" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <Container />
            {format(text.summary.projects, locale, { count: infrastructureSummary.projects })}
          </Badge>
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <Box />
            {format(text.summary.environments, locale, { count: infrastructureSummary.environments })}
          </Badge>
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <Server />
            {format(text.summary.servers, locale, { count: infrastructureSummary.servers })}
          </Badge>
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <span className="size-2 rounded-full bg-green-600 dark:bg-green-500" />
            {format(text.summary.globalUptime, locale, {
              value: formatPercent(infrastructureSummary.globalUptime, locale, {
                minFractionDigits: 2,
                maxFractionDigits: 2,
              }),
            })}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row">
        <InputGroup className="flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput aria-label={text.search.label} placeholder={text.search.placeholder} />
          <InputGroupAddon align="inline-end">
            <Kbd>{SEARCH_SHORTCUT}</Kbd>
          </InputGroupAddon>
        </InputGroup>

        <div className="flex flex-wrap gap-2">
          {filterButtons.map((label) => (
            <Button key={label} variant="outline">
              <PlusCircle data-icon="inline-start" />
              {label}
            </Button>
          ))}
          <Button variant="outline">
            <Filter data-icon="inline-start" />
            {text.filters.filters}
          </Button>
        </div>
      </div>
    </div>
  );
}
