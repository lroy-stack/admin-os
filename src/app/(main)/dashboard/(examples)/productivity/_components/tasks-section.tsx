import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLocale } from "@/config/locale.server";
import { formatTime, type Locale } from "@/core/i18n/client";

import { productivityMessages } from "./messages.server";
import { TaskChecklist } from "./task-checklist";

/** A time of day on a fixed reference day, formatted in UTC so it never shifts: "10:00 AM", "10:00". */
function clock(hour: number, minute: number, locale: Locale) {
  return formatTime(Date.UTC(2026, 0, 1, hour, minute), locale, "UTC");
}

export async function TasksSection() {
  const locale = await getLocale();
  const text = productivityMessages[locale].tasks;
  const items = [
    {
      key: "roadmap",
      title: text.items.finalizeRoadmap,
      tag: text.tags.work,
      time: clock(10, 0, locale),
      checked: false,
    },
    {
      key: "design-system",
      title: text.items.reviewDesignSystem,
      tag: text.tags.design,
      time: clock(11, 30, locale),
      checked: true,
    },
    {
      key: "emails",
      title: text.items.replyToEmails,
      tag: text.tags.admin,
      time: clock(14, 0, locale),
      checked: false,
    },
    {
      key: "content",
      title: text.items.planContent,
      tag: text.tags.content,
      time: clock(16, 30, locale),
      checked: false,
    },
    {
      key: "sync-notes",
      title: text.items.prepareSyncNotes,
      tag: text.tags.planning,
      time: clock(18, 0, locale),
      checked: false,
    },
  ];

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-xl tracking-tight">{text.title}</h2>
        <div className="flex items-center gap-2">
          <Select defaultValue="today">
            <SelectTrigger className="min-w-30" aria-label={text.rangeLabel}>
              <SelectValue placeholder={text.ranges.today} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="today">{text.ranges.today}</SelectItem>
                <SelectItem value="tomorrow">{text.ranges.tomorrow}</SelectItem>
                <SelectItem value="this-week">{text.ranges.thisWeek}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button>
            <Plus data-icon="inline-start" />
            {text.newTask}
          </Button>
        </div>
      </div>

      <TaskChecklist items={items} />
    </section>
  );
}
