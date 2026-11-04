# ADR 0005 — Data seam: capability descriptors, a typed server client, and a swappable mock adapter

Status: accepted (owner, 2026-10-31) · Date: 2026-10-31 · Related: ADR 0003, 0004, 0006

## Context

**What the reference console does:**

- Every operation is a capability `{id, input zod, output zod, permission, effect, hitl?}`. Screens are Server
  Components that read with `sdk.call(id, input)`; writes go through `'use server'` actions
  (`apps/console/CLAUDE.md`).
- **Results.**
  - Expected failures are `Result<T, DomainError>` (`packages/contracts/src/result.ts`).
  - A write held for approval returns `{status: 'awaiting_approval', approvalId}`
    (`packages/client-runtime/src/actions/create-capability-action.ts:33`).
- **Lists** page by cursor: `{cursor?, limit}` in, `{items, nextCursor}` out, `MAX_PAGE_LIMIT = 200`
  (`packages/contracts/src/pagination.ts`).
- **Screens never render the server's `message`.** `textoDelError` maps the error code
  (`apps/console/src/i18n/errores.ts`).
- **Gotcha:** a `'use server'` module that imports another one, or exports a non-async function, compiles but
  fails at runtime (`apps/console/CLAUDE.md`).

**What this repo does today:**

- **85 client components under `src/app` hold in-memory mock arrays.**
  - The pages are mostly Server Components that import mock modules directly; for example `crm/page.tsx` imports
    `openDeals` from `@/lib/crm`.
  - Each route ships its own data file (`kanban/_components/data.ts`, `bookings/_components/reservations-data.ts`).
- **The room plan persists in localStorage** (`bookings/_components/floor/use-floor-plan.ts`).
- **There is no seam.** Porting a screen would mean rewriting every data import.

**Platform facts:**

- The Next 16 guide recommends a server-only Data Access Layer that returns DTOs
  (`node_modules/next/dist/docs/01-app/02-guides/data-security.md` §Data Access Layer).
- `refresh()` from `next/cache` refreshes the router from a Server Action (`03-api-reference/04-functions/refresh.md`).
- The Server Action body limit is 1 MB by default.
- **Deployment:**
  - `next start` locally;
  - OpenNext on Cloudflare for previews (`package.json` `deploy`), where server memory is per isolate;
  - `next.config.mjs` sets `compiler.removeConsole` in production.

## Options considered

1. **Client seam.** Client components call a browser data client; the mock store lives in zustand and localStorage.
   - *Pros:* closest to today's code; pages stay static; demo state is per visitor for free.
   - *Cons:*
     - reads happen in the client, so porting to the reference console (RSC reads, Server Action writes) rewrites every screen;
     - permission filtering lands after hydration, so hidden entries flash, which breaks "hide, don't disable";
     - a real adapter cannot hold credentials in the browser.
   - *Effort / reversal:* S / L.
2. **Server seam (chosen).** RSC reads go through a server-only client, writes go through route Server Actions, and
   a mock adapter runs on the server with a per-session in-memory store.
   - *Pros:* the same shape as the reference console, so the port swaps one adapter.
   - *Cons:* the dashboard renders dynamically; mock state lives per server process or isolate.
   - *Effort / reversal:* M / M.
3. **Isomorphic seam.** One client on both sides; mock writes run in the browser and overlay server reads.
   - *Cons:* two sources of truth, and reconciliation code that exists only for the mock.
   - *Effort / reversal:* L / M.

## Decision

Option 2.

### Contract (`src/core`)

The shape is copied from `a shared contracts package`, so the port can re-export it:

