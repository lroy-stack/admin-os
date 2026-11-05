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
