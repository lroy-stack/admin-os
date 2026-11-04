# ADR 0016 — The MCP server is its own product: a separate Worker over a durable demo store, with scoped access

Status: accepted · Date: 2026-11-04 · Spec: `docs/specs/004-mcp-server/spec.md` (D1–D8, AC1–AC12) · Plan: M0
· Spike: `docs/specs/004-mcp-server/spike-s0.md` (GO) · Amends: ADR 0005, 0009 · Related: ADR 0003, 0006, 0008

## Context

### The problem, measured

Spec 004 holds the evidence: `tools/list` on stdio and on production, and an independent review with real calls on
2026-11-03. In short:

- **Agents cannot write.** 11 of 14 writes require an idempotency key in the request's `_meta`. A model produces only
  `arguments`; `_meta` belongs to the host. The refusal, `client.idempotency_required` (`src/core/client/index.ts:165`),
  does not say how to comply, and the SDK test client injects `_meta`, so the tests never saw it.
- **The writes that work are the sensitive ones.** `customers_update`, `customers_block` and `customers_unblock` need
  no key and no approval. As `staff`, a call set `marketingConsent: true` and cleared an email. No capability declares
  `approval`.
- **Read and write are never separated.** A bearer token is a role with `scopes: []`
  (`src/config/mcp-http.server.ts:58`).
- **State is not consistent on Workers.** Demo sessions live in module memory (`src/config/data.server.ts:52`,
  `src/core/mock/session-store.ts:54`). On production, one `customers_create` followed by 12 `customers_list` calls
  saw the new customer once. The web demo's Server Actions share these stores, so "Add contact" and Walk-in have the
  same defect.
- **Clients never learn about new tools.** `listChanged: false` and a fixed `serverInfo.version`
  (`src/core/mcp/project-catalog.ts:41,172`).
- **Metadata contradicts the specification, and tools carry too much.** Every write advertises
  `destructiveHint: false` and every keyed write `idempotentHint: false` (`project-catalog.ts:55-56`).
  `customers_update` mixes contact data, legal consent and VIP. `customers_list` returns up to 200 full records and
  offers no search.
- **Shared public tokens.** Every holder of a demo token shares its session, so free text written by one client
  reaches another client's agent.
- **Coupling.** The route runs inside the App Router, with the UI's deploy, limits and runtime. stdio needs a
  `server-only` hook and `tsx`.
- **The protocol moved.** Revision 2026-07-28 has no protocol sessions and puts cache hints on `tools/list`; the
  installed SDK 2.4.0 implements it.

H0 (commit 11bbecc, deployed 2026-11-04) made the public demo tokens read-only as a stopgap (ADR 0009, amendment
2026-11-04). This ADR records what replaces it.

### What spike S0 measured (2026-11-04, GO)

Branch `worktree-agent-a6de2c4f5698e2fc9` (a52084a, e6af2a8), local `wrangler dev` 4.156, OpenNext 1.20.15, Next 16.4.3.
The OpenNext Worker, `next dev` and a second Worker all reached one `DemoStore` Durable Object (SQLite backend)
through a binding by `script_name`.

| Question | Measured |
| --- | --- |
| Write through the stub MCP Worker, then 12 web page reads | 12 of 12 |
| Web Server Action write, then 12 stub reads | 12 of 12 |
| `next dev` Server Action write, read by the stub | seen (needs `initOpenNextCloudflareForDev()` behind `DATA_STORE=durable`) |
| Restart with `--persist-to` | the write survives; an unseen session still sees the seed |
| 20 parallel writes with one key | applied once (23 → 24 bookings, one id) |
| 20 parallel writes with 20 keys | 20 applied |
| One key, other input | `client.idempotency_conflict` |
| Dispatch time, local workerd, median of 7 | read 5.9 ms cold, 3.7 ms warm; write 5.6 ms cold, 4.1 ms warm |
| Durable Object calls per `/dashboard/bookings` render | 8 with a session (`clock.get`, `settings.values.get`, `bookings.list`, `resources.list`, `customers.list`, `customers.get` ×4); 0 without |
| Durable Object calls per `/dashboard/customers` render | 1 |
| Session snapshot | up to about 40 KB with about 45 bookings, rewritten on every write |
| Store bundle | 919 KiB raw, 155 KiB gzip; no `next`. React (19 KB of source) and lucide-react (12 KB) arrive through `src/core/i18n/index.ts` and the preset icons |

Topology that works locally: one `wrangler dev` process for the web app and the store, and the MCP Worker in its own
process. Not covered by the spike: the production cold start of a new object, Workers Vitest pool tests, and the
real billing of RPC calls. The billing question is answered below (V1).

### Platform and SDK facts (verified 2026-11-04)

- **Durable Objects on the Free plan (V1).** 100,000 requests a day and 13,000 GB-s a day. Requests include "HTTP
  requests, RPC sessions, WebSocket messages, and alarm invocations"; "Every RPC method call on a Durable Objects stub
  is its own RPC session and therefore a single billed request." Past a free limit, "further operations of that type
  will fail with an error"; the limits reset at 00:00 UTC. SQLite on the Free plan: 5 million rows read and 100,000
  rows written a day, 5 GB stored. Free-plan objects use the SQLite backend only (V2).
- **Workers on the Free plan (V2).** 100,000 requests a day.
- **Streamable HTTP, 2026-07-28 (V3).** "Servers MUST validate the `Origin` header on all incoming connections"; "If
  the `Origin` header is present and invalid, servers MUST respond with HTTP 403 Forbidden." `Mcp-Method` and
  `Mcp-Name` are required on requests, and a server that processes the body must reject a header that does not match
  it (`-32020`).
