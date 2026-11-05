"use server";

import { runWrite } from "@/config/write-action.server";

/** Each action is a public endpoint: the capability's own schema validates `input` and its permission gates the call. */
export async function updateContact(input: unknown, attemptKey: unknown) {
  return runWrite("customers.contact.update", input, attemptKey);
}

export async function addNote(input: unknown, attemptKey: unknown) {
  return runWrite("customers.notes.add", input, attemptKey);
}

export async function blockCustomer(input: unknown, attemptKey: unknown) {
  return runWrite("customers.block", input, attemptKey);
}

export async function unblockCustomer(input: unknown, attemptKey: unknown) {
  return runWrite("customers.unblock", input, attemptKey);
}
