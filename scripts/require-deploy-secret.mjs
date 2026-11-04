// Fails the deploy before it starts when the web Worker lacks a secret it cannot serve without. It reads only the
// secret names from `wrangler secret list`, never their values.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const REQUIRED = ["DEMO_SESSION_SECRET"];

/** The required names that `wrangler secret list --format json` output does not contain. */
export function missingSecrets(listOutput, required = REQUIRED) {
  const present = new Set(JSON.parse(listOutput).map((secret) => secret.name));
  return required.filter((name) => !present.has(name));
}

function main() {
  const listOutput = execFileSync("npx", ["wrangler", "secret", "list", "--format", "json"], { encoding: "utf8" });
  const missing = missingSecrets(listOutput);
  if (missing.length === 0) return;
  console.error(
    `The Worker has no secret ${missing.join(", ")}. Set it before deploying, for example:\n  openssl rand -base64 32 | npx wrangler secret put ${missing[0]}`,
  );
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
