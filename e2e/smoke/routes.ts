import { readdirSync } from "node:fs";
import path from "node:path";

const APP_DIR = path.join(process.cwd(), "src", "app");

/** Folders that only group files (`(main)`) or are dynamic (`[...not-found]`) never name a fixed route. */
const isGroup = (segment: string) => segment.startsWith("(") && segment.endsWith(")");
const isDynamic = (segment: string) => segment.includes("[");

function collect(directory: string, segments: string[]): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const own = entries.some((entry) => entry.isFile() && entry.name === "page.tsx")
    ? [`/${segments.filter((segment) => !isGroup(segment)).join("/")}`]
    : [];
  const nested = entries
    .filter((entry) => entry.isDirectory() && !isDynamic(entry.name) && !entry.name.startsWith("_"))
    .flatMap((entry) => collect(path.join(directory, entry.name), [...segments, entry.name]));
  return [...own, ...nested];
}

/**
 * Every page route of the demo build, derived from the `page.tsx` files under `src/app` so a new screen joins the
 * sweeps without a list to maintain: route groups vanish from the path, dynamic catch-alls (`[...not-found]`) and
 * private `_` folders are left out.
 */
export const PAGE_ROUTES: readonly string[] = [...new Set(collect(APP_DIR, []))].sort();
