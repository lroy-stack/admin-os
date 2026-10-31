import { CheckSquare, FileText, Focus, Orbit, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getMessages } from "@/config/locale.server";

import { productivityMessages } from "./messages.server";

export async function QuickActions() {
  const text = (await getMessages(productivityMessages)).quickActions;
  const quickActions = [
    { key: "note", label: text.newNote, icon: FileText },
    { key: "task", label: text.newTask, icon: CheckSquare },
    { key: "project", label: text.newProject, icon: Orbit },
    { key: "goal", label: text.newGoal, icon: Focus },
    { key: "upload", label: text.upload, icon: Upload },
  ];

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl tracking-tight">{text.title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {quickActions.map((action) => (
          <Button key={action.key} variant="outline" className="min-w-0 justify-start">
            <action.icon data-icon="inline-start" />
            <span className="truncate">{action.label}</span>
          </Button>
        ))}
      </div>
    </section>
  );
}
