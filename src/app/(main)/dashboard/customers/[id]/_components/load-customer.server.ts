import "server-only";

import { cache } from "react";

import { getRuntime } from "@/config/runtime";
import { errorText } from "@/core/i18n";
import { isAwaitingApproval, type ReadStatus, readStateOf } from "@/core/result";
import { type Customer, customerSchema } from "@/modules/customers";
import { customersErrors } from "@/modules/customers/server";

export type LoadedCustomer =
  | { readonly status: "ready"; readonly customer: Customer }
  /** `customers.not_found`: the page renders Next's not-found page. */
  | { readonly status: "missing" }
  /** Any other failure, with the translated reason and the state `ReadState` renders. */
  | { readonly status: "failed"; readonly state: ReadStatus; readonly reason: string | undefined };

/**
 * Reads one customer with `customers.get` for the current actor (ADR 0005). Cached per request, so `generateMetadata`
 * and the page share one read (ADR 0020 §1).
 */
export const loadCustomer = cache(async (id: string): Promise<LoadedCustomer> => {
  const { client, locale } = await getRuntime();
  const answer = await client.call("customers.get", { id });

  if (!isAwaitingApproval(answer) && answer.ok) {
    return { status: "ready", customer: customerSchema.parse(answer.value) };
  }
  if (!isAwaitingApproval(answer) && answer.error.code === "customers.not_found") {
    return { status: "missing" };
  }
  const reason =
    !isAwaitingApproval(answer) && !answer.ok ? errorText(answer.error, customersErrors, locale) : undefined;
  return { status: "failed", state: readStateOf(answer, () => false), reason };
});