- **Authorization, 2026-07-28 (S8).** A token with insufficient scope gets `403` with
  `WWW-Authenticate: Bearer error="insufficient_scope", scope=..., resource_metadata=...`. On step-up, clients request
  the union of their previous scopes and the challenged ones. Servers "MUST account for scope hierarchies". Resource
  indicators (RFC 8707) are a MUST. Client ID Metadata Documents are a SHOULD; Dynamic Client Registration is a MAY
  and deprecated.
- **SDK `@modelcontextprotocol/server` 2.4.0, as installed (V5).**
  - `createMcpHandler` is "deliberately validation-free": Origin and Host checks go in front of it
    (`validateOriginHeader`, `originValidationResponse`). A missing `Origin` passes, because non-browser clients do not
    send one. A `null` or unparsable `Origin` is rejected.
  - Per-call scope challenges are resolved only when the factory returns an `McpServer`, from each registered tool's
    `scopeChallenge` (`dist/index.mjs:1194`, `product instanceof McpServer`). The projection returns a low-level
    `Server` (ADR 0009), so it gets no automatic step-up. `bearerAuthChallengeResponse` builds the
    `403 insufficient_scope` answer.
  - `CacheHint` (`ttlMs`, `cacheScope`) applies to `tools/list`.
- **`McpAgent`** is "deprecated and feature-frozen"; Cloudflare asks users to migrate to `createMcpHandler` (S22).
- **Custom Domains** issue a certificate for multi-level subdomains such as `mcp.admin-os.lr0y.dev`, with no separate
  Advanced Certificate Manager subscription (V4).
- **`workers-oauth-provider`** needs a KV namespace bound as `OAUTH_KV`, accepts Client ID Metadata Documents with
  `clientIdMetadataDocumentEnabled`, and accepts only tokens issued for its own resource (S25).

### Quality attributes, ranked

1. **Safety.** No write without a person's explicit grant. Destructive and sensitive writes wait for a person. Text
   one visitor writes never reaches another visitor's agent.
2. **Correctness of state.** One durable state per demo session, the same through both doors. A retried create applies
   once.
3. **Agent usability.** Calls work with arguments alone, errors say how to fix the call, and results are concise.
4. **Separation.** The MCP server builds, deploys and fails without the Next app.
5. **Cost.** The public demo stays on the Workers Free plan.
6. **Latency.** A store call takes single-digit milliseconds (measured locally).

## Options considered

### Where the MCP server runs

1. **MCP inside the web Worker (today: `/api/mcp` in the App Router).**
   - *Pros:* it exists and is tested, and there is one deploy.
   - *Cons:*
     - MCP shares the UI's deploy, CPU limits and runtime, so a UI regression or deploy takes MCP with it;
     - the import chain reaches the i18n provider, which is why stdio needs the `server-only` hook and `tsx`;
     - the OAuth endpoints, rate limits and Origin validation would live inside the App Router;
     - nothing can prove the server is independent of Next, because its bundle is the Next app.
   - *Rejected:* Principle 3 (separate deployable, shared core) cannot be shown.
   - *Effort / reversal:* none / S (plan W3 retires `/api/mcp`).
2. **Its own Worker, `workers/mcp` (chosen, D1).**
   - *Effort / reversal:* M / M.

### Where the demo state lives

1. **The store inside the web Worker**, a Durable Object class exported from the OpenNext Worker.
   - *Pros:* two Workers instead of three.
   - *Cons:*
     - the MCP Worker would bind an object hosted by the web Worker's script, so the MCP deploy would depend on the
       web deploy, and the store's migrations would ride the UI's deploy;
     - `next dev` cannot host the class, because `getPlatformProxy` binds Durable Objects only by `script_name`, so
       local development needs a separate script anyway;
     - the class would ship inside the whole Next bundle.
   - *Rejected:* it rebuilds the coupling that D1 removes.
2. **A blob in storage, read and written on every call (get/put).**
   - *Rejected (D2):* the handlers mutate the session in place and need the object's serialisation. Two isolates that
     read and write one blob lose updates.
3. **`McpAgent`, one Durable Object per MCP session.**
   - *Rejected:* it is deprecated and feature-frozen (S22), and 2026-07-28 removed protocol sessions (S1). The state
     belongs to the demo session, which the web app shares, not to an MCP connection.
4. **The kernel inside one Durable Object per demo session, in its own Worker (chosen, D1 and D2).**
   - *Effort / reversal:* M / M. The durable adapter is one `Adapter` (ADR 0005); going back means losing AC6.

### How read and write are separated

1. **Two servers with two audiences, one for reads and one for writes.**
   - *Cons:*
     - an agent connected to both holds both powers, so the split protects nothing at the client;
     - an operations server cannot find an id without reads, so the write server would carry reads anyway;
     - the MCP authorization specification models one resource with incremental scopes and step-up (S8).
   - *Prior art:* Stripe's MCP is one server with separate read and write tools (S20); GitHub's read-only is a mode of
     one server (S18).
   - *Rejected (D3).*
2. **One resource with scopes `read` and `write`, step-up, and a server-wide read-only switch (chosen, D3).**
   - *Effort / reversal:* M / M. Scopes can be split further later without changing the resource.

### What the MCP layer owns

1. **A manifest that reformulates inputs**, with MCP-specific schemas and renamed or flattened fields.
   - *Cons:*
     - a second definition of every input, which drifts from the UI's validation and error paths;
     - ADR 0009's reason for one catalogue (one rule set, one error vocabulary) is lost;
     - an overloaded capability gets fixed for MCP and stays overloaded for the UI.
   - *Rejected:* Principle 4. An overloaded capability splits in the catalogue instead, so the UI and MCP share the
     split (Principle 2).
2. **A manifest that only selects and presents (chosen, D5).**
   - *Effort / reversal:* S / S.

### How retries are made safe

