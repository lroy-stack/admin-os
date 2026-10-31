import { LocaleBundles } from "@/app/_components/locale-root";
import { getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";

import { tasksBundle, tasksMessages } from "./_components/messages.server";
import { localizeTasks } from "./_components/task-titles.server";
import { Tasks } from "./_components/tasks";

export const generateMetadata = () => pageMetadata("/dashboard/tasks", tasksMessages);

export default async function Page() {
  const locale = await getLocale();
  const text = tasksMessages[locale];

  return (
    <LocaleBundles bundles={[tasksBundle]}>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl tracking-tight">{text.welcome.title}</h2>
          <p className="text-muted-foreground">{text.welcome.subtitle}</p>
        </div>
        <Tasks data={localizeTasks(locale)} />
      </div>
    </LocaleBundles>
  );
}
