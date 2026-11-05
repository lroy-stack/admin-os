import { MODULES } from "@/config/modules.generated";

import { type GoldenSet, mergeGolden } from "./eval-mcp-grade";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The installed modules, in id order: each may own `evals/mcp/tasks/<id>.json`. A removed module is not listed, and a
 * module without golden tasks has no file, so its tasks are simply not in the set (ADR 0017 §7).
 */
export const TASK_MODULES: readonly string[] = MODULES.map(({ id }) => id);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

/** `golden.json` merged with the task file of every module in `modules` that has one under `root`/evals/mcp/tasks. */
export function loadGolden(root: string, modules: readonly string[] = TASK_MODULES): GoldenSet {
  const files = modules
    .map((id) => join(root, "evals/mcp/tasks", `${id}.json`))
    .filter((path) => existsSync(path))
    .map(readJson);
  return mergeGolden(readJson(join(root, "evals/mcp/golden.json")), files);
}