1. **An idempotency key on every write** (today's model, carried in `_meta`).
   - *Cons:*
     - it is what fails today, because a model produces only `arguments`;
     - moving the key into the arguments of every write still asks the agent to invent a key for operations that are
       already idempotent by their target state, and every extra required field is one more way for a call to fail
       (S16);
     - the key says nothing honest about the operation: `idempotentHint` describes what repeating a call "with the same
       arguments" does (S7).
   - *Rejected (D6).*
2. **Idempotency by operation (chosen, D6).**
   - *Effort / reversal:* S / S.

## Decision

The decisions are the spec's D1–D8, recorded as decided. The deciding factor across them is safety with real agents:
an agent must be able to write with arguments alone, only through a grant a person gave, against state that is the
same through both doors. Section "Shape" turns them into module boundaries and contracts.

### D1 — Two Workers beside the web app, one repository

- **Decision.** `workers/demo-store` (the Durable Object) and `workers/mcp` (the MCP handler), each with its own
  `wrangler.jsonc`. The web Worker and the MCP Worker bind the store by `script_name`. Deploy order: the store, then
  the web app and MCP. A workspace split waits until a second consumer needs it.
- **Rationale.**
  - The store in its own Worker keeps MCP from depending on the web deploy, and lets `next dev` reach it, because
    `getPlatformProxy` binds Durable Objects only by `script_name`.
  - One repository keeps the `@/` aliases: wrangler's esbuild reads the root `tsconfig.json` paths, so the Workers
    import the domain core with no package boundary to maintain (S0, pitfall 2).
  - Cloudflare's own MCP servers are Workers in one repository (S19), on the handler model of S21 and S23.
- **Evidence (S0).** The OpenNext Worker, `next dev` and a second Worker reached one `DemoStore` by `script_name`;
  12 of 12 reads saw the write in both directions; the store bundle is 155 KiB gzip with no `next`.
- **Sources.** S19, S21, S23; spike S0.

### D2 — The kernel runs inside the Durable Object, one object per demo session (`vertical:sessionId`)

- **Decision.** Not a blob get/put: the handlers mutate in place and need the object's serialisation.
  - The `dispatch` RPC carries the catalogue version, and the object holds a `schemaVersion` and resets to the seed
    on mismatch.
  - An alarm deletes the object after 2 hours idle.
  - Replay and approval records are bounded.
  - Storage uses the SQLite backend.
  - Reads without a session serve the seed in process, without a Durable Object request (the Free plan allows
    100,000 a day).
- **Rationale.**
  - A Durable Object is single-threaded for its id, and the kernel awaits nothing but the object's own storage. So
    the in-place mutations, the replay check and the approval queue need no locks.
  - One object per session keeps one visitor's data and load apart from another's.
  - A visitor who never writes has no session, and costs no Durable Object request (S0: 0 calls).
- **The two versions, as the spike built them.**
  - A caller whose catalogue version (a hash of the capability ids and effects) differs from the store's is refused
    with `transport.unavailable` instead of being misread. Schema drift inside one version still fails loudly,
    because both sides validate input and output with zod.
  - A stored snapshot whose `schemaVersion` differs from the code's is discarded, and the session starts again from
    the seed.
- **Evidence (S0).**
  - 12 of 12 reads saw the write in both directions, and the write survived a restart.
  - 20 parallel writes with one key applied once.
  - A warm dispatch took about 4 ms locally.
  - A bookings render costs 8 Durable Object calls with a session and 0 without.
  - The snapshot stays under about 40 KB.
- **Corrections from the spike that this ADR adopts** (plan, phase 1):
  - serve `clock.get` and `settings.values.get` in process, because they do not depend on the session;
  - remove the bookings page's `customers.get` N+1, or add `dispatchMany`, taking a render from 8 calls to 2 or 3;
  - carry `vertical` and `sessionId` in the RPC context, and never read them back from `ctx.id.name`;
  - dispose each RPC stub after the call;
  - sign `demo_session` before the first deploy, because today any string creates an object.
- **Sources.** S0; V1, V2.

### D3 — One resource, scopes `read` and `write`

- **Decision.**
  - `read` is the default grant.
  - `write` needs its own explicit, revocable consent.
  - Effective permissions are the role ∩ the effects of the granted scopes, in one pure function.
  - A token without `write` never lists a write, and calling one answers `403 insufficient_scope` with
    `scope="write"`.
  - `MCP_READ_ONLY` switches the whole server to read tools.
- **Rationale.** "Options considered" gives the reasons against two audiences. One resource with incremental scopes
  is how the specification models access and step-up (S8). A small default grant is the specification's scope
  minimisation (S11). The read-only switch follows GitHub's read-only mode (S18).
- **Contract.**
  - The `read` scope covers capabilities with effect `read`, and `write` covers `write` and `destructive`. `write`
    is granted only on top of `read`, and the pure function treats `write` as including `read`, because servers must
    account for scope hierarchies (S8).
  - The MCP Worker's gate answers the `403` before the projection runs, with `bearerAuthChallengeResponse`, because
    SDK 2.4.0 answers per-call challenges only for an `McpServer` (V5). The projection applies the same function to
    `tools/list` and to dispatch, so a gate defect fails closed with `access.forbidden`.
  - Under `MCP_READ_ONLY` no scope can help, so a write answers `access.forbidden` with the read-only message (H0),
    never a challenge.
  - `MCP_READ_ONLY` stays on for the public deployment until AC2 and AC3 pass (plan A1b).
- **Sources.** S8, S11, S18, S20; V5.

### D4 — The grant is bound to the demo session

- **Decision.** The consent page reads the visitor's `demo_session` cookie, now signed with HMAC (today any value is
  accepted), and the grant stores `{sessionId, role, scopes}`. Approving in the web app and acting through MCP touch
  the same state.
