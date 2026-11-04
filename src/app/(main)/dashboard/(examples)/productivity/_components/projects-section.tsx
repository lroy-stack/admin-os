"use client";

import { useState } from "react";

import { ClipboardCheck, Globe, Orbit, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPercent, useLocale, useMessages } from "@/core/i18n/client";

import { productivityMessageKey } from "./messages";
import { dueLabel, useProductivity, useProjectText } from "./productivity-provider";
import { matchesProjectFilter, type ProjectFilter, type ProjectSeed, projectFilters } from "./productivity-state";

const isFilter = (value: string): value is ProjectFilter => projectFilters.some((filter) => filter === value);

const seedIcons: Record<ProjectSeed, typeof Orbit> = { roadmap: Orbit, website: Globe, onboarding: ClipboardCheck };

export function ProjectsSection() {
  const text = useMessages(productivityMessageKey).projects;
  const locale = useLocale();
  const projectText = useProjectText();
  const { state, openCreate, openProject } = useProductivity();
  const [filter, setFilter] = useState<ProjectFilter>("active");
  const projects = state.projects.filter((project) => matchesProjectFilter(project.status, filter));

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-xl tracking-tight">{text.title}</h2>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(value) => isFilter(value) && setFilter(value)}>
            <SelectTrigger className="min-w-28" aria-label={text.filterLabel}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {projectFilters.map((value) => (
                  <SelectItem key={value} value={value}>
                    {text.filters[value]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={(event) => openCreate("project", event.currentTarget)}>
            <Plus data-icon="inline-start" />
            {text.new}
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm" role="status">
          {text.empty}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {projects.map((project) => {
            const Icon = project.seed ? seedIcons[project.seed] : Orbit;
            const copy = projectText(project);
            return (
              <Card key={project.id} className="min-w-0 shadow-xs">
                <CardHeader>
                  <CardTitle>
                    <div className="flex items-start gap-2">
                      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      <Button
                        variant="link"
                        className="h-auto min-w-0 justify-start p-0 text-left font-medium break-words hyphens-auto whitespace-normal"
                        onClick={(event) => openProject(project, event.currentTarget)}
                      >
                        {copy.title}
                      </Button>
                    </div>
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline" className="max-w-32">
                      <span className="truncate" title={text.statuses[project.status]}>
                        {text.statuses[project.status]}
                      </span>
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm leading-snug break-words hyphens-auto">{copy.description}</div>
                    <div className="flex items-center gap-3">
                      <Progress value={project.progress * 100} className="h-2" />
                      <span className="shrink-0 text-sm tabular-nums">{formatPercent(project.progress, locale)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="py-2.5">
                  <span className="text-muted-foreground">{dueLabel(project.dueInDays, text.due, locale)}</span>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
