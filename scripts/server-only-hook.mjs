/**
 * Lets server modules load outside Next (ADR 0009): `server-only` throws unless it resolves with the
 * `react-server` condition, which Next sets for its server bundles. This hook adds that condition for
 * `server-only` alone, so React and every other package still resolve as in plain Node.
 */
import { registerHooks } from "node:module";

if (typeof registerHooks !== "function") {
  throw new Error("scripts/server-only-hook.mjs needs Node.js 22.15 or later (module.registerHooks).");
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier !== "server-only") return nextResolve(specifier, context);
    return nextResolve(specifier, { ...context, conditions: ["react-server", ...context.conditions] });
  },
});
