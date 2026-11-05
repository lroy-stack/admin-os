# MCP

admin-OS ships a Model Context Protocol server, so an MCP-capable assistant can operate the dashboard with the same
capabilities and permissions as the screens ([ADR 0009](../adr/0009-mcp-server.md),
[ADR 0016](../adr/0016-mcp-server-as-its-own-product.md)). Every tool, per preset and role, is in the generated
[MCP reference](../mcp/reference.md).

| Transport | Where |
| --- | --- |
| Streamable HTTP | `https://mcp.admin-os.lr0y.dev/mcp` (the MCP Worker, `workers/mcp`); locally `http://localhost:8789/mcp` |
| stdio | `npm run --silent mcp:stdio`, from the repository root |

## Connect a client

### Claude Code

```bash
claude mcp add --transport http admin-os https://mcp.admin-os.lr0y.dev/mcp
```

Then run `/mcp` in a session and authenticate `admin-os`; the consent page opens in your browser. Open the demo at
<https://admin-os.lr0y.dev> in the same browser first if the agent should act on the data you see there.

Two other ways to add it:

```bash
# A public demo token instead of OAuth (read-only)
claude mcp add --transport http admin-os https://mcp.admin-os.lr0y.dev/mcp --header "Authorization: Bearer demo-staff-token"
```

```bash
# stdio, from the repository root, with writes
claude mcp add --scope project admin-os -e MCP_ROLE=owner -e "MCP_SCOPES=read write" -- npm run --silent mcp:stdio
```

### claude.ai

Add a custom connector with the URL `https://mcp.admin-os.lr0y.dev/mcp` and connect it. Claude registers itself and
opens the same consent page.

### Claude Desktop

Over stdio, in `claude_desktop_config.json`, with the absolute path of your clone:

```json
{
  "mcpServers": {
    "admin-os": {
      "command": "npm",
      "args": ["--prefix", "/absolute/path/to/admin-os", "run", "--silent", "mcp:stdio"],
      "env": { "MCP_ROLE": "owner", "MCP_SCOPES": "read write" }
    }
  }
}
```

Keep `--silent`: without it npm prints its banner on stdout, which carries the protocol.

## Access

### OAuth

The MCP Worker is its own authorization server. It publishes its metadata, registers clients dynamically and uses
PKCE with S256.

- **Consent.** A client that connects without a token is sent to a consent page on the Worker, which shows who asks
  and what it may do.
- **Whose data.** The grant acts on your own demo data: the session the web demo keeps in your browser (or a new one),
  as the role you picked there (owner by default).
- **Read and write are separate grants.** `read` is the default and lists read tools only. When the agent calls a
  write, it gets `403 insufficient_scope` and the client asks you again; the page then offers changes as a choice of
  its own. A client that does not ask again keeps its `read` grant.
- **Revoking.** `https://mcp.admin-os.lr0y.dev/grants` lists the apps connected to your browser's demo data and revokes
  any of them.

### Tokens and read-only mode

- `MCP_TOKENS` maps bearer tokens to roles (`<token>:<role>` pairs; see [`.env.example`](../../.env.example)).
- On the mock adapter, with `MCP_TOKENS` unset, the public tokens `demo-owner-token`, `demo-manager-token` and
  `demo-staff-token` work, each on demo data of its own. Anyone holds them, so they are **read-only**: they list and
  run read tools only. Your own `MCP_TOKENS` keep the writes.
- `MCP_READ_ONLY=true` makes every connection read-only, grants included.

### Limits

- Requests are rate-limited per grant, per token and client IP for the public tokens, and per client IP on the OAuth
  endpoints and before a token is checked. A limited request gets `429` with `Retry-After`.
- A browser page may call the server only from the demo's own origin or `claude.ai`.

### stdio

`MCP_ROLE` picks the role (default `staff`), `VERTICAL` the preset, and `MCP_SCOPES` what the process may do, as a
grant's scopes over HTTP: `read` by default, `read write` for the role's writes too.

## Tools

- **Idempotency.** Create and add tools take a required `idempotencyKey` argument: a new UUID for each operation, the
  same one to retry it safely. Other writes take no key and are safe to repeat.
- **Annotations.** Each tool says whether it only reads, whether it can overwrite or remove data, and whether a repeat
  is safe.
- **Approvals.** A write the approval policy holds waits for a person in the web app's bell; the agent checks it with
  `approvals_get`.
- **Settings.** `settings_values_get` reads the business settings; `settings_values_update` (owner only) changes them
  in the caller's demo session, sending each key with its whole value. Under the default policy the change waits for
  the owner's approval, and it never changes the approval policy itself.
- **Versioning.** `serverInfo.version` is a hash of the tool list, so it changes whenever a tool does. If a client
  keeps showing an old list after an update, reconnect it (in Claude Code, `/mcp`, then reconnect `admin-os`).
- **Moved endpoint.** The web app's old endpoint, `https://admin-os.lr0y.dev/api/mcp`, answers `410` with the new URL.

## Agent evals

`npm run eval:mcp` runs the golden tasks, one file per module in [`evals/mcp/tasks/`](../../evals/mcp/tasks) (the kernel's own, if any, in
[`evals/mcp/golden.json`](../../evals/mcp/golden.json)), through headless
Claude Code (`EVAL_MODEL`, default `sonnet`). It grades each trial from its tool results and a follow-up read of the
state, and writes pass rates and cost to `evals/mcp/results/`.

It spends your Claude usage and starts nothing itself:

1. Put `MCP_TOKENS=eval-owner-0001:owner` and `MCP_READ_ONLY=false` in `workers/mcp/.dev.vars`.
2. Start the Workers as in [The three Workers locally](development.md#the-three-workers-locally).
3. Start `npm run dev:mcp:read-only` as well.
