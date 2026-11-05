# ADR 0009 — The MCP server is a projection of the catalogue through the UI's client

Status: proposed · Date: 2026-10-31 · Amended: 2026-10-31 (transports, T8b) · Spec: `docs/specs/001-v0-1/spec.md` (D4, AC5) · Plan: T8a, T8b · Related: ADR 0003, 0005, 0006

> **Amended 2026-11-05 (ADR 0017):** the MCP manifest is the kernel entries plus the module entries the generator
> composes from each module's manifest. A cross-module hint is dropped when its module is absent, and the instructions'
> module sentence comes from the generated list.

## Context

- **Spec D4, one catalogue, two doors.** The UI and the MCP server call the same capabilities through the same
  client. The MCP server adds a transport, not a second API.
- **AC5.** An MCP client lists the tools for the actor's permissions, reads bookings and customers, creates a
  booking, gets the same `access.forbidden` as the UI on a forbidden call, and gets `awaiting_approval` on an
  approval-gated write.
- **What already exists.**
  - Every capability carries `id`, `summary`, zod `input` and `output`, `permission`, `effect` (`read`, `write`,
    `destructive`), `elevated` and an optional `approval` rule (`src/core/capability`).
  - `createClient(catalog, adapter, {actor, correlationId})` validates the input (`schema.invalid_input`), enforces
    timeouts, retries reads, retries writes only with an idempotency key, and validates the output
    (`src/core/client`, ADR 0005).
  - The mock adapter checks the permission (`access.forbidden`) and applies the approval rule (ADR 0005).
  - Roles become permissions with `permissionsOf` over the merged catalogue and the preset's modules (ADR 0006).
- **The SDK as installed** (verified in the typings and the built code of the packages, not from memory):
  - `@modelcontextprotocol/server` 2.4.0 (protocol revision 2026-07-28, zod 4 through Standard Schema) and
    `@modelcontextprotocol/client` 2.4.0, used by the tests.
  - `McpServer.registerTool(name, {title, description, inputSchema, outputSchema, annotations}, handler)` exists.
    But its `tools/call` handler (`dist/mcp-*.mjs`, `setToolRequestHandlers`):
    - throws a JSON-RPC `-32602` protocol error, `Tool <name> not found`, for an unregistered or disabled name;
    - validates the arguments itself, before the handler, and answers a text-only tool error
      (`Input validation error: ...`) with no code.
  - The low-level `Server` takes `setRequestHandler("tools/list" | "tools/call", ...)`. Its
    `projectCallToolResult(result, outputSchema)` is the documented hook for low-level `tools/call` authors.
  - `ToolAnnotations` has `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint`.
  - The handler context exposes `ctx.mcpReq.id` (the JSON-RPC id), `ctx.mcpReq._meta`, `ctx.mcpReq.signal` and,
    over HTTP, `ctx.http.authInfo`.
  - The package itself ships `createMcpHandler(factory, options)` (a fetch-shaped Streamable HTTP handler, one
    server per request) and `serveStdio` from `@modelcontextprotocol/server/stdio`. The factory receives
    `{era, authInfo, requestInfo}` and may return an `McpServer` or a low-level `Server`.
  - The client validates `structuredContent` against the advertised `outputSchema` (ajv) once it has listed the
    tools.

## Options considered

