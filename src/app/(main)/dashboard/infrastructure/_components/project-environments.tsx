"use client";

import { useRef } from "react";

import { cn } from "cn";
import {
  ArrowUpDown,
  ChevronDown,
  CircleDashed,
  CircleGauge,
  Clock3,
  Copy,
  EllipsisVertical,
  Plus,
  RefreshCw,
  SquareTerminal,
} from "lucide-react";
import { toast } from "sonner";

import { SimpleIcon } from "@/components/simple-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, formatPercent, formatTime, type Locale, useLocale, useMessages } from "@/core/i18n/client";
import { useCopy } from "@/ds/feedback";

import type { InfrastructureEnvironment, InfrastructureGroup } from "./infrastructure-data";
import { formatLatency, formatUptime } from "./infrastructure-format";
import { type InfrastructureMessages, infrastructureMessageKey } from "./messages";

export interface ProjectEnvironmentsProps {
  group: InfrastructureGroup;
  /** Opens the Add environment window; `opener` is the button, where focus returns. */
  onAddEnvironment: (group: InfrastructureGroup, opener: Element | null) => void;
  /** Opens the restart confirmation; `opener` is the row menu's button. */
  onRestart: (environment: InfrastructureEnvironment, opener: Element | null) => void;
}

export function ProjectEnvironments({ group, onAddEnvironment, onRestart }: ProjectEnvironmentsProps) {
  const text = useMessages(infrastructureMessageKey);
  const locale = useLocale();
  const copy = useCopy();
  const projectName = text.projects[group.id];
  const syncStatus = () =>
    toast.success(
      format(text.project.synced, locale, {
        project: projectName,
        time: formatTime(Date.now(), locale, Intl.DateTimeFormat().resolvedOptions().timeZone),
      }),
    );

  return (
    <Collapsible
      defaultOpen
      className="bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl border py-3 data-[state=open]:gap-3 data-[state=open]:pb-0"
    >
      <div className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="group -ml-2 h-auto w-full justify-start gap-2 px-2 py-1 hover:bg-transparent aria-expanded:bg-transparent sm:flex-1"
          >
            <ChevronDown className="group-data-[state=open]:rotate-180" />
            <div className="flex min-w-0 items-baseline gap-1.5 text-left">
              <span className="shrink-0 leading-none font-medium">{group.organization}</span>
              <span className="text-muted-foreground min-w-0 text-sm break-words">{`(${projectName})`}</span>
            </div>
          </Button>
        </CollapsibleTrigger>
        <div className="flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-1.5 sm:ml-0"
            onClick={(event) => onAddEnvironment(group, event.currentTarget)}
          >
            <Plus data-icon="inline-start" />
            {text.project.addEnvironment}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={format(text.project.actions, locale, { project: projectName })}
              >
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={syncStatus}>
                  <RefreshCw />
                  {text.project.syncStatus}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => void copy(`prj_${group.id}`, text.project.idLabel)}>
                  <Copy />
                  {text.project.copyProjectId}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CollapsibleContent>
        {group.rows.length > 0 ? (
          <EnvironmentTable rows={group.rows} text={text} locale={locale} onRestart={onRestart} />
        ) : (
          <EmptyProjectState text={text} />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function EnvironmentTable({
  rows,
  text,
  locale,
  onRestart,
}: {
  rows: InfrastructureEnvironment[];
  text: InfrastructureMessages;
  locale: Locale;
  onRestart: ProjectEnvironmentsProps["onRestart"];
}) {
  const copy = useCopy();
  const restartTriggers = useRef(new Map<string, HTMLButtonElement>());
  return (
    <div className="[&::-webkit-scrollbar-thumb]:bg-border scrollbar-thin [scrollbar-color:var(--border)_transparent] overflow-x-auto **:data-[slot=table-container]:overflow-visible [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
      <Table className="min-w-[1700px] table-fixed **:data-[slot='table-cell']:px-5 **:data-[slot='table-head']:px-5">
        <colgroup>
          <col className="w-90" />
          <col className="w-40" />
          <col className="w-42" />
          <col className="w-35" />
          <col className="w-35" />
          <col className="w-38" />
          <col className="w-98" />
          <col className="w-55" />
          <col className="w-18" />
        </colgroup>
        <TableHeader className="bg-muted/50 [&_tr]:border-y">
          <TableRow>
            <TableHead className="font-medium">
              <span className="inline-flex items-center gap-1">
                {text.table.domain} <ArrowUpDown className="size-4" />
              </span>
            </TableHead>
            <TableHead>{text.table.platform}</TableHead>
            <TableHead>{text.table.environment}</TableHead>
            <TableHead>{text.table.health}</TableHead>
            <TableHead>{text.table.latency}</TableHead>
            <TableHead>{text.table.uptime}</TableHead>
            <TableHead>{text.table.resources}</TableHead>
            <TableHead>{text.table.server}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody className="**:data-[slot='table-row']:hover:bg-transparent">
          {rows.map((row) => (
            <TableRow key={row.domain}>
              <TableCell>
                <span className="block truncate font-medium" title={row.domain}>
                  {row.domain}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground flex items-center gap-2 font-medium">
                  <SimpleIcon icon={row.platform.icon} className="size-4 fill-current" />
                  {row.platform.name}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={row.environment === "expired" ? "destructive" : "secondary"}
                  className={cn(
                    "rounded-sm px-1.5 py-0.5",
                    row.environment === "production" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    row.environment === "staging" && "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                  )}
                >
                  {text.environments[row.environment]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={row.status === "online" ? "secondary" : "destructive"}
                  className={cn(
                    "rounded-sm px-1.5 py-0.5",
                    row.status === "online" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      row.status === "online" ? "bg-emerald-500" : "bg-destructive",
                    )}
                  />
                  {text.health[row.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground inline-flex items-center gap-1.5 tabular-nums">
                  <CircleGauge className="size-4" />
                  {formatLatency(row.latencyMs, locale)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground inline-flex items-center gap-1.5 tabular-nums">
                  <Clock3 className="size-4" />
                  {formatUptime(row.uptime, locale)}
                </span>
              </TableCell>
              <TableCell>
                <div className="grid grid-cols-3 gap-4">
                  <ResourceMeter label={text.resources.cpu} value={row.resources.cpu} locale={locale} />
                  <ResourceMeter label={text.resources.ram} value={row.resources.ram} locale={locale} />
                  <ResourceMeter label={text.resources.disk} value={row.resources.disk} locale={locale} />
                </div>
              </TableCell>
              <TableCell>
                <span className="flex flex-col font-medium">
                  {row.server ?? text.table.customServer}
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <span
                      aria-hidden="true"
                      className={cn("ring-foreground/10 shrink-0 rounded-xs text-sm ring-1", `flag:${row.countryCode}`)}
                    />
                    {`${row.countryCode} · ${row.plan}`}
                  </span>
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="-mr-2"
                      ref={(button) => {
                        if (button) restartTriggers.current.set(row.domain, button);
                        else restartTriggers.current.delete(row.domain);
                      }}
                      aria-label={format(text.table.rowActions, locale, { domain: row.domain })}
                    >
                      <SquareTerminal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onSelect={() => onRestart(row, restartTriggers.current.get(row.domain) ?? null)}
                      >
                        <RefreshCw />
                        {text.table.restart}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={() => void copy(`https://${row.domain}`, text.table.urlLabel)}>
                        <Copy />
                        {text.table.copyUrl}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ResourceMeter({ label, value, locale }: { label: string; value: number; locale: Locale }) {
  const isCritical = value >= 70;
  const isWarning = value >= 55;

  return (
    <span className="min-w-0 space-y-1">
      <span className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span
          className={cn(
            "font-medium text-emerald-600 tabular-nums dark:text-emerald-400",
            isWarning && "text-amber-600 dark:text-amber-400",
            isCritical && "text-destructive",
          )}
        >
          {formatPercent(value / 100, locale)}
        </span>
      </span>
      <span className="bg-muted-foreground/20 block h-1.5 overflow-hidden rounded-full">
        <span
          className={cn(
            "block h-full rounded-full bg-emerald-500",
            isWarning && "bg-amber-500",
            isCritical && "bg-destructive",
          )}
          style={{ width: `${value}%` }}
        />
      </span>
    </span>
  );
}

function EmptyProjectState({ text }: { text: InfrastructureMessages }) {
  return (
    <div className="bg-muted/50 flex min-h-24 items-center justify-center border-t p-4">
      <div className="flex items-center gap-2">
        <CircleDashed className="size-4" />
        <p className="text-sm font-medium">{text.project.noEnvironments}</p>
      </div>
    </div>
  );
}