- **Rationale.**
  - An agent acts on its own person's copy, never on a shared token's copy, so text one visitor writes never reaches
    another visitor's agent.
  - The person who approves sees the agent's pending writes in their own session (D7).
  - The HMAC closes the hole S0 found: an unsigned id lets anyone name, and create, any object.
- **Contract.**
  - The grant's `props` hold `{sessionId, role, scopes}`, as `workers-oauth-provider` stores them on completion
    (S25).
  - An unsigned or forged cookie starts a new session.
  - The HMAC secret is a Worker secret held by the web and MCP Workers, which both verify the cookie.
  - Where the consent page lives, given the cookie's host, is open question 2.
- **Sources.** S8, S11, S25; S0.

### D5 — Manifest = selection and presentation

- **Decision.**
  - The manifest is `satisfies Record<CapabilityId, {expose, title, concise?} | {uiOnly: reason}>`, so a new
    capability does not compile until someone classifies it.
  - Inputs always come from the capability.
  - The tool list derives from `effect` and the scopes.
  - Overloaded capabilities split in the catalogue: `customers.contact.update`, with consent and VIP UI-only;
    `bookings.reschedule`, `bookings.table.assign` and `bookings.staff_note.add`.
  - New reads join the catalogue: `bookings.get`, `bookings.search`, `customers.search` and `approvals.get`.
- **Rationale.**
  - It follows Principle 4 and ADR 0009's reason for one catalogue.
  - The type makes classification a compile-time obligation instead of a review habit.
  - Agents get few, single-purpose tools with concise results, and search instead of downloading the directory
    (S16). `title` is the human-facing name a client shows (S5).
  - Marketing consent is the guest's own declaration, which is why an agent setting it was a finding of the review,
    and why consent stays UI-only.
- **Sources.** S5, S16.

### D6 — Idempotency by operation

- **Decision.**
  - Create and add take a required `idempotencyKey` argument: `bookings.create`, `bookings.walk_in.seat`,
    `customers.create` and `customers.notes.add`.
  - Set-state writes are idempotent by their target state, advertise `idempotentHint: true` and take no key: status
    advance, cancel, no-show, reschedule and notifications read.
  - When `_meta` and the argument both carry a key, they must match.
- **Rationale.**
  - A model controls `arguments` only.
  - A set-state write repeated with the same arguments reaches the same state, which is S7's definition of
    `idempotentHint`.
  - A create or an add duplicates on retry, so it needs a key and the kernel's replay, which S0 proved exactly-once
    under 20 parallel calls.
  - The `_meta` key stays accepted for hosts that send one; a mismatch with the argument is `schema.invalid_input`.
- **Writes D6 does not name** are open question 3.
- **Sources.** S5, S7, S16; S0.

### D7 — Approvals are a policy

- **Decision.**
  - A UI-only, elevated setting with a safe default decides which writes wait for a person, by tier and sensitivity,
    not only by `destructive`.
  - Approvals expire after 24 hours.
  - An approval is revalidated when it is approved, and answers `conflict` if the state moved.
  - Approvals are audited: who asked, and who decided.
- **Rationale.**
  - Today no capability declares `approval`, so `awaiting_approval` exists only in test fixtures.
  - One policy with a safe default makes Principle 5 a setting the business owner controls, not a code change per
    capability.
  - The policy uses tier and sensitivity because the harmful writes the review found (`customers_update` setting
    consent, `customers_block`) are not `destructive`.
  - Stripe's MCP keeps a human confirmation on sensitive actions (S20).
  - Elicitation (S12) is a non-goal of spec 004: the person who decides works in the web app, and need not be the
    person driving the agent.
- **Contract.**
  - Pending approvals live in the session's object (D2).
  - The inbox runs through UI-only capabilities, which MCP never lists (plan H1b).
  - `approvals.get` is a read, so an agent can check a request it made.