1. **`McpServer.registerTool` per capability** (the research digest's proposal).
   - *Pros:* the SDK converts the zod schemas and validates input and output.
   - *Cons:* a call to an unlisted tool is a protocol error, not a tool error carrying `access.forbidden`. Invalid
     input is the SDK's own text error, not `schema.invalid_input` with paths. Both break AC5's parity with the UI,
     and input is validated twice by two different rules.
   - *Effort / reversal:* S / S.
2. **A second, MCP-specific API** (hand-written tools).
   - *Cons:* it drifts from the UI's rules; D4 rejects it.
3. **Low-level `Server` with our own `tools/list` and `tools/call` (chosen).** The projection lists the actor's
   tools and dispatches every call through `createClient`, so validation, permission, approval and error codes are
   the client's by construction.
   - *Cons:* we convert the schemas ourselves, with zod 4's `z.toJSONSchema`, the same converter the SDK falls back
     to, at the SDK's target (`draft-2020-12`). That is about ten lines.
   - *Effort / reversal:* S / S. Moving to option 1 later only touches `src/core/mcp`.

## Decision

Option 3. **This amends the digest's `McpServer.registerTool` proposal**, for the two reasons in option 1.

### Projection (`src/core/mcp/project-catalog.ts`)

`projectCatalog({catalog, actor, createClient, serverInfo?})` returns a low-level `Server` for one actor. It is
generic: it takes the catalogue and a client factory, so it imports no module, preset or config.

| Capability | MCP tool |
| --- | --- |
| `id` | `name`: dots → underscores (`bookings.list` → `bookings_list`); two ids that project to one name throw at construction |
| `summary` | `description` |
| `input` | `inputSchema`: `z.toJSONSchema(input, {io: "input"})`, object root |
| `output` | `outputSchema`: `z.toJSONSchema(output, {io: "output"})`; for `write` and `destructive`, the union of `output` and `{status: "awaiting_approval", approvalId}` |
| `effect` | `annotations`: `readOnlyHint` = `read`, `destructiveHint` = `destructive`, `idempotentHint` = `read`, `openWorldHint` = `false` (the tools act on this business's own data) |

**The write output is a union** because the client checks every non-error result against the advertised schema: an
approval-gated write would otherwise fail validation in the client.

### Visibility

- `tools/list` returns only the capabilities whose permission the actor holds, the rule ADR 0006 calls "hide,
  never disabled". The modules a preset does not enable are already outside the actor's permissions
  (`permissionsOf`).
- **An actor without permissions lists nothing**, an empty list rather than an error.
- **A call to an unlisted name, known or not, is a tool error** with `access.forbidden`, the UI's code. Unknown and
  forbidden names answer the same, so a client cannot probe which tools exist. The message says to call
  `tools/list`.
- The list is fixed for the life of one server instance (one actor), so `tools.listChanged` is `false`.

### Dispatch

- Every call goes through the factory's client, `createClient(CATALOG, adapter, {actor, correlationId})`, with a
  fresh correlation id per call and the request's abort signal.
- **The client validates the arguments**, so invalid input answers `schema.invalid_input` with `details.paths`,
  exactly as in the UI. The SDK's input validation is not used.
- **Mapping of `CallResult`:**
  - `ok` → `structuredContent` = the value, plus one text block with its JSON for clients that read only `content`;
  - error → `isError: true`, `structuredContent` = `{code, message, details?}`, text `"<code>: <message>"`;
  - `awaiting_approval` → a non-error result, `structuredContent` = `{status: "awaiting_approval", approvalId}`, and
    a text that says a person must approve it and not to retry.
- **Idempotency.** MCP has no idempotency field. The JSON-RPC id (`ctx.mcpReq.id`) is not one: a retry is a new
  request with a new id, and ids repeat across connections. So a write takes its key from
  `_meta["admin-os/idempotencyKey"]` (a string of 1 to 128 characters) when the client sends one; a malformed key
  is `schema.invalid_input`. Without it nothing is derived, and the client's rule applies: a write without a key is
  never retried (ADR 0005). Reads ignore the key.

### Actor

The projection takes an `Actor`; the transports decide how it is resolved (T8b):

- **Streamable HTTP:** a bearer demo token mapped to a role through `MCP_TOKENS` (`<token>:<role>` pairs, see
  the amendment), verified before the factory runs and passed as `authInfo`.
- **stdio:** the role from an environment variable (`MCP_ROLE`, default `staff`, the least privilege).
- Both build the actor with `demoActor(roleId, vertical)` (`src/config/actor.ts`), the same function the UI's
  `getRuntime()` uses, so a role has the same permissions through both doors.

### Layer

- **`src/core/mcp`** holds the generic projection, behind a `server.ts` entry (`import "server-only"`): it carries
  the SDK and is never imported by the browser. It depends only on `core` contracts and the SDK.
- **`src/config/mcp.server.ts`** wires it: `createMcpServer({actor, vertical, sessionId?})` passes `CATALOG` and
  a client over `getAdapter(...)` with the `MOCK_FAULTS` of the environment.
- **T8b** adds `src/app/api/mcp/route.ts` and `scripts/mcp-stdio.ts`, which only resolve the actor and call
  `createMcpServer` (see the amendment). No new entry type, so ADR 0003's tables do not change.

### Security

- **HTTP auth.** A missing or unknown token is a `401` with `WWW-Authenticate: Bearer resource_metadata="<url>"`,
  and the route serves the RFC 9728 protected-resource metadata. The tokens are demo tokens for the public demo
  only; a real deployment replaces the token verifier with its own auth (an OAuth authorization server) and maps
  the verified subject to an actor. The SDK's `OAuthTokenVerifier` and bearer helpers are the seam.
- **No personal data in logs.** The client logs `{capability, effect, status, code, durationMs, correlationId,
  actorRole}` only (ADR 0005). The projection logs nothing itself; on stdio nothing may be written to stdout.
- **Writes** keep the UI's rules: the same permission check, the approval rule, and `destructiveHint` on
  destructive tools so clients ask before calling them.
- **Demo sessions.** Without a session id, writes answer `transport.unavailable` as in the UI. T8b gives each token
  (HTTP) or process (stdio) its own demo session, so one MCP client never edits another's copy.

## Consequences

- AC5's parity holds by construction: one client, one rule set, one error vocabulary.
- **A contract test pins it** (`src/config/mcp.server.test.ts`): every catalogue capability projects to one tool
  with object schemas; listing per role on the hospitality preset; annotations per effect; `bookings_list` and
  `customers_list` output; `access.forbidden`. The generic behaviour, including writes, approval, invalid input and
  idempotent replay, is tested on a test catalogue in `src/core/mcp/project-catalog.test.ts`. Both use a real SDK
  client over `InMemoryTransport.createLinkedPair()`, which lists before calling so output validation is live.
- **`mcp-handler` is not needed** for T8b: the SDK's own `createMcpHandler` serves Streamable HTTP from a fetch
  handler with a per-request factory.
- **Revisit when:**
  - the SDK's `McpServer` lets an unregistered tool name answer a tool error and lets the handler own input
    validation; option 1 would then cost nothing;
  - a capability needs a non-object output, which MCP requires to be wrapped.

## Amendment 2026-10-31: the transports (T8b)

Verified against the installed `@modelcontextprotocol/server` 2.4.0 typings and built code, and exercised with MCP
Inspector 2.13.0 (`--cli`) on `next start` and on stdio.

### Streamable HTTP (`/api/mcp`)

- **Handler.** `createMcpHandler(factory)` from the SDK, created once per module; it builds one low-level `Server`
  per request. GET, POST and DELETE go to it. It serves both eras: the modern 2026-07-28 per-request envelope and
  the 2025 era through its stateless legacy fallback (the default; 2025 GET and DELETE answer `405`). A route test
  pins both eras with the real SDK client (`getProtocolEra()` is `modern` and `legacy`).
- **Auth before the handler.** `src/config/mcp-http.server.ts` runs the SDK's `verifyBearerToken` with an
  `OAuthTokenVerifier` over `MCP_TOKENS`, then passes the `AuthInfo` to `handler.fetch`; the factory reads the role
  and session from `authInfo.extra` (parsed with zod). A missing header, a non-bearer scheme or an unknown token
  answers `bearerAuthChallengeResponse`: `401`, `WWW-Authenticate: Bearer error="invalid_token", ...,
  resource_metadata="<origin>/.well-known/oauth-protected-resource/api/mcp"`. **No token never means a role.**
- **`expiresAt`.** The SDK refuses an `AuthInfo` without it. Demo tokens do not expire, so the verifier stamps one
  hour from the verification, which only bounds this request.
- **`MCP_TOKENS`** is `"<token>:<role>,..."` (this replaces the `owner:<token>` order sketched above), parsed with
  zod in `src/config/mcp-env.ts`: tokens are RFC 6750 `b64token`, 8 to 256 characters; roles are `owner`, `manager`,
  `staff`; a repeated token or a bad entry fails loudly, and the error never echoes a token. Unset or empty, the
  public demo tokens (`demo-owner-token`, `demo-manager-token`, `demo-staff-token`) apply **only on the mock
  adapter**; with any other adapter no token is accepted until `MCP_TOKENS` is set.
- **Demo session per token.** The session id is `mcp-` + the first 16 bytes of SHA-256(token): stable, so a client
  sees its own writes across requests; different per token; and the token itself never becomes an id or a log
  field. Everyone holding the same public demo token shares that token's copy, which is acceptable for demo data.
- **Preset and faults.** `getVertical()` per request; `createMcpServer` applies `MOCK_FAULTS` from the environment.
  The UI's per-visitor `mock_faults` cookie does not apply: an MCP client has no demo cookies.
- **RFC 9728 metadata** at the path-aware location `src/app/.well-known/oauth-protected-resource/api/mcp/route.ts`:
  `resource`, `bearer_methods_supported: ["header"]`, `resource_name`, `resource_documentation`, with permissive
  CORS (a public document, as the SDK's own `oauthMetadataResponse` serves it). **No `authorization_servers`**: the
  demo tokens are static, not OAuth-issued, and the SDK's `buildOAuthProtectedResourceMetadata` requires an
  authorization server's metadata, so the document is built directly with the SDK's
  `OAuthProtectedResourceMetadata` type. A real deployment adds its authorization server there and swaps the
  verifier. Inspector reads the challenge and offers OAuth discovery, as expected.
- **Runtime: Node.** The SDK's HTTP entry is web-standard, so either runtime would run it. Node is chosen because
  the demo sessions live in this process's memory (the same store the UI's Server Actions use) and OpenNext on
  Cloudflare, our deploy target, serves Node routes, not the edge runtime. `dynamic = "force-dynamic"`.
- **Not added:** host or origin allowlists. They defend local servers against DNS rebinding; this route is a remote
  endpoint behind bearer auth with no cookies. Revisit if the route ever trusts a cookie.

### stdio (`npm run --silent mcp:stdio`)

- **Entry.** `scripts/mcp-stdio.ts` calls the SDK's `serveStdio(factory)`, which pins one instance per connection
  and serves both eras (a smoke test pins each). The actor comes from `MCP_ROLE` (default `staff`, the least
  privilege; an unknown role fails loudly at start), the preset from `VERTICAL`, and the session id is
  `stdio-<uuid>`, one per process.
- **Runner: `tsx` 4.23.15, pinned as a devDependency.** The entry imports the app's modules through the `@/` alias,
  which plain Node's type stripping does not resolve; `tsx` does, with no build step to keep in sync.
- **`server-only` outside Next: a resolve hook, not `--conditions=react-server`.** The global condition was tried
  first and fails: it also resolves `react` to its server build, where `createContext` does not exist, and a module
  on the import path (`src/core/i18n/provider.tsx`) calls it at load. `scripts/server-only-hook.mjs` uses Node's
  `module.registerHooks` (Node 22.15 or later) to add `react-server` for the `server-only` specifier alone, so the
  marker resolves to the package's own empty module and nothing else changes.
- **`next/headers`.** `data.server.ts` no longer imports it: `ensureDemoSession`, `resetDemoSession` and
  `DEMO_SESSION_COOKIE` moved to `src/config/demo-session.server.ts`, with `resetDemoData(vertical, sessionId)` left
  in the adapter module. The stdio path therefore loads no Next module.
- **stdout carries the protocol only.** `createMcpServer` takes a `logger`; stdio passes one that writes JSON lines
  to stderr, and the entry redirects `console.log`, `info` and `debug` to stderr so no dependency can corrupt the
  stream. npm prints its script banner on stdout, so the documented commands use `npm run --silent`. A smoke test
  spawns the real command and checks that every stdout line is JSON-RPC.

### What AC5 still waits for

The catalogue has no write capability yet, and every hospitality role gets the same seven reads. So creating a
booking, `awaiting_approval`, and a forbidden call on a *known* tool that one role is offered and another is not
wait for T13 (the first write, `bookings.create`). The transports need no change for them: writes reach the token's
or process's demo session, and the projection's generic tests already cover approval and idempotent replay.

## Amendment 2026-11-03: descriptor v2 on the MCP surface (S1)

- **Tool `_meta`.** Each tool carries `admin-os/riskTier` (0 to 3, ADR 0005 descriptor v2) and, when the capability
  sets `requiresIdempotencyKey`, `admin-os/requiresIdempotencyKey: true`. A model that sees the second key sends
  `_meta["admin-os/idempotencyKey"]` on `tools/call`; without it the call answers `client.idempotency_required`.
- **Idempotency.** The earlier rule that a keyless write "is never retried" still holds for ordinary writes. A write that
  sets `requiresIdempotencyKey` is refused without a key (missing or empty) before dispatch. A malformed key is
  `schema.invalid_input`. The client and the projection share one key schema (1 to 128 characters).
- **Logs.** The client's call line is now `{capability, effect, riskTier, via, status, code, durationMs, correlationId,
  actorRole}`. `createMcpServer` creates every client with `via: "mcp"`, so an approval rule keyed on the surface
  always sees an assistant.

## Amendment 2026-11-04: the public demo tokens are read-only

- **Why.** The demo tokens are public and every holder of one shares its demo session. A write one visitor's agent
  makes (a guest note, a customer note) reaches the next visitor's agent as data, and `customers_update`,
  `customers_block` and `customers_unblock` ran with no key and no approval. Spec 004 replaces the access model; until
  its phase 4 lands, the public tokens read only.
- **Rule.** `projectCatalog` takes `readOnly`: it lists `effect: read` tools only, and a write the actor could
  otherwise call answers `access.forbidden` saying the server is read-only. Over HTTP, `MCP_READ_ONLY` decides when
  set; unset, the server is read-only exactly while the public demo tokens are in force (no `MCP_TOKENS`, mock
  adapter). stdio is the developer's own session and writes unless `MCP_READ_ONLY=true`.

## Amendment 2026-11-04: its own Worker, a typed manifest, scopes and Origin validation (ADR 0016)

ADR 0016 makes the MCP server its own product (spec 004).

**What still holds:** the projection through the UI's client, the low-level `Server`, the mapping of `CallResult`,
and unlisted names answering `access.forbidden`.

**What changes:**

- **Its own Worker.**
  - `workers/mcp` serves `createMcpHandler` at `/mcp` on `mcp.admin-os.lr0y.dev`, beside the web app.
  - It imports the domain core through a composition root without Next or React. A dependency rule and a test over
    the bundle's metafile prove it.
  - `/api/mcp` answers `410` with a JSON-RPC error naming the new URL for one release, then goes (plan W3).
  - The "Runtime: Node" reason above (demo sessions in this process's memory) no longer applies: sessions live in the
    store's Durable Object (ADR 0005, amendment 2026-11-04).
  - stdio runs the same composition, and gains `MCP_SCOPES`, default `read` (plan W2, A2).
- **A typed manifest.**
  - `satisfies Record<CapabilityId, {expose, title, concise?} | {uiOnly: reason}>` selects and presents capabilities.
    Inputs always come from the capability, and a new capability does not compile until it is classified.
  - The projection table changes accordingly. `title` comes from the manifest, and the description still comes from
    `summary`.
  - Annotations come from the capability's facts, not only its `effect`. `destructiveHint` is true for destructive
    writes and for writes that overwrite or remove. `idempotentHint` is true for reads and set-state writes. A test pins
    them per tool.
  - `serverInfo.version` is a hash of the projected surface, tools are listed in a deterministic order, and
    `tools/list` carries the SDK's `CacheHint`. `tools.listChanged` stays `false`.
- **Idempotency.**
  - Create and add take a required `idempotencyKey` argument, and set-state writes take none (ADR 0016, D6).
  - `_meta["admin-os/idempotencyKey"]` is still accepted, and must match the argument when both are present.
  - The tool `_meta` flag `admin-os/requiresIdempotencyKey` (amendment 2026-11-03) becomes redundant once the key is a
    required argument.
- **Scopes `read` and `write`, with step-up.**
  - One OAuth 2.1 resource, through `workers-oauth-provider`, replaces the static demo tokens. The protected resource
    metadata now names the authorization server, and tokens are checked for this resource.
  - The grant is `{sessionId, role, scopes}`, bound to the visitor's signed demo session. The session-per-token rule
    and the shared public tokens go. Whether `MCP_TOKENS` stays for private deployments is decided in plan A1a.
  - `read` is the default grant, and `write` is a separate, revocable consent. A token without `write` lists no write.
    A write call answers HTTP `403` with `WWW-Authenticate: Bearer error="insufficient_scope", scope="write"`.
  - **An exception to "unknown and forbidden names answer the same".** The scope challenge is an HTTP answer, given
    before the projection runs, so it tells a write's name from an unknown one. The catalogue is public and its
    reference is generated from it (spec 004, AC10), so nothing secret is revealed. Names outside the role still answer
    `access.forbidden`.
  - **Where the challenge is answered.** SDK 2.4.0's `createMcpHandler` resolves per-call scope challenges only for an
    `McpServer` (`dist/index.mjs:1194`). The projection stays a low-level `Server`, for the reasons in "Options
    considered", so the Worker's gate answers the challenge with the SDK's `bearerAuthChallengeResponse`. The
    projection applies the same pure function to listing and to dispatch.
  - **A new revisit condition for option 1:** the per-tool `scopeChallenge` of `McpServer`, together with the
    conditions listed under "Revisit when".
  - **`MCP_READ_ONLY`** keeps the rule of the amendment above, and stays on for the public deployment until the scope
    tests pass (plan A1b). After that it remains a switch. Under it, a write answers `access.forbidden` with the
    read-only message, never a challenge.
- **Origin validation, reversing "Not added: host or origin allowlists".**
  - A request to `/mcp` whose `Origin` is present and not on the allowlist answers `403` (`validateOriginHeader`).
    Two things justify the reversal: the 2026-07-28 transport makes the check a MUST, and the consent flow now trusts
    the demo session cookie, which is the condition that line named for revisiting.
  - CORS exposes `WWW-Authenticate` and allows `Authorization`, `Content-Type`, `MCP-Protocol-Version`, `Mcp-Method`
    and `Mcp-Name`.
  - Workers rate limits guard `/register`, `/authorize`, `/token`, each grant, and new demo sessions per IP.
- **Logs.** The Worker writes one line per call, with the correlation id, client id, tool, status and duration.


## Amendment 2026-11-04: phase 3 as built (spec 004 T1, U1, U2, U3)

- **Manifest.** `src/config/mcp-manifest.ts` satisfies `ToolManifest<CatalogById>`; `bookings.status.undo` and
  `bookings.walk_in.undo` are UI-only (ADR 0016, resolution 3). The projection also throws at construction on an
  unclassified capability, an entry for no capability, or an empty title or reason.
- **Keys.** `bookings_create`, `bookings_walk_in_seat`, `customers_create` and `customers_notes_add` require the
  `idempotencyKey` argument; a host may still send `_meta["admin-os/idempotencyKey"]`, and a different key in each is
  `schema.invalid_input`. The tool `_meta` flag `admin-os/requiresIdempotencyKey` is removed; `_meta` carries the tier.
- **Annotations.** From the descriptor's `change` and `idempotency` (ADR 0005, amended 2026-11-04):
  `destructiveHint` for destructive writes and for `overwrite` and `remove`; `idempotentHint` for reads and every write
  with a mode. `src/config/mcp.server.test.ts` pins them per tool with the tier and the key (AC7).
- **Protocol metadata.** Tools are sorted by name; `instructions` say where ids come from and what a held write means,
  naming only the tools the actor sees; `serverInfo.version` is a 14-hex-digit hash of the manifest, the read-only
  switch and every tool the deployment exposes; `tools/list` carries
  `ttlMs: 300000, cacheScope: "private"` on the 2026-07-28 revision (the 2025 era has no cache fields).
- **Errors and descriptions that say how to fix the call.** A manifest entry's `ids` names, per id field, the tools
  that list valid values; the description appends them ("Find valid ids: id with bookings_list") and writes the
  capability ids a summary mentions as the tool names this actor is offered. `schema.invalid_input` keeps its `paths`
  and its message names each failing field, what is wrong with it and where a valid id comes from; a `*.not_found`
  answer and `client.idempotency_required` say what to send. Every `tools/call` result carries
  `_meta["admin-os/correlationId"]`, the id of the server's call log line. A call refused before dispatch (unknown,
  forbidden or read-only tool, missing or bad key) writes its own line, `{event: "mcp.refused", tool, status: <code>,
  correlationId, actorRole, via: "mcp"}`, so write attempts on a read-only server are audited.
- **Reference.** The [MCP reference](../mcp/reference.md) is generated from this projection by
  `npm run mcp:reference`; `src/config/mcp-reference.test.ts` fails while it is stale (spec 004 AC10).

## Amendment 2026-11-04: the transports move (spec 004 W1–W3)

- **Streamable HTTP** is the MCP Worker, `workers/mcp`, at `https://mcp.admin-os.lr0y.dev/mcp` (ADR 0016); `/api/mcp`
  answers `410` with a JSON-RPC error naming that URL. stdio runs the same composition root (`createMcpServerFor` in
  `src/config/mcp.server.ts`), and the bearer-token check lives in `src/config/mcp-auth.ts` until plan A1a.
