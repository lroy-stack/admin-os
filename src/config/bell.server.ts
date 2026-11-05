import "server-only";

import { z } from "zod";

import { approvalEntrySchema, approvalRows, approvalsErrors, approvalsList } from "@/core/approvals";
import { approvalsMessages } from "@/core/approvals/server";
import { ErrorCodes } from "@/core/errors";
import { type ErrorMessages, errorText, type Locale, type MessageBundle } from "@/core/i18n";
import { type BellRow, type FeedServer, feedUnreadOutput, type ModuleManifest, type ModuleServer } from "@/core/module";
import { pageOutput } from "@/core/pagination";
import { type CallResult, err, isAwaitingApproval, ok, type Result } from "@/core/result";

import { type BellPanel, type BellRequest, bellErrorsKey } from "./bell";
import { MODULES } from "./modules.generated";
import { MODULE_SERVERS } from "./modules.server.generated";
import type { getRuntime } from "./runtime";
import type { WriteCapabilityId } from "./write-action.server";

/**
 * The bell composes feeds (ADR 0017 "The bell"): the kernel's approvals plus the `feeds` of the installed modules.
 * The shell names no module; it reads the generated lists and calls each feed's capabilities by the ids its descriptor
 * gives. Removing a module takes its feed with it and leaves the rest.
 */

/** The rows of the bell's panel per feed: the panel reads them when it opens, so a page view costs no extra read. */
const PANEL_LIMIT = 20;
/** The most `approvals.list` pages in one read. */
const APPROVALS_LIMIT = 50;

/** What the bell needs of a request: a way to call a capability by id, the actor's permissions and the locale. */
export interface BellRuntime {
  readonly call: (id: string, input: unknown) => Promise<CallResult<unknown>>;
  readonly permissions: readonly string[];
  readonly locale: Locale;
}

/** The modules a bell is composed from: the installed ones, unless a test composes its own. */
export interface BellModules {
  readonly manifests: readonly ModuleManifest[];
  readonly servers: readonly ModuleServer[];
}

/** The bell's view of a request's runtime (`getRuntime`). */
export const bellRuntimeOf = ({
  client,
  actor,
  locale,
}: Pick<Awaited<ReturnType<typeof getRuntime>>, "client" | "actor" | "locale">): BellRuntime => ({
  call: (id, input) => client.call(id as never, input as never),
  permissions: actor.permissions,
  locale,
});

const INSTALLED: BellModules = { manifests: MODULES, servers: MODULE_SERVERS };

/** A feed the actor may read, with its server half. */
interface VisibleFeed {
  readonly feed: string;
  readonly list: string;
  readonly unread: string;
  readonly server: FeedServer;
}

const visibleFeeds = ({ permissions }: BellRuntime, { manifests, servers }: BellModules): VisibleFeed[] =>
  manifests.flatMap((manifest) =>
    (manifest.feeds ?? []).flatMap(({ feed, list, unread }) => {
      const server = servers.find(({ id }) => id === manifest.id)?.feeds?.[feed];
      const may = [list, unread].every((id) => {
        const capability = manifest.capabilities[id];
        return capability !== undefined && permissions.includes(capability.permission);
      });
      return server !== undefined && may ? [{ feed, list, unread, server }] : [];
    }),
  );

const mayReview = ({ permissions }: BellRuntime): boolean => permissions.includes(approvalsList.permission);

/** What a read answered, parsed with the schema it promises; a failure keeps its code. */
function answerOf<S extends z.ZodType>(answer: CallResult<unknown>, schema: S, from: string): Result<z.output<S>> {
  if (isAwaitingApproval(answer)) return err(ErrorCodes.unavailable, `${from} cannot wait for approval`);
  if (!answer.ok) return answer;
  const parsed = schema.safeParse(answer.value);
  return parsed.success ? ok(parsed.data) : err(ErrorCodes.invalidOutput, `${from} answered an unexpected value`);
}

const approvalsPage = pageOutput(approvalEntrySchema);

/**
 * The error texts of the panel's actions: the kernel's approvals, the modules that declare feeds and the modules that
 * write, since a write an assistant holds fails with its own module's code when it is decided (`bookings.start_passed`).
 */
export function bellErrors({ manifests, servers }: BellModules = INSTALLED): Readonly<Record<Locale, ErrorMessages>> {
  const speaking = manifests.filter(
    ({ feeds, capabilities }) =>
      (feeds ?? []).length > 0 || Object.values(capabilities).some(({ effect }) => effect !== "read"),
  );
  const own = servers.filter(({ id }) => speaking.some((manifest) => manifest.id === id));
  const merged = (locale: Locale): ErrorMessages =>
    Object.assign({}, approvalsErrors[locale], ...own.map(({ errors }) => errors?.[locale]));
  return { en: merged("en"), es: merged("es"), de: merged("de"), fr: merged("fr") };
}