- **As built (plan H1a).**
  - *Policy.* The setting `approvals.policy` (`all`, `destructive_and_sensitive`, `none`) is owned by `permission:
    manage:approvals`, which is elevated, so only the owner holds it. A visitor's choice is kept in the session and
    wins over the preset's value; `approvals.policy.set` writes it and `settings.values.get` reports it. The default
    holds an assistant's write (`via: "mcp"`; the web app never waits) when its descriptor says it is hard to take
    back: `effect: "destructive"` (`bookings.cancel`, `bookings.no_show.mark`), `change: "overwrite"` or `"remove"`
    (`customers.block`) or `riskTier: 3`. There is no hand list: the descriptor already expresses all three named
    writes. A sensitive write the descriptor cannot express would need a new descriptor fact, not a list.
  - *Hook.* The kernel evaluates the policy (`holdsForApproval`, `src/core/approvals/policy.ts`) and nothing else.
    The per-capability `approval` hook, `mayRequireApproval` and their descriptor rules (`read-approval`,
    `approval-flag`) are deleted: nothing used them, and the hook could hold a web write because it skipped the `via`
    and policy guards. A registry without the setting falls back to the default policy, never to `none`; a test
    kernel that must never hold passes `none` explicitly.
  - *Held by default through MCP.* Requirement change: these seven tools now answer `awaiting_approval` for an
    assistant, and a test pins the list: `bookings_cancel`, `bookings_no_show_mark`, `bookings_reschedule`,
    `bookings_table_assign`, `customers_block`, `customers_contact_update`, `customers_unblock`. Before H1a they ran at
    once. Under `all`, every other exposed write waits too.
  - *Record.* `ApprovalRecord` (`src/core/approvals/record.ts`) adds a key-order independent input fingerprint, an
    `expected` fingerprint, `requestedBy` with the requester's `displayName` (an approved note is signed with the
    name they were shown) and an optional `clientId` for A1, and the decision fields. Times are real ISO instants:
    the demo's business clock is fixed, so a 24 hour deadline on it would never arrive. Expiry is evaluated on read
    and on decide, never on a timer; an expired record reads `decidedAt` = its deadline.
  - *Dedupe.* A pending hold with the same `(capabilityId, actorId, input fingerprint)` answers its `approvalId`.
    A write that cannot run now is refused at once and not queued; capacity is checked before the rehearsal.
  - *Revalidation.* On hold the kernel runs the handler on a copy of the session and keeps the changes it makes
    (state before against after, `src/core/mock/changes.ts`). On approve it rehearses again: other changes, or an
    error, are `conflict` (`approvals.conflict`), recorded. An unrelated edit, such as a staff note on the same
    booking, does not matter; a cancel that already happened, or a moved table, does. For an `add` only whether it
    can run is compared, because it mints a new id on every run. Then the write runs as the requester with the
    permissions their role holds today; a role that lost the permission gets `approvals.requester_forbidden`,
    recorded as `conflict`. The decider must also hold the write's own permission. A record is claimed before the
    first await, so a second approval or a rejection at the same moment answers `approvals.not_pending`, and a
    record that left `pending` is never rewritten. A live business clock can read as a conflict; the fixed clock
    cannot.
  - *Capabilities (all UI-only in the manifest).* `approvals.list` (`review:approvals`, a `restricted` read that
    owner and manager hold and staff do not, pending first, paginated, with the input), `approvals.approve` and
    `approvals.reject` (`decide:approvals`, destructive so staff never hold it), `approvals.policy.set`
    (`manage:approvals`, elevated, owner).
  - *Bounds.* 50 records per session. A new hold first drops settled records, oldest first, and at the cap with all
    pending answers `approvals.queue_full`; `boundSession` in the store never drops a pending record.
  - *Notification.* The feed derives one `approval.requested` item per pending record for actors that hold
    `decide:approvals`, dated by the request and worded per action. It cannot be marked read (`notifications.read` and
    `read_all` skip it), so an agent cannot silence it; it disappears when the request is decided or expires.
- **Sources.** S11, S12, S20.

### D8 — Protocol 2026-07-28, stateless, hardened

- **Decision.**
  - No protocol sessions.
  - `tools/list` carries the SDK's `CacheHint`.
  - `serverInfo.version` is the manifest hash, and tools are listed in a deterministic order.
  - `Origin` is validated and a bad one gets `403`, a MUST of the transport.
  - CORS exposes `WWW-Authenticate`.
  - Workers rate limits apply to `/register`, `/authorize` and `/token`, per grant, and per IP for new sessions.
  - Each call writes one structured log line.
- **Rationale.**
  - 2026-07-28 has no protocol sessions and lets clients cache lists by `ttlMs` and `cacheScope` (S1, V3).
    `createMcpHandler` serves it statelessly from a per-request factory (S21), with the 2025-era fallback ADR 0009
    pins.
  - A version that changes with the surface, plus a stable order, lets clients and caches notice a change (AC9).
  - Origin validation is a MUST (V3). ADR 0009 left it out because the route trusted no cookie, and D4 changes that.
  - Exposing `WWW-Authenticate` lets browser-based clients read the challenge.
  - Registration and authorisation are unauthenticated, and every new demo session is a new object counted against
    the Free plan, so both are rate-limited.
- **Sources.** S1, S5, S11, S21; V3, V5.

## Shape

### Module boundaries

| Unit | Holds | Imports |
| --- | --- | --- |
| `src/core/mcp` | The projection (ADR 0009) and the pure access function of D3 | `core` contracts, the SDK |
| Composition root without Next or React (plan W0) | Catalogue, manifest, actor and adapter wiring, shared by the web app and both Workers | `core`, `modules`, `verticals` server entries |
| `workers/demo-store` | `DemoStore` (kernel inside), `dispatch` RPC, idle alarm, migration `v1` (`new_sqlite_classes`) | The composition root |
| `workers/mcp` | Fetch gate, `workers-oauth-provider`, `createMcpHandler` at `/mcp` on `mcp.admin-os.lr0y.dev`, store binding by `script_name` | The composition root, `src/core/mcp`, the SDK |
| Web app (`src/config/data.server.ts`) | The durable adapter on Workers (`DATA_STORE=durable`) and the in-memory store in tests and stdio | Unchanged layers (ADR 0003) |

Dependency rules (AC1):

- Dependency-cruiser cruises `workers/` too.
- A `reachable` rule forbids `next`, `react`, `react-dom`, `lucide-react` and `src/(app|ds|components|engines|data)`
  from `workers/mcp/src/index.ts`.
- `src` never imports `workers`.
- A test over the `wrangler deploy --dry-run --outdir` metafile proves the rule on the bundle itself.

### Contracts

