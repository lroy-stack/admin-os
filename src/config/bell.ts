import type { ErrorMessages } from "@/core/i18n";
import { type MessageKey, messageKey } from "@/core/i18n/client";
import type { BellRow } from "@/core/module";

/**
 * What the bell's panel sends its one Server Action (`notification-actions.ts`). `load` reads every feed the actor may
 * see; `read` and `readAll` run the named feed's capabilities of that name, from its descriptor; `approve` and
 * `reject` decide a write the kernel's approvals feed shows.
 */
export type BellRequest =
  | { readonly op: "load" }
  | { readonly op: "read"; readonly feed: string; readonly input: unknown }
  | { readonly op: "readAll"; readonly feed: string; readonly input: unknown }
  | { readonly op: "approve" | "reject"; readonly input: unknown };

/** What the panel's `load` answers: the rows of the feeds that answered, and the worded error of each that did not. */
export interface BellPanel {
  readonly items: readonly BellRow[];
  readonly failures: readonly string[];
}

/**
 * The error texts the panel's actions word their failures with: the kernel's approvals plus those of the modules that
 * declare feeds or write what an assistant may hold. Delivered with the layout's bundles, built in `bell.server.ts`.
 */
export const bellErrorsKey: MessageKey<ErrorMessages> = messageKey<ErrorMessages>("bell.errors");
