/**
 * Proves AC1 on the bundles themselves (ADR 0016): every Worker under `workers/` is bundled the way `wrangler deploy`
 * bundles it (`--dry-run`, nothing is uploaded), and its esbuild metafile must list no input from Next, React,
 * lucide-react or the web layers. The dependency-cruiser rule `workers-reach-no-web-code` checks the import graph;
 * this checks what would ship, including anything the graph cannot see (aliases, conditions, dynamic imports).
 *
 * Run by `npm run check`; about a second per Worker (measured: 1.9 s for both), since it only bundles.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const FORBIDDEN =
  /(^|\/)(node_modules\/(next|react|react-dom|lucide-react|@opennextjs\/[^/]+)\/|src\/(app|ds|components|engines|data)\/|src\/config\/(runtime|web-store\.server)\.ts$)/;
const WRANGLER = join("node_modules", ".bin", "wrangler");

const workers = readdirSync("workers", { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join("workers", entry.name, "wrangler.jsonc")))
  .map((entry) => entry.name)
  .sort();

if (workers.length === 0) throw new Error("No workers/<name>/wrangler.jsonc found; run this from the repository root.");

const failures = [];
for (const worker of workers) {
  const outdir = mkdtempSync(join(tmpdir(), `admin-os-${worker}-`));
  try {
    const metafile = join(outdir, "meta.json");
    execFileSync(
      WRANGLER,
      [
        "deploy",
        "--dry-run",
        "-c",
        join("workers", worker, "wrangler.jsonc"),
        "--outdir",
        outdir,
        "--metafile",
        metafile,
      ],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
    const inputs = Object.keys(JSON.parse(readFileSync(metafile, "utf8")).inputs);
    const forbidden = inputs.filter((input) => FORBIDDEN.test(input));
    if (inputs.length === 0) failures.push(`${worker}: the metafile lists no inputs, so nothing was checked`);
    if (forbidden.length > 0) failures.push(`${worker}: ${forbidden.join(", ")}`);
    console.log(`${worker}: ${inputs.length} inputs, ${forbidden.length} forbidden`);
  } finally {
    rmSync(outdir, { recursive: true, force: true });
  }
}

if (failures.length > 0) {
  console.error(
    `Worker bundles reach web-only code (ADR 0016, AC1); follow the import with "npm run depcruise":\n${failures.join("\n")}`,
  );
  process.exit(1);
}