```ts
// workers/demo-store: the RPC, as S0 built it. The abort signal stays on the caller.
interface StoreCallContext {
  readonly vertical: VerticalId;
  readonly sessionId: string; // verified (signed cookie or grant); never read back from ctx.id.name
  readonly actor: Actor;
  readonly via: "ui" | "mcp" | "system";
  readonly correlationId: string;
  readonly idempotencyKey?: string;
  readonly faults?: readonly (readonly [string, Fault])[];
  readonly catalogVersion: string; // a mismatch answers transport.unavailable
}
interface DemoStoreRpc {
  dispatch(capabilityId: string, input: unknown, context: StoreCallContext): Promise<CallResult<unknown>>;
}

// D3 and D4: what a grant holds, and the one pure access decision behind tools/list, the gate and dispatch.
type Scope = "read" | "write";
interface GrantProps {
  readonly sessionId: string;
  readonly role: RoleId;
  readonly scopes: readonly Scope[];
}
type Access =
  | { readonly kind: "allowed" }
  | { readonly kind: "read_only" } // MCP_READ_ONLY: access.forbidden with the read-only message
  | { readonly kind: "insufficient_scope"; readonly scope: "write" } // HTTP 403 from the gate
  | { readonly kind: "forbidden" }; // the role lacks the permission: access.forbidden
declare function effectivePermissions(
  rolePermissions: ReadonlySet<Permission>,
  scopes: ReadonlySet<Scope>,
  readOnly: boolean,
): (capability: AnyCapability) => Access;

// D5: one entry per capability, `satisfies Record<CapabilityId, ManifestEntry>`. ConciseResult is the projection of
// the capability's output to the fields an agent needs (plan T1, T3); it never changes the input.
type ManifestEntry =
  | { readonly expose: true; readonly title: string; readonly concise?: ConciseResult }
  | { readonly uiOnly: string };

// D7: the approval record H1a builds on (it extends today's PendingApproval in src/core/mock/session-store.ts).
interface ApprovalRecord {
  readonly approvalId: string;
  readonly capabilityId: string;
  readonly input: unknown;
  readonly requestedBy: {
    readonly actorId: string;
    readonly role: RoleId;
    readonly via: "ui" | "mcp";
    readonly clientId?: string;
  };
  readonly requestedAt: string;
  readonly expiresAt: string; // requestedAt + 24 hours
  readonly status: "pending" | "approved" | "rejected" | "expired" | "conflict";
  readonly decidedBy?: { readonly actorId: string; readonly role: RoleId };
  readonly decidedAt?: string;
}
```

`effectivePermissions` checks in the order D3 states: `read_only` for any write under `MCP_READ_ONLY`, then
`insufficient_scope` for a write without `write`, then `forbidden` when the role lacks the permission. `tools/list`
returns only the `allowed` tools. Open question 1 proposes checking the role before the scope.

### Request path in the MCP Worker

1. **`OPTIONS`.** CORS preflight: allow `Authorization`, `Content-Type`, `MCP-Protocol-Version`, `Mcp-Method` and
   `Mcp-Name`; expose `WWW-Authenticate`.
2. **`Origin`.** `validateOriginHeader` against a configured allowlist. A present `Origin` that is not allowed gets
   `403`.
3. **Rate limits.** `429` with `Retry-After`: `/register`, `/authorize` and `/token` per IP; `/mcp` per grant; new
   demo sessions per IP.
4. **OAuth** (`workers-oauth-provider`). `/mcp` without a valid token for this resource gets `401` with
   `resource_metadata`. The token's `props` give `{sessionId, role, scopes}`.
5. **Scope gate.** A `tools/call` that names a write, from a token without `write`, gets `403 insufficient_scope`,
   `scope="write"`. The gate reads a clone of the JSON-RPC body: the body is the source of truth (V3), and 2025-era
   requests carry no `Mcp-Name`.
6. **`createMcpHandler(factory)`.** The factory projects the manifest for the grant's actor, scopes and
   `MCP_READ_ONLY`, over a client whose adapter is the durable store.
7. **Log.** One line, written after the response.

### Errors and retries

- **The store.** A store that is unreachable, over the Free-plan limit, or on another catalogue version answers
  `transport.unavailable`. The client's 8-second timeout answers `transport.timeout`. Reads are retried once, and
  writes only with a key (ADR 0005).
- **Approvals.** A held write returns `{status: "awaiting_approval", approvalId}`, which is not an error; its text
  says not to retry, and `approvals.get` reads its state. An approval that has expired is refused (H1a chooses the
  code), and one whose state moved answers `conflict`.
- **Keys.**
  - A create or an add without a key answers `client.idempotency_required`, naming the `idempotencyKey` argument
    (plan U3).
  - One key with another input answers `client.idempotency_conflict`.
  - A `_meta` key that does not match the argument answers `schema.invalid_input` with the path `idempotencyKey`.
- **Replays and stubs.** Replay records are bounded at 200 per session (S0), and every RPC stub is disposed after
  its call.

### Observability

- **MCP Worker.** One JSON line per call: `{correlationId, clientId, tool, status, code?, durationMs}`. The
  correlation id also goes into the result's `_meta` (plan U3). No arguments, personal data or tokens are logged.
- **Store.** One line per dispatch, `{event: "do.dispatch", capabilityId, correlationId}`, as in S0. Its daily count
  is the gauge for the Free-plan budget.
- **Client.** The client's call line is unchanged (ADR 0005, descriptor v2).
- **Config.** `observability.enabled` in every `wrangler.jsonc`.

## Consequences

### Positive

- Both doors see one durable state per demo session, and AC6 becomes a probe that runs (plan S1c). The same change
  fixes the public demo's own Server Actions.
- An agent can write with arguments alone, a read-only connection cannot change anything, and by default
  destructive and sensitive writes wait for a person.
- MCP deploys, fails and is rate-limited on its own, and a dependency rule and a metafile test prove the separation.
- Clients see new tools, because the version changes with the surface and lists carry cache hints.
- Approvals reach production for the first time.

### Negative

- **Three Workers and a deploy order.**
  - The store goes first: its migration `v1` lives in its own config, and the web Worker's binding names a script
    that must already exist. Then the web app and MCP follow.
  - A catalogue change means deploying all three back to back. Between the store and its callers, a caller on the
    other catalogue version gets `transport.unavailable`.
  - A change to the snapshot schema resets every session to the seed.
- **The Free-plan Durable Object request budget.**
  - The Free plan allows 100,000 requests a day. Every RPC call counts as one, and so does every alarm.
  - At S0's 8 calls per bookings render that is about 12,500 renders a day; S1a's target of 2 or 3 gives about
    33,000 to 50,000.
  - Every MCP tool call under a grant costs one request; `tools/list` costs none.
  - Past the limit, Durable Object requests fail until 00:00 UTC. Writes and session reads then answer
    `transport.unavailable`, while reads without a session keep serving the seed. The 100,000 SQLite rows written a
    day bound writes in the same way.
  - The web and MCP Workers share the Workers Free plan's own 100,000 requests a day.
