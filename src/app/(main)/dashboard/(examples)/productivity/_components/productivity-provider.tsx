"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format, formatCalendarDate, formatPercent, useLocale, useMessages } from "@/core/i18n/client";
import { QuickDialog } from "@/ds/overlays";

import type { ShowcaseField, ShowcaseValues } from "../../../_components/showcase-form";
import { ShowcaseFormDialog } from "../../../_components/showcase-form-dialog";
import { useOpenWindow } from "../../../_components/use-open-window";
import { addCalendarDays, todayIso } from "./calendar-days";
import { productivityMessageKey } from "./messages";
import {
  addGoal,
  addNote,
  addProject,
  addTask,
  initialProductivityState,
  type ProductivityState,
  type Project,
  projectStatuses,
  taskTags,
  toggleTask,
} from "./productivity-state";

export type CreateKind = "note" | "task" | "project" | "goal";

interface ProductivityContext {
  readonly state: ProductivityState;
  readonly setTaskDone: (id: string, done: boolean) => void;
  /** Opens the window that adds a note, task, project or goal; `opener` is the button that asked. */
  readonly openCreate: (kind: CreateKind, opener: Element | null) => void;
  readonly openProject: (project: Project, opener: Element | null) => void;
}

const Context = createContext<ProductivityContext | null>(null);

export function useProductivity(): ProductivityContext {
  const value = useContext(Context);
  if (!value) throw new Error("useProductivity needs a ProductivityProvider above it");
  return value;
}

const DAY_FOR_WHEN: Readonly<Record<string, number>> = { today: 0, tomorrow: 1, thisWeek: 3 };

/** The title and details of the demo projects live in the dictionary; a project the person adds carries its own. */
export function useProjectText() {
  const text = useMessages(productivityMessageKey).projects;
  return (project: Project) =>
    project.seed ? text.items[project.seed] : { title: project.title, description: project.description };
}

/**
 * The tasks, projects, notes and goals of the Productivity screen, and the windows that add to them. The data is local
 * to the screen (ADR 0015): each window says so in its footer, and nothing is saved.
 */
