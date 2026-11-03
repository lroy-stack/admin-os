"use client";

import { useState } from "react";

import { Download, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurrency, useMessages } from "@/core/i18n/client";
import { type TeamMemberId, team } from "@/data/crm";
import { CardIconButton, FilterChip, SearchCapsule, SegmentedControl, type SegmentedOption } from "@/ds/components";
import { getCustomer, type OpenDeal, openStages } from "@/lib/crm";
import { downloadCsv, toCsv } from "@/lib/csv";

import { addOutcome, resolveDeals } from "../../_components/deal-state";
import { DealWindowsProvider, useDealWindows } from "../../_components/deal-windows";
import { useDealsState } from "../../_components/deals-session";
import { MemberAvatar } from "../../_components/member-avatars";
import { dashboardMessageKey } from "../../_components/messages";
import { DEALS_EXPORT_FILE, dealCsvColumns } from "./deal-export";
import { DealsTable } from "./deals-table";
import { crmMessageKey } from "./messages";
import { OutcomeColumn } from "./outcome-column";
import { PipelineColumn } from "./pipeline-column";

type View = "board" | "list";

type Outcome = { count: number; value: number };

type PipelineProps = { deals: OpenDeal[]; outcomes: { won: Outcome; lost: Outcome } };

/** The Pipeline on the session's deals (demo-local), with the windows every deal opens. */
export function DealPipeline(props: PipelineProps) {
  return (
    <DealWindowsProvider>
      <PipelineBoard {...props} />
    </DealWindowsProvider>
  );
}

function PipelineBoard({ deals: given, outcomes: givenOutcomes }: PipelineProps) {
  const text = useMessages(crmMessageKey);
  const stageNames = useMessages(dashboardMessageKey).stages;
  const currency = useCurrency();
  const windows = useDealWindows();
  const session = useDealsState();
  const resolved = resolveDeals(given, session, true);
  const deals = resolved.open;
  const outcomes = {
    won: addOutcome(givenOutcomes.won, resolved.won),
    lost: addOutcome(givenOutcomes.lost, resolved.lost),
  };
  const viewOptions: SegmentedOption<View>[] = [
    { value: "board", label: text.view.board },
    { value: "list", label: text.view.list },
  ];
  const [view, setView] = useState<View>("board");
  const [query, setQuery] = useState("");
  const [owners, setOwners] = useState<ReadonlySet<TeamMemberId>>(new Set());

  const normalizedQuery = query.trim().toLowerCase();
  const visibleDeals = deals.filter((deal) => {
    const matchesOwner = owners.size === 0 || deal.ownerIds.some((id) => owners.has(id));
    const haystack = `${deal.title} ${getCustomer(deal.customerId).company}`.toLowerCase();
    return matchesOwner && (!normalizedQuery || haystack.includes(normalizedQuery));
  });

  function toggleOwner(id: TeamMemberId) {
    setOwners((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchCapsule
          label={text.searchLabel}
          placeholder={text.searchPlaceholder}
          value={query}
          onValueChange={setQuery}
        />
        <ul className="flex flex-wrap items-center gap-1.5" aria-label={text.ownerFilter}>
          {team.map((member) => (
            <li key={member.id}>
              <FilterChip
                pressed={owners.has(member.id)}
                onPressedChange={() => toggleOwner(member.id)}
                leading={<MemberAvatar id={member.id} />}
              >
                {member.name.split(" ")[0]}
              </FilterChip>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 lg:ml-auto">
          <SegmentedControl label={text.view.label} value={view} options={viewOptions} onValueChange={setView} />
          <CardIconButton
            icon={Download}
            label={text.exportDeals}
            className="liquid-glass size-9 ring-0"
            onClick={() =>
              downloadCsv(DEALS_EXPORT_FILE, toCsv(visibleDeals, dealCsvColumns(text.csv, stageNames, currency)))
            }
          />
          <Button
            className="liquid-glass-brand h-9 rounded-full px-4"
            onClick={(event) => windows.openCreate(undefined, event.currentTarget)}
          >
            <Plus data-icon="inline-start" />
            {text.newDeal}
          </Button>
        </div>
      </div>

      {view === "board" ? (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0 lg:grid lg:grid-cols-[repeat(4,minmax(0,1fr))_6rem] lg:overflow-visible">
          {openStages.map((stage) => (
            <PipelineColumn key={stage} stage={stage} deals={visibleDeals.filter((deal) => deal.stage === stage)} />
          ))}
          <OutcomeColumn won={outcomes.won} lost={outcomes.lost} />
        </div>
      ) : (
        <DealsTable deals={visibleDeals} />
      )}
    </div>
  );
}