- **`MCP_READ_ONLY` stays until scopes ship.** H0's rule carries over unchanged to the new Worker, and the public
  deployment reads only until plan A1b passes AC2 and AC3. Lifting it is its own reviewed change.
- **On the demo, approvals live only as long as the session.** The 2-hour idle alarm deletes the object together with
  its approvals and their audit. An approval there lasts at most 2 idle hours, even though it expires at 24; a real
  adapter keeps the 24 hours.
- **Bounded replays.** A retry older than a session's last 200 keyed writes applies again.
- **More moving parts locally.**
  - Two `wrangler dev` processes: one for the web app and the store, one for MCP.
  - `next dev` needs `initOpenNextCloudflareForDev()` behind `DATA_STORE=durable`.
  - `workers/tsconfig.json` takes generated `wrangler types`, and the gates gain a `tsc -p workers/tsconfig.json`
    step.
- **ADR 0009's probing rule gets an exception.** A write called without `write` gets an HTTP `403` that names the
  scope, so a client can tell a write's name from an unknown one. The catalogue is public and its reference is
  generated from it (AC10), so nothing is revealed that is not already published.
- **The scope gate is our code**, because the SDK answers per-call challenges only for `McpServer`. It is small, and
  the projection backs it with the same pure function.
- **Clients have to move.** `/api/mcp` answers `410` for one release (plan W3), and clients must add the server again
  at its new URL and authorise.

### Revisit when

- **A second consumer** needs the core as a package: then do the workspace split D1 defers.
- **Measured daily Durable Object requests** pass about 70% of the Free limit: batch more calls, or move the demo to
  the paid plan.
- **The SDK's `createMcpHandler`** resolves scope challenges for a low-level `Server`, or ADR 0009's option 1
  conditions are met: drop the custom gate.

## Risks and the next test

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Real clients do not step up on our `403 insufficient_scope`, or do not request the union of scopes | Medium | Medium | They keep `read`; the README says how to reconnect for `write`; the test below |
| The consent page cannot read `demo_session` on the MCP host | High while open | High | Decide open question 2 before A1a |
| Durable Object requests exceed the Free plan | Low | Medium | Reads without a session stay in process; 2 or 3 calls per render; the daily `do.dispatch` count |
| A new object starts slower in production than in local workerd | Medium | Low | Measure on the first deploy in S1c |
| Callers on different catalogue versions during a deploy | Medium | Low | Deploy back to back; a mismatch fails as `transport.unavailable` and never misreads |
| The HMAC secret leaks and lets anyone name sessions | Low | Medium | Keep it in Worker secrets; rotating it restarts every session |

S0 has de-risked the store. **The riskiest remaining assumption is step-up with real clients.** Before A1b builds the
whole flow, test it with a throwaway Worker under `wrangler dev`:

- **Set-up.** `workers-oauth-provider` with a consent that defaults to `read`, one read tool and one write tool, and
  the scope gate.
- **Run.** Connect Claude Code with `claude mcp add --transport http`.
- **Expected.**
  1. `401`, then discovery, then consent.
  2. The read tool works.
  3. The write tool gets `403 insufficient_scope`.
  4. The client re-authorises with `read write`, and the write works.

If the client does not step up, A1b ships the reconnect path (plan, risks) and the README says so.

## Open questions

These are places where the first draft found a decision incomplete. Each came with a proposal; the resolutions
(2026-11-04) close the list and bind the tasks named in them.

1. **D3: challenge only when the scope is what is missing.**
   - *The problem.* D3 says a write called without `write` answers `403 insufficient_scope`. When the role does not
     hold that write either (a `staff` token calling `bookings_cancel`), the challenge sends a person through a
     consent that cannot succeed: after granting `write`, the call still answers `access.forbidden`.
   - *The standard.* S8 says the challenge carries "the scopes needed to satisfy the current operation", and no scope
     satisfies this one.
   - *Proposal.* Check the role first and answer `access.forbidden` as today; answer `insufficient_scope` only when
     the role holds the write. AC2's cases, an owner or a manager holding `read`, do not change.
2. **D4: where the consent page lives, given the cookie's host.**
   - *The problem.* `demo_session` (and `demo_role`, which gives the grant its role) is host-only on
     `admin-os.lr0y.dev`: `src/config/demo-session.server.ts:23-28` sets no `Domain`. A consent page on
     `mcp.admin-os.lr0y.dev` therefore never receives it. Locally both run on `localhost`, where cookies ignore the
     port, so development hides the problem.
   - *(a)* Set `Domain=admin-os.lr0y.dev`, so the MCP subdomain receives the cookie. The consent page lives in the
     MCP Worker, as `workers-oauth-provider` documents, and renders the four locales from the typed dictionaries
     without React. With no cookie it starts a signed session.
   - *(b)* Keep the cookie host-only and render consent in the web app with the kit. The MCP Worker's `/authorize`
     hands a signed, single-use request id to the web app, which completes the grant through a binding to the MCP
     Worker.
   - *Recommendation.* (a): one Worker owns the whole OAuth flow in the provider's documented pattern, and the wider
     cookie reaches only this app's subdomains. Choose (b) if consent needs kit components, such as a role picker.
