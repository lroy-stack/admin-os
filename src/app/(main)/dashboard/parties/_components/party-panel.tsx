"use client";

import { useMemo } from "react";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale, useMessages } from "@/core/i18n/client";
import { ResponsivePanel, type ReturnFocus } from "@/ds/overlays";

import type { PartyRow } from "./directory-model";
import { partyDirectoryMessageKey } from "./messages";
import { RoleBadges } from "./party-card";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground shrink-0 text-sm">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium break-words">{children}</dd>
    </div>
  );
}

const linkClass = "underline-offset-4 hover:underline focus-visible:underline";

export interface PartyPanelProps {
  party: PartyRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  /** Absent when the actor cannot manage parties: the panel then offers no Edit. */
  onEdit?: () => void;
}

/** Look at a party and act on it (ADR 0015): its fiscal data, a link to reach it and Edit for who may manage parties. */
export function PartyPanel({ party, open, onOpenChange, returnFocus, onEdit }: PartyPanelProps) {
  const text = useMessages(partyDirectoryMessageKey);
  const labels = text.panel;
  const locale = useLocale();
  const country = useMemo(
    () => new Intl.DisplayNames(locale, { type: "region" }).of(party.countryCode) ?? party.countryCode,
    [locale, party.countryCode],
  );

  return (
    <ResponsivePanel
      open={open}
      onOpenChange={onOpenChange}
      returnFocus={returnFocus}
      title={party.legalName}
      description={
        party.tradeName === undefined ? text.kind[party.kind] : `${text.kind[party.kind]} · ${party.tradeName}`
      }
      headerClassName="text-left"
      titleClassName="break-words"
    >
      <dl className="divide-border divide-y px-4">
        <Detail label={labels.taxId}>{party.taxId}</Detail>
        <Detail label={labels.roles}>
          <span className="flex flex-wrap justify-end gap-1.5">
            <RoleBadges roles={party.roles} />
          </span>
        </Detail>
        <Detail label={labels.address}>
          {party.addressLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </Detail>
        <Detail label={labels.country}>{country}</Detail>
        <Detail label={labels.email}>
          <a className={linkClass} href={`mailto:${party.email}`}>
            {party.email}
          </a>
        </Detail>
        {party.phone === undefined ? null : (
          <Detail label={labels.phone}>
            <a className={linkClass} href={`tel:${party.phone}`}>
              {party.phone}
            </a>
          </Detail>
        )}
        {party.notes === undefined ? null : <Detail label={labels.notes}>{party.notes}</Detail>}
      </dl>
      {onEdit === undefined ? null : (
        <div className="mt-auto p-4">
          <Button type="button" variant="outline" className="w-full" onClick={onEdit}>
            <Pencil data-icon="inline-start" />
            {labels.edit}
          </Button>
        </div>
      )}
    </ResponsivePanel>
  );
}