export function ProductivityProvider({ children }: { children: ReactNode }) {
  const text = useMessages(productivityMessageKey);
  const locale = useLocale();
  const projectText = useProjectText();
  const [state, setState] = useState(initialProductivityState);
  const create = useOpenWindow<CreateKind>();
  const details = useOpenWindow<Project>();

  const setTaskDone = useCallback(
    (id: string, done: boolean) => setState((current) => toggleTask(current, id, done)),
    [],
  );

  const errors = useMemo(() => ({ required: text.forms.required }), [text.forms.required]);
  const fields: Record<CreateKind, readonly ShowcaseField[]> = useMemo(
    () => ({
      note: [{ name: "title", label: text.forms.title, kind: "text", required: true }],
      goal: [{ name: "title", label: text.forms.goal, kind: "text", required: true }],
      task: [
        { name: "title", label: text.forms.title, kind: "text", required: true },
        {
          name: "tag",
          label: text.forms.tag,
          kind: "select",
          options: taskTags.map((tag) => ({ value: tag, label: text.tasks.tags[tag] })),
        },
        {
          name: "when",
          label: text.forms.when,
          kind: "select",
          options: [
            { value: "today", label: text.tasks.ranges.today },
            { value: "tomorrow", label: text.tasks.ranges.tomorrow },
            { value: "thisWeek", label: text.tasks.ranges.thisWeek },
          ],
        },
        { name: "time", label: text.forms.time, kind: "time", required: true },
      ],
      project: [
        { name: "title", label: text.forms.title, kind: "text", required: true },
        { name: "description", label: text.forms.description, kind: "textarea" },
        {
          name: "status",
          label: text.forms.status,
          kind: "select",
          options: projectStatuses.map((status) => ({ value: status, label: text.projects.statuses[status] })),
        },
        { name: "due", label: text.forms.due, kind: "date", required: true },
      ],
    }),
    [text],
  );
  const titles: Record<CreateKind, string> = {
    note: text.quickActions.newNote,
    task: text.quickActions.newTask,
    project: text.quickActions.newProject,
    goal: text.quickActions.newGoal,
  };

  const today = todayIso();
  const starts: Partial<Record<CreateKind, ShowcaseValues>> = {
    task: { title: "", tag: "work", when: "today", time: "09:00" },
    project: { title: "", description: "", status: "planning", due: addCalendarDays(today, 14) },
  };

  function save(kind: CreateKind, values: ShowcaseValues) {
    if (kind === "note") setState((current) => addNote(current, values.title));
    if (kind === "goal") setState((current) => addGoal(current));
    if (kind === "task") {
      const tag = taskTags.find((candidate) => candidate === values.tag) ?? "work";
      setState((current) =>
        addTask(current, { title: values.title, tag, time: values.time, day: DAY_FOR_WHEN[values.when] ?? 0 }),
      );
    }
    if (kind === "project") {
      const status = projectStatuses.find((candidate) => candidate === values.status) ?? "planning";
      const dueInDays = Math.max(
        0,
        Math.round((Date.parse(`${values.due}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000),
      );
      setState((current) =>
        addProject(current, { title: values.title, description: values.description, status, dueInDays }),
      );
    }
    toast.success(text.toasts[kind]);
  }

  const value = useMemo<ProductivityContext>(
    () => ({
      state,
      setTaskDone,
      openCreate: (kind, opener) => create.show(kind, opener),
      openProject: (project, opener) => details.show(project, opener),
    }),
    [state, setTaskDone, create.show, details.show],
  );

  const kind = create.shown?.value;
  const project = details.shown?.value;
  const shownProject = project ? (state.projects.find((item) => item.id === project.id) ?? project) : null;

  return (
    <Context.Provider value={value}>
      {children}
      {create.shown && kind ? (
        <ShowcaseFormDialog
          key={create.shown.opening}
          kind="quick"
          open={create.shown.open}
          onOpenChange={create.onOpenChange}
          title={titles[kind]}
          verb={titles[kind]}
          fields={fields[kind]}
          errors={errors}
          initial={starts[kind]}
          returnFocus={create.returnFocus}
          onSave={(values) => save(kind, values)}
        />
      ) : null}
      {details.shown && shownProject ? (
        <QuickDialog
          demo
          key={details.shown.opening}
          open={details.shown.open}
          onOpenChange={details.onOpenChange}
          title={projectText(shownProject).title}
          description={projectText(shownProject).description || undefined}
          returnFocus={details.returnFocus}
          footer={({ close }) => (
            <Button type="button" onClick={close}>
              {text.done}
            </Button>
          )}
        >
          <dl className="divide-y rounded-lg border text-sm">
            <div className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-muted-foreground">{text.forms.status}</dt>
              <dd className="font-medium">{text.projects.statuses[shownProject.status]}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-muted-foreground">{text.projects.progress}</dt>
              <dd className="flex items-center gap-2 font-medium tabular-nums">
                <Progress value={shownProject.progress * 100} className="h-2 w-24" />
                {formatPercent(shownProject.progress, locale)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-muted-foreground">{text.forms.due}</dt>
              <dd className="font-medium">
                {formatCalendarDate(addCalendarDays(today, shownProject.dueInDays), locale, { dateStyle: "medium" })}
              </dd>
            </div>
          </dl>
        </QuickDialog>
      ) : null}
    </Context.Provider>
  );
}

/** "Due {date}" in the short form the cards use. */
export function dueLabel(dueInDays: number, due: string, locale: Parameters<typeof formatCalendarDate>[1]): string {
  return format(due, locale, {
    date: formatCalendarDate(addCalendarDays(todayIso(), dueInDays), locale, { month: "short", day: "numeric" }),
  });
}
