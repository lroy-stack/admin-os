// Fails the deploy before it starts when it would ship without what it needs: the public URL the build writes into its
// links, and the secrets each Worker cannot serve without. It reads the URL from the environment the build sees (the
// shell, then the .env files `next build` loads) and only the secret names from `wrangler secret list`, never values.

import nextEnv from "@next/env";

import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const LOCAL_HOSTS = new Set(["localhost", "0.0.0.0", "[::1]"]);
const SITE_URL_FIX = [
  "The build writes it into canonical, Open Graph and sitemap links; deploy with your public URL:",
  "",
  "NEXT_PUBLIC_SITE_URL=https://admin-os.example.com npm run deploy",
].join("\n");

const isLocalHost = (hostname) => {
  const host = hostname.replace(/\.$/, "");
  return LOCAL_HOSTS.has(host) || host.endsWith(".localhost") || host.startsWith("127.");
};

// The links are the origin followed by a route, so anything after the host (even a trailing slash) breaks them.
const isPublicOrigin = (value) => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return url.protocol === "https:" && url.origin === value && !isLocalHost(url.hostname);
};

/** Why the build would write a wrong public URL into its links; empty when `value` is a public https origin. */
export function siteUrlError(value) {
  if (value === undefined || value === "") return `NEXT_PUBLIC_SITE_URL is not set. ${SITE_URL_FIX}`;
  return isPublicOrigin(value)
    ? ""
    : `NEXT_PUBLIC_SITE_URL is "${value}", not the public https origin of the site (scheme and host only). ${SITE_URL_FIX}`;
}

/** The secrets each Worker cannot serve without. A secret that several Workers require holds one value on all of them. */
export const WORKERS = [
  { worker: "web", config: "wrangler.jsonc", secrets: ["DEMO_SESSION_SECRET"] },
  { worker: "MCP", config: "workers/mcp/wrangler.jsonc", secrets: ["DEMO_SESSION_SECRET"] },
];

/** The required names that `wrangler secret list --format json` output does not contain. */
export function missingSecrets(listOutput, required) {
  const present = new Set(JSON.parse(listOutput).map((secret) => secret.name));
  return required.filter((name) => !present.has(name));
}

/** The commands that give every Worker requiring `name` one new value. */
export function putBlock(name, workers) {
  return [
    `value="$(openssl rand -base64 32)"`,
    ...workers.map(({ config }) => `printf %s "$value" | npx wrangler secret put ${name} -c ${config}`),
  ].join("\n");
}

const names = (workers) => workers.map(({ worker }) => worker).join(" and ");
const lack = (workers) =>
  workers.length > 1 ? `The ${names(workers)} Workers have` : `The ${names(workers)} Worker has`;

function advice(name, checked) {
  const holders = checked.filter(({ secrets }) => secrets.includes(name));
  const lacking = holders.filter(({ missing }) => missing.includes(name));
  const holding = holders.filter(({ missing }) => !missing.includes(name));
  if (holding.length === 0) {
    const shared = holders.length > 1 ? "; they share one value" : "";
    return `${lack(lacking)} no secret ${name}. Set it before deploying${shared}:\n\n${putBlock(name, holders)}`;
  }
  return [
    `${lack(lacking)} no secret ${name}, which holds the same value as on the ${names(holding)} Worker.`,
    `If you still have that value, put it on the ${names(lacking)} Worker only:`,
    "",
    ...lacking.map(({ config }) => `npx wrangler secret put ${name} -c ${config}`),
    "",
    "Cloudflare cannot show a secret again. Without the value, set a new one on every Worker; it ends what the old one signed:",
    "",
    putBlock(name, holders),
  ].join("\n");
}

/** What to run when Workers lack secrets; empty when every Worker has what it requires. */
export function deployCheckMessage(checked) {
  const missing = [...new Set(checked.flatMap(({ missing }) => missing))];
  return missing.map((name) => advice(name, checked)).join("\n\n");
}

function listSecrets({ worker, config }) {
  try {
    return execFileSync("npx", ["wrangler", "secret", "list", "--format", "json", "-c", config], { encoding: "utf8" });
  } catch {
    throw new Error(
      `Could not list the secrets of the ${worker} Worker (${config}). Log in with \`npx wrangler login\`; a Worker that does not exist yet is created by putting its first secret.`,
    );
  }
}

/** The secrets advice, or why the secrets could not be read; the site URL is reported either way. */
function secretsProblem() {
  try {
    return deployCheckMessage(
      WORKERS.map((entry) => ({ ...entry, missing: missingSecrets(listSecrets(entry), entry.secrets) })),
    );
  } catch (error) {
    return error.message;
  }
}

function main() {
  // The production build's view: the shell's variables win, then .env.production.local, .env.local, .env.production, .env.
  nextEnv.loadEnvConfig(process.cwd(), false, { info: () => undefined, error: console.error });
  const message = [siteUrlError(process.env.NEXT_PUBLIC_SITE_URL), secretsProblem()]
    .filter((part) => part !== "")
    .join("\n\n");
  if (message === "") return;
  console.error(message);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
