"use server";

import { getRuntime } from "@/config/runtime";
import { runWrite } from "@/config/write-action.server";
import { isAwaitingApproval } from "@/core/result";
import { customersDuplicatesCheck } from "@/modules/customers";

import type { DuplicateMatch } from "./_components/duplicate-model";

export async function createContact(input: unknown, attemptKey: unknown) {
  return runWrite("customers.create", input, attemptKey);
}

/**
 * The contacts that share a phone or an email with a form being filled in, for the notice of the New contact window.
 * A read, so it neither starts the demo session nor refreshes the page; the capability validates `input` and gates it
 * on `read:customers`. Only the id, name and matched detail reach the browser. A failed or refused check answers with
 * no matches: the notice is advice, and `customers.create` still refuses a duplicate.
 */
export async function findDuplicateContacts(input: unknown): Promise<DuplicateMatch[]> {
  const { client } = await getRuntime();
  const answer = await client.call("customers.duplicates.check", input as never);
  if (isAwaitingApproval(answer) || !answer.ok) return [];
  const found = customersDuplicatesCheck.output.safeParse(answer.value);
  if (!found.success) return [];
  return found.data.matches.map(({ customer, matchedOn }) => ({ id: customer.id, name: customer.name, matchedOn }));
}