```ts
// src/core/result — identical to a shared result contract
export interface DomainError { readonly code: string; readonly message: string; readonly details?: Readonly<Record<string, unknown>> }
export type Result<T, E = DomainError> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
export interface AwaitingApproval { readonly status: "awaiting_approval"; readonly approvalId: string }
export type CallResult<T> = Result<T> | AwaitingApproval; // = the reference console's SdkCallResult

// src/core/capability
export interface Capability<Id extends string, I extends z.ZodType, O extends z.ZodType> {
  readonly id: Id;                       // "customers.profile.get" — `<module>.<entity>.<verb>`
  readonly input: I;
  readonly output: O;
  readonly permission: Permission;       // "read:customers" (ADR 0006)
  readonly effect: "read" | "write" | "destructive";
  readonly approval?: (input: z.output<I>) => boolean; // mock HITL rule; absent = never
}

// src/core/client
export interface DataClient<C extends Catalog> {
  call<Id extends keyof C & string>(
    id: Id,
    input: z.input<C[Id]["input"]>,
    options?: { idempotencyKey?: string; signal?: AbortSignal },
  ): Promise<C[Id]["effect"] extends "read" ? Result<z.output<C[Id]["output"]>> : CallResult<z.output<C[Id]["output"]>>>;
}
export interface Adapter { dispatch(capability: AnyCapability, input: unknown, context: CallContext): Promise<CallResult<unknown>> }
```

- **Modules declare their capabilities** in their `index.ts` (ADR 0003).
- **`src/config/catalog.ts` merges them** into one `Catalog`. `client.call("customers.profile.get", input)` is
  then typed end to end, with the same call syntax as `sdk.call`.
- **No per-capability wrapper functions.** The typed `call` replaces the `_lib/capabilities.ts` wrappers that
  spec D2 sketched.

### Client pipeline (`createClient(catalog, adapter)`)

1. **Validate the input** with zod. A failure returns `schema.invalid_input`.
2. **Dispatch** with `AbortSignal.timeout` (8 s by default). A timeout returns `transport.timeout`.
3. **Validate the output** with zod.
   - In development a failure **throws**, so the overlay shows the capability id.
   - In production it returns `schema.invalid_output` and logs.
