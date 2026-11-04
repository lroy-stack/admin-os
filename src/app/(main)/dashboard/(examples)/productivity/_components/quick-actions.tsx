"use client";

import { CheckSquare, FileText, Focus, Orbit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/core/i18n/client";

import { productivityMessageKey } from "./messages";
import { type CreateKind, useProductivity } from "./productivity-provider";

export function QuickActions() {
  const text = useMessages(productivityMessageKey).quickActions;
  const { openCreate } = useProductivity();
  const quickActions = [
    { key: "note", label: text.newNote, icon: FileText },
    { key: "task", label: text.newTask, icon: CheckSquare },
    { key: "project", label: text.newProject, icon: Orbit },
    { key: "goal", label: text.newGoal, icon: Focus },
  ] as const satisfies readonly { key: CreateKind; label: string; icon: typeof Focus }[];

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl tracking-tight">{text.title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Button
            key={action.key}
            variant="outline"
            className="min-w-0 justify-start"
            onClick={(event) => openCreate(action.key, event.currentTarget)}
          >
            <action.icon data-icon="inline-start" />
            <span className="truncate">{action.label}</span>
          </Button>
        ))}
      </div>
    </section>
  );
}