3. **D6: writes the rule does not name.**
   - *Not classified.*
     - `bookings.walk_in.undo` and `bookings.status.undo`: on `main`, both take only `{id}` and require a key today.
     - `bookings.staff_note.add`.
     - `customers.contact.update`, `customers.block`, `customers.unblock`, `bookings.table.assign` and
       `notifications.read_all`.
   - *The undos are neither create nor set-state.* Repeating one does not reliably reach the same state. After a
     first `bookings.status.undo` succeeds, a retry whose answer was lost either fails with
     `bookings.invalid_transition`, telling the agent that a successful call failed, or, depending on the history the
     booking keeps, takes back an earlier step. Proposal: they keep a required `idempotencyKey` argument, or they take
     the status they undo from (`{id, from}`), which makes them set-state.
   - *`bookings.staff_note.add` is named an add,* so by D6's own rule it takes a key, unless it replaces the note, in
     which case it should be `bookings.staff_note.set` and be set-state.
   - *The rest* (block, unblock, a contact update with the same values, table assign, read all) are set-state and fit
     the rule.
   - *Proposal.* Each write declares its idempotency mode in the catalogue, and a contract test fails on a write with
     none, as D5 does for exposure.
4. **D7: whose rights an approved write runs with.**
   - *The problem.* D7 audits who asked and who decided, but does not say whose permissions and scopes apply when the
     write finally runs.
   - *Proposal.* It runs as the requester, because the approval is a gate, not an escalation. It is refused when the
     requester's grant no longer holds `write`, or the role no longer holds the permission, in the same way it is
     refused when the state moved.
5. **D8: two readings.**
   - *"Per IP for new sessions".* 2026-07-28 has no protocol sessions, so this reads as new demo sessions. Each one is
     a new Durable Object, which is what the limit protects.
   - *"`serverInfo.version` = manifest hash".* For AC9 to hold when a capability's schema or summary changes without
     the manifest changing, the hash must cover what `tools/list` returns (names, titles, descriptions, schemas,
     annotations, `_meta`), not only the manifest's source.


### Resolutions (2026-11-04)

1. **D3: accepted.** The role is checked first (`access.forbidden`); `insufficient_scope` is answered only when the role
   holds the write. Binds A1b.
2. **D4: (a).** The session and role cookies take `Domain` from `DEMO_COOKIE_DOMAIN` (`admin-os.lr0y.dev` in
   production, unset locally), and the consent page lives in the MCP Worker. The signed session cookie takes a new name
   (`demo_sid`) so unsigned legacy cookies are ignored. A stale host-only `demo_role` is not expired, since Next keeps
   one `Set-Cookie` per name: browsers send older cookies first and Next's parser keeps the last duplicate, so the newer
   domain cookie wins. Binds S1b and A1a.
3. **D6: the undos are UI-only.** `bookings.status.undo` and `bookings.walk_in.undo` are the undo affordance of the
   person who just acted; agents use the forward capabilities, so the manifest marks both UI-only and the question of
   their key does not reach MCP. `bookings.staff_note.add` takes a key. Every exposed write declares its idempotency
   mode (`key` or `target-state`), and a contract test fails on one without it. Binds T1, U1 and T2a.
4. **D7: accepted.** An approved write runs as the requester and is refused when the requester's grant or role no
   longer holds it. Binds H1a.
5. **D8: both readings accepted.** The per-IP limit guards new demo sessions; `serverInfo.version` hashes the projected
   `tools/list`. Binds U2 and A1b.
6. **D5, as built: consent, VIP and tags are set at create only.** No screen changed them after create, so T2a deleted
   `customers.update` instead of keeping a UI-only remainder (no dead code). `customers.consent.set` and
   `customers.vip.set` arrive as UI-only capabilities with the first screen that needs them. `bookings.reschedule`
   takes optional `resourceIds`, so moving a booking to another time and other tables stays one atomic call.

## Sources

From spec 004:

- S1 MCP specification 2026-07-28, changelog — https://modelcontextprotocol.io/specification/2026-07-28/changelog
- S5 Tools, 2026-07-28 — https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md
- S7 Schema 2025-11-25, ToolAnnotations — https://modelcontextprotocol.io/specification/2025-11-25/schema
- S8 Authorization, 2026-07-28 — https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/index.md
- S11 Security best practices — https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices.md
- S12 Elicitation — https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation.md
- S16 Anthropic, Writing effective tools for agents — https://www.anthropic.com/engineering/writing-tools-for-agents
- S18 GitHub MCP server (read-only, toolsets) — https://github.com/github/github-mcp-server
- S19 Cloudflare MCP servers — https://github.com/cloudflare/mcp-server-cloudflare
- S20 Stripe MCP (read/write split, human confirmation) — https://docs.stripe.com/mcp
- S21 Cloudflare `createMcpHandler` — https://developers.cloudflare.com/agents/model-context-protocol/apis/handler-api/
- S22 Cloudflare `McpAgent` (feature-frozen) — https://developers.cloudflare.com/agents/model-context-protocol/apis/agent-api/
- S23 Cloudflare remote MCP guide — https://developers.cloudflare.com/agents/guides/remote-mcp-server/
- S25 `workers-oauth-provider` — https://github.com/cloudflare/workers-oauth-provider
- S0 Spike report — `docs/specs/004-mcp-server/spike-s0.md`

Added by this ADR (read 2026-11-04):

- V1 Cloudflare, Durable Objects pricing — https://developers.cloudflare.com/durable-objects/platform/pricing/
- V2 Cloudflare, Workers pricing — https://developers.cloudflare.com/workers/platform/pricing/
- V3 MCP Streamable HTTP, 2026-07-28 —
  https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http.md
- V4 Cloudflare, Workers Custom Domains — https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- V5 `@modelcontextprotocol/server` 2.4.0 as installed: `dist/index.d.mts` (`validateOriginHeader`,
  `bearerAuthChallengeResponse`, `ScopeChallengeHandler`, `requireScopes`), `dist/index.mjs:1194` (scope challenges
  for `McpServer` only), `dist/mcp-*.d.mts` (`CacheHint`)
