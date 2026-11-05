import { approvalsSettings } from "@/core/approvals";
import { businessSettings } from "@/core/business";
import { mergeSettings } from "@/core/settings";

import { MODULES } from "./modules.generated";

/**
 * Every setting the kit ships: the kernel's, then the installed modules' in id order (ADR 0017 §5). A preset overrides
 * defaults through `settingsDefaults` (ADR 0004).
 */
export const SETTINGS = mergeSettings(
  ...approvalsSettings,
  ...businessSettings,
  ...MODULES.flatMap(({ settings }) => settings),
);
