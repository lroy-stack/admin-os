"use client";

import { useMemo } from "react";

import { siNextdotjs, siNodedotjs, siReact, siRemix } from "simple-icons";
import { toast } from "sonner";

import { format, useLocale, useMessages } from "@/core/i18n/client";
import { ConfirmAction } from "@/ds/overlays";

import type { ShowcaseField, ShowcaseValues } from "../../_components/showcase-form";
import { ShowcaseFormDialog } from "../../_components/showcase-form-dialog";
import { useOpenWindow } from "../../_components/use-open-window";
import {
  type EnvironmentKind,
  type InfrastructureEnvironment,
  type InfrastructureGroup,
  infrastructureGroups,
} from "./infrastructure-data";
import { facetOptions, filterGroups, withAdded } from "./infrastructure-filter";
import { useInfrastructure } from "./infrastructure-state";
import { infrastructureMessageKey } from "./messages";
import { ProjectEnvironments } from "./project-environments";

const PLATFORMS = [
  { name: "Next.js", icon: siNextdotjs },
  { name: "React", icon: siReact },
  { name: "Remix", icon: siRemix },
  { name: "Node.js", icon: siNodedotjs },
] as const;

const COUNTRIES = ["DE", "NL", "EE", "FR", "ES", "US"] as const;
const CUSTOM = "custom";
const KINDS: readonly EnvironmentKind[] = ["production", "staging", "expired"];

/** What a new environment reports before the monitor has seen it: online, no history, light resources. */
function newEnvironment(values: ShowcaseValues, platformIcon: InfrastructureEnvironment["platform"]) {
  const environment = KINDS.find((kind) => kind === values.environment) ?? "staging";
  const server = values.server === CUSTOM ? null : values.server;
  return {
    domain: values.domain,
    platform: platformIcon,
    environment,
    status: "online",
    latencyMs: 80,
    uptime: { days: 0, hours: 0 },
    server,
    countryCode: values.country,
    plan: values.region,
    resources: { cpu: 5, ram: 8, disk: 3 },
  } satisfies InfrastructureEnvironment;
}

/** The project tables, narrowed by the search and facets, and the two windows they open (demo-local). */
export function InfrastructureBoard() {
  const text = useMessages(infrastructureMessageKey);
  const locale = useLocale();
  const { query, facets, added, addEnvironment } = useInfrastructure();
  const adding = useOpenWindow<InfrastructureGroup>();
  const restarting = useOpenWindow<InfrastructureEnvironment>();

  const groups = useMemo(
    () => filterGroups(withAdded(infrastructureGroups, added), { query, facets }, (id) => text.projects[id]),
    [added, query, facets, text.projects],
  );

  const fields: readonly ShowcaseField[] = useMemo(
    () => [
      { name: "domain", label: text.form.domain, kind: "text", required: true },
      {
        name: "platform",
        label: text.form.platform,
        kind: "select",
        options: PLATFORMS.map((platform) => ({ value: platform.name, label: platform.name })),
      },
      {
        name: "environment",
        label: text.table.environment,
        kind: "select",
        options: KINDS.map((kind) => ({ value: kind, label: text.environments[kind] })),
      },
      {
        name: "server",
        label: text.table.server,
        kind: "select",
        options: facetOptions(infrastructureGroups, "cloudProvider").map((value) => ({
          value,
          label: value === CUSTOM ? text.table.customServer : value,
        })),
      },
      {
        name: "country",
        label: text.form.country,
        kind: "select",
        options: COUNTRIES.map((code) => ({ value: code, label: code })),
      },
      { name: "region", label: text.form.region, kind: "text", required: true },
    ],
    [text],
  );

  const target = adding.shown?.value;
  const restart = restarting.shown?.value;

  return (
    <>
      <div className="flex flex-col gap-4">
        {groups.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm" role="status">
            {text.noResults}
          </p>
        ) : (
          groups.map((group) => (
            <ProjectEnvironments
              key={group.id}
              group={group}
              onAddEnvironment={(project, opener) => adding.show(project, opener)}
              onRestart={(environment, opener) => restarting.show(environment, opener)}
            />
          ))
        )}
      </div>

      {adding.shown && target ? (
        <ShowcaseFormDialog
          key={adding.shown.opening}
          open={adding.shown.open}
          onOpenChange={adding.onOpenChange}
          title={text.project.addEnvironment}
          description={format(text.form.description, locale, { project: text.projects[target.id] })}
          verb={text.project.addEnvironment}
          fields={fields}
          errors={{ required: text.form.required }}
          returnFocus={adding.returnFocus}
          onSave={(values) => {
            const platform = PLATFORMS.find((item) => item.name === values.platform) ?? PLATFORMS[0];
            addEnvironment(target.id, newEnvironment(values, platform));
            toast.success(
              format(text.form.added, locale, { domain: values.domain, project: text.projects[target.id] }),
            );
          }}
        />
      ) : null}

      {restarting.shown && restart ? (
        <ConfirmAction
          open={restarting.shown.open}
          onOpenChange={restarting.onOpenChange}
          returnFocus={restarting.returnFocus}
          verb={text.restart.verb}
          title={format(text.restart.title, locale, { domain: restart.domain })}
          consequence={text.restart.consequence}
          onConfirm={async () => {
            toast.success(format(text.restart.done, locale, { domain: restart.domain }));
            return { status: "ok" };
          }}
        />
      ) : null}
    </>
  );
}
