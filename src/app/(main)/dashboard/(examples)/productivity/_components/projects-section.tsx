import { ClipboardCheck, Globe, Orbit, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLocale } from "@/config/locale.server";
import { format, formatCalendarDate, formatPercent } from "@/core/i18n/client";

import { addCalendarDays, todayIso } from "./calendar-days";
import { productivityMessages } from "./messages.server";

export async function ProjectsSection() {
  const locale = await getLocale();
  const text = productivityMessages[locale].projects;
  const today = todayIso();
  const due = (days: number) =>
    format(text.due, locale, {
      date: formatCalendarDate(addCalendarDays(today, days), locale, { month: "short", day: "numeric" }),
    });

  const projects = [
    {
      key: "roadmap",
      ...text.items.roadmap,
      status: text.statuses.inProgress,
      progress: 0.68,
      due: due(9),
      icon: Orbit,
    },
    {
      key: "website",
      ...text.items.website,
      status: text.statuses.planning,
      progress: 0.42,
      due: due(21),
      icon: Globe,
    },
    {
      key: "onboarding",
      ...text.items.onboarding,
      status: text.statuses.planning,
      progress: 0.31,
      due: due(18),
      icon: ClipboardCheck,
    },
  ];

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-xl tracking-tight">{text.title}</h2>
        <div className="flex items-center gap-2">
          <Select defaultValue="active">
            <SelectTrigger className="min-w-28" aria-label={text.filterLabel}>
              <SelectValue placeholder={text.filters.active} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="active">{text.filters.active}</SelectItem>
                <SelectItem value="planning">{text.filters.planning}</SelectItem>
                <SelectItem value="completed">{text.filters.completed}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Plus data-icon="inline-start" />
            {text.new}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.key} className="min-w-0 shadow-xs">
            <CardHeader>
              <CardTitle>
                <div className="flex items-start gap-2">
                  <project.icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0 break-words hyphens-auto">{project.title}</span>
                </div>
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="max-w-32">
                  <span className="truncate" title={project.status}>
                    {project.status}
                  </span>
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                <div className="text-sm leading-snug break-words hyphens-auto">{project.description}</div>
                <div className="flex items-center gap-3">
                  <Progress value={project.progress * 100} className="h-2" />
                  <span className="shrink-0 text-sm tabular-nums">{formatPercent(project.progress, locale)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="py-2.5">
              <span className="text-muted-foreground">{project.due}</span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
