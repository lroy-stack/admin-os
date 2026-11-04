import { LocaleBundles } from "@/app/_components/locale-root";
import { getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { format } from "@/core/i18n/client";

import { CalendarPanel } from "./_components/calendar-panel";
import { FocusCard } from "./_components/focus-card";
import { productivityBundle, productivityMessages } from "./_components/messages.server";
import { ProductivityProvider } from "./_components/productivity-provider";
import { ProjectsSection } from "./_components/projects-section";
import { QuickActions } from "./_components/quick-actions";
import { QuoteCard } from "./_components/quote-card";
import { RecentNotesCard } from "./_components/recent-notes-card";
import { SummaryCards } from "./_components/summary-cards";
import { TasksSection } from "./_components/tasks-section";
import { WeeklySummaryCard } from "./_components/weekly-summary-card";

export const generateMetadata = () => pageMetadata("/dashboard/productivity", productivityMessages);

// A proper noun: the demo user's first name is not translated.
const DEMO_USER = "Alex";

export default async function Page() {
  const locale = await getLocale();
  const text = productivityMessages[locale];

  return (
    <LocaleBundles bundles={[productivityBundle]}>
      <ProductivityProvider>
        <div className="grid gap-6 lg:grid-cols-12">
          <section className="min-w-0 lg:col-span-9">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-foreground text-3xl leading-tight tracking-tight">
                  {format(text.greeting.title, locale, { name: DEMO_USER })}
                </h1>
                <p className="text-muted-foreground text-lg leading-snug">{text.greeting.subtitle}</p>
              </div>
              <SummaryCards />
              <TasksSection />
              <ProjectsSection />
              <QuickActions />
              <QuoteCard />
            </div>
          </section>

          <section className="flex min-w-0 flex-col gap-6 lg:col-span-3">
            <CalendarPanel />
            <FocusCard />
            <RecentNotesCard />
            <WeeklySummaryCard />
          </section>
        </div>
      </ProductivityProvider>
    </LocaleBundles>
  );
}