/** The bell's error texts as a bundle, for the layout to deliver to the panel. */
export const bellErrorsBundle: MessageBundle<ErrorMessages> = {
  key: bellErrorsKey,
  dictionary: bellErrors(),
};

/**
 * The actor's unread count for the bell: the sum of what answered. Undefined when there is nothing for them to read,
 * or when nothing answered; one failing feed never hides the bell.
 */
export async function bellUnread(
  runtime: BellRuntime,
  installed: BellModules = INSTALLED,
): Promise<number | undefined> {
  const feeds = visibleFeeds(runtime, installed);
  const reviews = mayReview(runtime);
  const counts = await Promise.all([
    ...(reviews
      ? [
          runtime.call("approvals.list", { limit: APPROVALS_LIMIT }).then((answer) => {
            const page = answerOf(answer, approvalsPage, "approvals.list");
            return page.ok ? page.value.items.filter(({ status }) => status === "pending").length : undefined;
          }),
        ]
      : []),
    ...feeds.map(async ({ unread }) => {
      const count = answerOf(await runtime.call(unread, {}), feedUnreadOutput, unread);
      return count.ok ? count.value.unreadCount : undefined;
    }),
  ]);
  const answered = counts.filter((count) => count !== undefined);
  return answered.length === 0 ? undefined : answered.reduce((sum, count) => sum + count, 0);
}

/** The sentences the installed modules gave for the writes an assistant asks for, by capability id, in `locale`. */
const approvalSentences = (servers: readonly ModuleServer[], locale: Locale): Readonly<Record<string, string>> =>
  Object.assign({}, ...servers.map(({ approvals }) => approvals?.[locale]));

/**
 * The panel's rows: the approvals that wait for the actor to review, then each feed's page, in module order. A feed
 * that cannot answer adds its worded error to `failures` and keeps the others' rows: a failure is never an empty list.
 */
export async function loadBell(runtime: BellRuntime, installed: BellModules = INSTALLED): Promise<Result<BellPanel>> {
  const feeds = visibleFeeds(runtime, installed);
  const dictionary = installed === INSTALLED ? bellErrorsBundle.dictionary : bellErrors(installed);
  const [approvals, ...pages] = await Promise.all([
    mayReview(runtime) ? runtime.call("approvals.list", { limit: APPROVALS_LIMIT }) : undefined,
    ...feeds.map(({ list }) => runtime.call(list, { limit: PANEL_LIMIT })),
  ]);
  const items: BellRow[] = [];
  const failures: string[] = [];
  const fail = (error: { readonly code: string }) => failures.push(errorText(error, dictionary, runtime.locale));
  if (approvals !== undefined) {
    const page = answerOf(approvals, approvalsPage, "approvals.list");
    if (page.ok) {
      const sentences = approvalSentences(installed.servers, runtime.locale);
      items.push(...approvalRows(page.value.items, approvalsMessages[runtime.locale].bell, runtime.locale, sentences));
    } else fail(page.error);
  }
  for (const [index, feed] of feeds.entries()) {
    const answer = pages[index];
    if (answer === undefined) continue;
    const page = answerOf(answer, z.unknown(), feed.list);
    if (!page.ok) {
      fail(page.error);
      continue;
    }
    const rows = feed.server.rows(page.value, runtime.locale);
    if (rows === undefined) fail({ code: ErrorCodes.invalidOutput });
    else items.push(...rows.map((row) => ({ ...row, feed: feed.feed })));
  }
  return ok({ items, failures });
}

/** What the panel may send: validated here, since a Server Action takes untrusted arguments. */
export const bellRequestSchema = z.discriminatedUnion("op", [
  z.strictObject({ op: z.literal("load") }),
  z.strictObject({ op: z.enum(["read", "readAll"]), feed: z.string().min(1).max(128), input: z.unknown() }),
  z.strictObject({ op: z.enum(["approve", "reject"]), input: z.unknown() }),
]) satisfies z.ZodType<BellRequest>;

/**
 * The capability a write request runs: the named feed's own `read` or `readAll`, from its descriptor, or the kernel's
 * `approvals.approve` and `approvals.reject`. Undefined for a feed no installed module declares.
 */
export function bellWriteOf(
  request: Exclude<BellRequest, { readonly op: "load" }>,
  manifests: readonly ModuleManifest[] = MODULES,
): WriteCapabilityId | undefined {
  if (!("feed" in request)) return `approvals.${request.op}`;
  const descriptor = manifests
    .flatMap((manifest) => manifest.feeds ?? [])
    .find((candidate) => candidate.feed === request.feed);
  return descriptor?.[request.op] as WriteCapabilityId | undefined;
}
