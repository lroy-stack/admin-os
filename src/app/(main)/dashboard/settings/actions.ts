"use server";

import { runWrite } from "@/config/write-action.server";

/** Saves the business details of the Edit window through `settings.values.update` (owner only, spec 008). */
export async function updateBusinessDetails(input: unknown, attemptKey: unknown) {
  return runWrite("settings.values.update", input, attemptKey);
}
