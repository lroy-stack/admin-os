# Deployment

The live demo runs on Cloudflare Workers through the [OpenNext adapter](https://opennext.js.org/cloudflare), as three
Workers:

| Worker | Config | Serves |
| --- | --- | --- |
| `admin-os` | [`wrangler.jsonc`](../../wrangler.jsonc) | The web app |
| `admin-os-demo-store` | [`workers/demo-store/wrangler.jsonc`](../../workers/demo-store/wrangler.jsonc) | The Durable Object that holds each visitor's demo data |
| `admin-os-mcp` | [`workers/mcp/wrangler.jsonc`](../../workers/mcp/wrangler.jsonc) | The MCP server, with OAuth |

`npm run deploy` checks what the deploy needs, builds the app, then deploys the store, the MCP Worker (which binds the
same store) and the app, in that order, so a failed build never leaves the store ahead of the app.

## Deploy your own

### 1. Name the Workers and their domains

In [`wrangler.jsonc`](../../wrangler.jsonc), rename the Worker (its `name` and the `WORKER_SELF_REFERENCE` service)
and replace the custom domain with a hostname on one of your Cloudflare zones. Do the same for the MCP Worker in
[`workers/mcp/wrangler.jsonc`](../../workers/mcp/wrangler.jsonc) (`mcp.admin-os.lr0y.dev` here). Cloudflare creates
the DNS record and the certificate of a custom domain on the first deploy.

Without a zone, remove `routes` and set `workers_dev` to `true` to serve on your workers.dev subdomain.

### 2. Log in

```bash
npx wrangler login
```

### 3. Set the shared session secret

The web Worker signs the visitor's demo session cookie, and the MCP Worker's consent page verifies the same cookie, so
both take one value of at least 32 characters. Run the three lines together: Cloudflare never shows a secret again.
Wrangler offers to create a Worker that does not exist yet.

```bash
value="$(openssl rand -base64 32)"
printf %s "$value" | npx wrangler secret put DEMO_SESSION_SECRET -c wrangler.jsonc
printf %s "$value" | npx wrangler secret put DEMO_SESSION_SECRET -c workers/mcp/wrangler.jsonc
```

The MCP Worker keeps OAuth clients and grants in a KV namespace bound as `OAUTH_KV`. Create it with
`npx wrangler kv namespace create OAUTH_KV` and put its `id` in
[`workers/mcp/wrangler.jsonc`](../../workers/mcp/wrangler.jsonc), or let `wrangler deploy` provision it.

To keep a visitor's data in the memory of each instance instead, remove `DATA_STORE`, `durable_objects` and
`DEMO_SESSION_SECRET`; the data then resets when Cloudflare recycles the instance.

### 4. Build and deploy with your public URL

The build writes the URL into canonical, Open Graph and sitemap links. Give the origin only: scheme and host, no path
and no trailing slash.

```bash
NEXT_PUBLIC_SITE_URL=https://admin-os.example.com npm run deploy
```

`npm run deploy` stops before building when:

- `NEXT_PUBLIC_SITE_URL` is unset or not a public https origin, read as the build reads it (the shell, then the `.env`
  files);
- either the web or the MCP Worker lacks `DEMO_SESSION_SECRET`. The message says which one and what to run.

### MCP tokens

On the mock adapter the MCP Worker accepts the public demo tokens, which are read-only. Set your own with:

```bash
npx wrangler secret put MCP_TOKENS -c workers/mcp/wrangler.jsonc
```

The format and the read-only switch are in [MCP](mcp.md#tokens-and-read-only-mode) and
[`.env.example`](../../.env.example).

## Check a deployment

```bash
npx wrangler deployments list -c wrangler.jsonc
npx wrangler deployments list -c workers/mcp/wrangler.jsonc
npx wrangler deployments list -c workers/demo-store/wrangler.jsonc
```

Each Worker should serve its new version at 100 %. Then, against your URLs:

```bash
BASE_URL=https://admin-os.example.com npm run probe:consistency -- web
BASE_URL=https://admin-os.example.com MCP_URL=https://mcp.admin-os.example.com/mcp npm run probe:consistency -- consent
```

- The web probe should report that every read saw the write (12 of 12 by default).
- The consent probe confirms that both Workers sign with the same secret. It registers one OAuth client per run.
- The MCP endpoint should answer `401` with a `WWW-Authenticate` header that names its resource metadata.

## Other hosts

The web app alone runs on any Node.js host (`npm run build && npm run start`). MCP then runs over stdio, or as the MCP
Worker on Cloudflare.
