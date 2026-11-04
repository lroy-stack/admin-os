"use client";

import { useId } from "react";

import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { PopoverOrSheet } from "@/ds/overlays";

import type { FacetId } from "./infrastructure-filter";
import { useInfrastructure } from "./infrastructure-state";
import { infrastructureMessageKey } from "./messages";

export interface FacetOption {
  readonly value: string;
  readonly label: string;
}

/** One facet of the list: a chip that opens a `PopoverOrSheet` with the values to tick. The list narrows at once. */
export function FacetFilter({ facet, options }: { facet: FacetId; options: readonly FacetOption[] }) {
  const text = useMessages(infrastructureMessageKey).filters;
  const locale = useLocale();
  const { facets, toggleFacet, clearFacet } = useInfrastructure();
  const chosen = facets[facet];
  const name = text[facet];
  const group = useId();

  return (
    <PopoverOrSheet
      title={format(text.title, locale, { facet: name })}
      className="w-64"
      trigger={
        <Button variant="outline">
          <PlusCircle data-icon="inline-start" />
          {chosen.length > 0 ? format(text.withCount, locale, { facet: name, count: chosen.length }) : name}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          {options.map((option) => {
            const id = `${group}-${option.value}`;
            return (
              <Field key={option.value} orientation="horizontal" className="w-auto">
                <Checkbox
                  id={id}
                  checked={chosen.includes(option.value)}
                  onCheckedChange={() => toggleFacet(facet, option.value)}
                />
                <FieldLabel htmlFor={id} className="font-normal">
                  {option.label}
                </FieldLabel>
              </Field>
            );
          })}
        </div>
        <Button variant="ghost" size="sm" disabled={chosen.length === 0} onClick={() => clearFacet(facet)}>
          {text.clear}
        </Button>
      </div>
    </PopoverOrSheet>
  );
}
