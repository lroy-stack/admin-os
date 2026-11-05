"use server";

import { runWrite } from "@/config/write-action.server";

export async function createParty(input: unknown, attemptKey: unknown) {
  return runWrite("parties.create", input, attemptKey);
}

export async function updateParty(input: unknown, attemptKey: unknown) {
  return runWrite("parties.update", input, attemptKey);
}
