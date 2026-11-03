import { z } from "zod";

import { CRM_AS_OF, customers, type OpenStage, team } from "@/data/crm";
import type { OpenDeal } from "@/lib/crm";
import { openStages } from "@/lib/crm";

import type { DealFields } from "./deal-state";

/** The errors the schema reports, already translated. */
export interface DealFormErrors {
  readonly titleRequired: string;
  readonly customerRequired: string;
  readonly valueInvalid: string;
  readonly stageInvalid: string;
  readonly closeDateInvalid: string;
  readonly ownersRequired: string;
}

const customerIds = customers.map((customer) => customer.id);
const memberIds = team.map((member) => member.id);

/**
 * The New deal and Edit deal form. The value is typed as text and parsed here, so an empty field and a number the
 * input cannot hold are both reported in the dictionary's words.
 */
export function dealFormSchema(errors: DealFormErrors) {
  return z.object({
    title: z.string().trim().min(1, errors.titleRequired),
    customerId: z.string().refine((id) => customerIds.includes(id), errors.customerRequired),
    value: z
      .string()
      .trim()
      .min(1, errors.valueInvalid)
      .transform(Number)
      .pipe(
        z.number({ error: errors.valueInvalid }).positive(errors.valueInvalid).max(1_000_000_000, errors.valueInvalid),
      ),
    stage: z.enum(openStages, { error: errors.stageInvalid }),
    closeDate: z.iso.date({ error: errors.closeDateInvalid }),
    ownerIds: z
      .array(z.string())
      .min(1, errors.ownersRequired)
      .refine((ids) => ids.every((id) => memberIds.some((member) => member === id)), errors.ownersRequired),
  });
}

export type DealFormInput = z.input<ReturnType<typeof dealFormSchema>>;
export type DealFormValues = z.output<ReturnType<typeof dealFormSchema>>;

/** A blank form; `stage` presets the column the person clicked + in. */
export function emptyDealForm(stage: OpenStage = "qualification"): DealFormInput {
  return { title: "", customerId: "", value: "", stage, closeDate: CRM_AS_OF, ownerIds: [] };
}

export function dealToForm(deal: OpenDeal): DealFormInput {
  return {
    title: deal.title,
    customerId: deal.customerId,
    value: String(deal.value),
    stage: deal.stage,
    closeDate: deal.closeDate,
    ownerIds: [...deal.ownerIds],
  };
}

/** The parsed form as the fields a deal carries. The schema has checked every id. */
export function formToFields(values: DealFormValues): DealFields {
  const ownerIds = team.map((member) => member.id).filter((id) => values.ownerIds.includes(id));
  return {
    title: values.title,
    customerId: values.customerId,
    stage: values.stage,
    value: values.value,
    closeDate: values.closeDate,
    ownerIds,
  };
}
