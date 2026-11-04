// Fails the deploy before it starts when a Worker lacks a secret it cannot serve without. It reads only the secret
// names from `wrangler secret list`, never their values.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

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
    console.error(
      `Could not list the secrets of the ${worker} Worker (${config}). Log in with \`npx wrangler login\`; a Worker that does not exist yet is created by putting its first secret.`,
    );
    process.exit(1);
  }
}

function main() {
  const checked = WORKERS.map((entry) => ({ ...entry, missing: missingSecrets(listSecrets(entry), entry.secrets) }));
  const message = deployCheckMessage(checked);
  if (message === "") return;
  console.error(message);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