4. **Retry policy.**
   - A read is retried once, with jittered backoff of about 300 ms, on `transport.*`.
   - A write is never retried unless it carries an `idempotencyKey`: one key per form attempt, renewed only after a
     response (the reference console's `nuevaClaveIdempotencia`). The mock adapter de-duplicates by key.

### Error codes (`src/core/errors`)

**Shape.** Codes are namespaced `<module>.<reason>`. Screens map them to text by code and class (ADR 0007); the
`message` is for logs only.

| Class (code suffix) | Meaning | Typical UI |
| --- | --- | --- |
| `forbidden` (also `access.forbidden` from the seam) | The actor lacks the permission | Hide; at page level, a "no access" state, or `notFound()` for elevated pages (ADR 0006) |
| `not_found` | Missing or deleted record | Empty or "no longer exists" state |
| `invalid`, `required` (`schema.invalid_input`) | Rejected input; `details` carry the field paths | Field errors |
| `conflict` | Version or overlap clash (for example a table already taken) | Inline with a retry or reload |
| `unavailable`, `timeout` (`transport.*`) | Adapter down or slow | Retry banner |
| `invalid_output` (`schema.invalid_output`) | Contract drift | Generic error with the code |

**Approval and legal details:**

- **Approval is not an error.** `AwaitingApproval` renders the `AwaitingApproval` banner, and the pending item
  appears in the notification feed (ADR 0006).
- **Rule violations travel as data.** They come in `details.violations[{ruleId, severity, params}]`, and the module
  composes the sentence (the reference console's legal-violation pattern).

### Pagination

`src/core/pagination` is a port of the reference console's `pagination.ts`:

- input `pageInput({defaultLimit, maxLimit})`, output `pageOutput(item)`;
- a ceiling of 200 items per page and an opaque cursor of at most 512 characters;
- the mock encodes `{o: offset}` as base64url;
- `collectPages()` fails closed with `seam.list_too_long`.

Every list capability paginates.

### Mock adapter

**The dispatcher.** `src/core/mock` exposes it on its server entry. It mirrors the reference console's kernel:

1. resolve the handler;
2. check the permission against the actor (`access.forbidden`);
3. apply the approval rule: store a pending approval and return `AwaitingApproval`;
4. run the handler `(input, {actor, clock, settings, store})`;
5. return the `Result`.

**Where the mock code lives:**

- **Handlers** live in each module's server entry (`src/modules/<m>/server.ts`, in `mock/`) and act on that
  module's store slice.
- **Seeds** come from the active preset's `server.ts` (ADR 0004).
- **`src/config/data.server.ts` wires them** with `createMockAdapter({handlers, seed, roles})`.

**Per-session store.**

- Reads without a session cookie see the immutable seed.
- The first write, a Server Action, sets the `studio_demo_session` cookie and creates a session copy: an LRU of 100
  sessions with a 2-hour TTL.
- A "Reset demo data" action drops the copy.
- One visitor never sees another's edits, which also protects the public demo from defacement.
- **Durable store** (`DATA_STORE=durable`, the public demo's setting). The copy lives in a SQLite-backed Durable Object
  of its own Worker (`workers/demo-store`), one per `vertical:sessionId`, so every isolate and the MCP door see the
  same state. The mock kernel runs inside the object; the caller sends `dispatch(capabilityId, input, ctx)`. The
  object resets to the seed when its `schemaVersion` changes, refuses a caller whose catalogue differs from its own,
  keeps at most 200 replay records and 50 pending approvals, and deletes itself two hours after its last write.
  `clock.get` and `settings.values.get` do not depend on the session and are served in process; a visitor without a
  session never touches the object. The `demo_sid` cookie is `<uuid>.<HMAC-SHA-256>` signed with
  `DEMO_SESSION_SECRET` (the older unsigned `demo_session` is ignored), so an id this server did not issue never names an object; "Reset demo data" deletes the
  cookie and the next write starts a new object (the old one expires on its alarm). Without the variable the in-memory
  store is unchanged. With `DEMO_COOKIE_DOMAIN` set, `demo_sid` and `demo_role` carry that `Domain`, so a
  subdomain reads the same visitor; unset, they stay host-only.

**Every state is reachable.**

- `MOCK_FAULTS` (environment variable, or a demo-only cookie) forces codes or latency per capability, for example
  `customers.profile.get=not_found,bookings.list=latency:1500`.
- The business clock is a capability (`clock.get`) that returns
  `{businessDay, today, nowMin, cutoffMin, timeZone}`. It is fixed by the preset seed so server and client renders
  match. `MOCK_CLOCK=live` switches to real time.

### Reads go through RSC

- **`page.tsx` stays a Server Component** (AGENTS.md rule 5).
  - It gets the request runtime (`getRuntime()` in `src/config`: client, actor, locale, preset, clock; wrapped in
    `React.cache`).
  - It calls the capabilities in parallel, renders error states by code, and passes **DTOs** to client components.
- **Each gated widget sits in its own `Suspense`.**
- **Reads that start in the client** (load more, search as you type) go through route Server Actions that call the
  same `client.call`.
- **Client components never import an adapter or a module's `server.ts`.** `server-only` and Biome enforce it
  (ADR 0003).

### Writes go through Server Actions

- **Route `actions.ts`.** It carries `'use server'` at the top, every export is `async`, and it imports no other
  `'use server'` file (the reference console's gotcha). Each action is thin: `call(...)`, then `refresh()` on `ok`.
- **The client handles the result.** It calls the action inside `useTransition` and handles `CallResult`:
  - `ok`: update local state and show `toastWithUndo`;
  - `awaiting_approval`: show the banner;
  - `error`: show the error text by code.

  Applying the returned value locally keeps the session coherent even if the next request lands on another isolate.
- **Uploads use a Route Handler**, because Server Actions are capped at 1 MB.
- **The room plan's localStorage persistence** (`use-floor-plan.ts`) stays until S3b, then moves to the
  `resources.plan.get` and `resources.plan.update` capabilities (ADR 0004).

### Swap path to a real backend

- **The switch.** `DATA_ADAPTER=mock` (the default) is chosen in `src/config/data.server.ts`. Another value selects
  another `Adapter`; screens, routes and modules do not change.
- **The the reference console adapter is never part of this repo,** which keeps it generic. It lives in the reference console's console and maps
  each kit capability to an the reference console capability id with a pure output mapper (an identity mapper where shapes match).
  The kit's output schemas then validate the mapped result.
- **The spike of ADR 0004 measures that mapping** on two capabilities.

### Observability

- **One structured log line per call:**
  `{capability, effect, status, code, durationMs, correlationId, actorRole}`. Inputs and personal data are never
  logged.
- **Correlation:** the id comes from a per-request `crypto.randomUUID()` in `getRuntime()` and is passed to the
  adapter as context.
- **Production logging:** `removeConsole` would strip these logs, so `next.config.mjs` changes to
  `removeConsole: { exclude: ["error", "warn"] }`, or the logs route through one logger.

## Consequences

- **The dashboard renders dynamically.** It reads cookies (session, role, locale, preset). That is normal for an
  authenticated app; the `(external)` landing stays static.
- **Demo state can reset on Cloudflare.** On cold start, or when a request hits another isolate, a session copy can
  disappear. Screens keep the returned values; the docs say "demo data may reset".
- **The current mock files migrate when their slice touches them:** `_components/*-data.ts`, `src/data/crm.ts`.
  Untouched template-demo pages keep their files.
- **Reversal costs medium.** Screens are shaped as RSC reads plus actions; this is deliberate, because it matches
  the reference console.
- **First spike:** deploy one write → read → navigate cycle to the Cloudflare preview and count session losses
  over 50 navigations.
- **Revisit when:**
  - **sessions are lost often:** more than about 1 navigation in 20 in a 5-minute demo. Then back the mock store
    with a Durable Object or KV binding;
  - **the reference console's console moves reads to the client.**

## Update 2026-10-31: the mock adapter as built (T5)

- **Kernel capabilities.** `clock.get` lives in `src/core/clock` and `access.me.get` in `src/core/access`. Their
  modules (`access`, `clock`) are kernel modules: every role holds `read:clock` and `read:access` whatever the preset
  enables, and they grant no business data.
- **Clock seed.** Each preset's `server.ts` exports a `ClockSeed` (`businessDay`, `nowMin`, `cutoffMin`,
  `timeZone`) next to its seed collections. `fixedClock` freezes it; `MOCK_CLOCK=live` uses `liveClock` in the same
  time zone and cut-off.
- **Handlers.** Each module exports `<module>MockHandlers` from `mock.ts` through its server entry, registered with
  `mockHandler(capability, run)` so the handler's input is the capability's parsed input. `src/config/data.server.ts`
  merges them with `kernelMockHandlers`, and a contract test fails when a catalogue capability has no handler or its
  output breaks the schema for any preset.
- **Cookies** (no `studio_` prefix): `demo_sid` (httpOnly, signed; started by `ensureDemoSession()` in a Server
  Action before the first write; the cookie functions live in `src/config/demo-session.server.ts` so the adapter
  wiring has no `next/headers` import, ADR 0009), `demo_role` (role switch; an unknown value falls back to `owner`) and
  `mock_faults` (a visitor's faults in the `MOCK_FAULTS` grammar; a malformed cookie is ignored, while a malformed
  environment value fails loudly).
- **Writes without a session** return `transport.unavailable` with an actionable message instead of touching the
  shared seed. Keyed writes replay their first result per session, and approval-gated writes are stored as pending
  approvals on the session.
- **Lists** page with `paginate(items, page)` from `src/core/pagination` (the base64url `{o}` cursor). A cursor that
  does not decode is `schema.invalid_input`.

## Update 2026-11-03: capability descriptor v2

- **Descriptor.** `Capability` gains `riskTier` (required), `mayRequireApproval?` and `requiresIdempotencyKey?`, and
  `approval(input, context)` now receives an `ApprovalContext` (`{ via: "ui" | "mcp" | "system" }`). Tiers: 0 non-personal
  read · 1 personal read or self-scoped write · 2 business write · 3 irreversible, money or legal.
- **Client.** `createClient` takes `via` (default `"ui"`; the MCP wiring passes `"mcp"`) and forwards it to the adapter in
  `CallContext`. A call to a capability with `requiresIdempotencyKey` and no key is refused before dispatch with
  `client.idempotency_required` (class `invalid`). Call log lines carry `riskTier` and `via`.
- **MCP.** Each tool's `_meta` carries `riskTier`.
- **Invariants** (contract test over `CATALOG`, `src/config/contracts.test.ts`): a read has tier 0 or 1 and no approval
  rule · tier 3 implies destructive · destructive implies tier 2 or 3 · `approval` is defined exactly when
  `mayRequireApproval` is true · `requiresIdempotencyKey` implies not a read.
- **Amended 2026-11-04 (spec 004 U1, U2).** Every write declares `change` (`add`, `set`, `overwrite` or `remove`) and
  `idempotency` (`key` or `target-state`), and a read declares neither. `key` goes exactly with
  `requiresIdempotencyKey`, and an `add` is `key` (ADR 0016, D6). Set-state writes no longer require a key; the UI
  still sends its attempt key, which replays as before.

## Amendment 2026-11-04: the demo store moves into a Durable Object; approvals become a policy (ADR 0016)

- **Why.** The "sessions are lost often" revisit condition above has fired. On production on 2026-11-03, one
  `customers_create` followed by 12 `customers_list` calls saw the new customer once (spec 004). The web demo's Server
  Actions share the same in-process stores (`src/config/data.server.ts:52`), so the screens are affected too. Spike S0
  measured the replacement: 12 of 12 reads in both directions, and 20 parallel writes with one key applied once
  (ADR 0016, D1 and D2).
- **The per-session store moves into a Durable Object.** On Workers, each demo session is one `DemoStore` object,
  named `vertical:sessionId`, in its own Worker, `workers/demo-store`. The object runs this ADR's mock kernel
  (`createMockAdapter`) inside it. The web app and the MCP Worker reach it through a durable `Adapter` bound by
  `script_name`, so the `Adapter` contract, the screens, the routes and the modules do not change. Tests and stdio
  keep the in-memory store.
- **What changes in "Per-session store".**
  - Reads without a session still see the immutable seed. They are served in process, with no Durable Object request.
  - The LRU of 100 sessions goes, because each session is its own object. The 2-hour TTL becomes an idle alarm that
    deletes the object.
  - The session's data, its keyed replays (bounded) and its pending approvals persist in the object's storage (SQLite
    backend).
  - `demo_sid` is signed with HMAC and carries its issue time. An unsigned, forged or expired value starts a new session.
  - Writes without a session still answer `transport.unavailable`.
- **The consequence "Demo state can reset on Cloudflare" is replaced.** A session now resets after 2 hours idle, on
  "Reset demo data", or when the store's snapshot schema changes. Screens keep applying the returned values, which is
  still good practice, but this no longer stands in for consistency.
- **Approvals become a policy (ADR 0016, D7).** The policy, not a per-capability predicate, decides which writes wait
  for a person. It is a UI-only, elevated setting with a safe default, and it decides by risk tier and sensitivity, not
  only by `destructive`.
  - Approvals expire after 24 hours.
  - An approval is revalidated when it is approved, and answers `conflict` if the state moved.
  - Approvals are audited: who asked, and who decided.
  - `AwaitingApproval` is unchanged, and a person resolves it in the web app.
  - How descriptor v2's `approval` and `mayRequireApproval` feed the policy, or give way to it, is decided by plan H1a,
    and the descriptor invariant changes with it.
