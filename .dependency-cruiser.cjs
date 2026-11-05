/**
 * Boundary gate for the package-shaped layers (docs/adr/0003-package-shaped-layers.md).
 * Rules are regexes over layer and package paths, so a new package under any layer needs no edit here.
 * Group matching: `$1` and `$2` in a `to` pattern refer to the capture groups of `from.path`.
 */

/** Layers in dependency order: a layer never imports one that comes after it. */
const LAYERS = ["core", "ds", "engines", "modules", "verticals", "config", "app"];
/** Layers whose folders are packages (`src/<layer>/<package>/`) with public entries. */
const PACKAGED = "core|ds|engines|modules|verticals";
/**
 * What a relative import may not leave: one package for engines, modules and verticals; the whole layer for
 * core and ds, whose packages are first-level subpaths of one layer and may reach each other relatively.
 */
const UNIT = "(?:engines|modules|verticals)/[^/]+|core|ds";
/** Platform code below the layers (shadcn primitives, generic utilities). */
const PLATFORM = "^src/(lib|hooks|components/(ui|calendar))/";
/** Public entries of a package: `index`, `server`, `ui` or `client`, as a file or a folder index. */
const ENTRY = "(index|server|ui|client)(/index)?\\.tsx?$";

const SEE = "docs/adr/0003-package-shaped-layers.md";

/** Paths outside `src/modules` that a module owns, written by `npm run generate:modules` (ADR 0017 §4). */
const OWNED = require("./src/config/modules.owns.generated.json").owned;
/** The bell imports `notifications` until plan 006 M10 composes it from the modules' feeds; M10 deletes this list. */
const PENDING_M10 = [
  "src/app/(main)/dashboard/layout.tsx",
  "src/app/(main)/dashboard/_components/notification-actions.ts",
  "src/app/(main)/dashboard/_components/notification-view.ts",
  "src/app/(main)/dashboard/_components/notification-view.test.ts",
];
const exactPath = (path) => `^${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/|$)`;

const upwardRule = (name, from, higher) => ({
  name,
  severity: "error",
  comment: `${name.replace("no-upward-import-from-", "")} is a lower layer; a lower layer never imports a higher one (${SEE})`,
  from: { path: from },
  to: { path: `^src/(${higher.join("|")})/` },
});

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "modules-only-through-composition",
      severity: "error",
      comment:
        "outside src/modules, only the generated composition, the presets and a module's owned paths import a module; add the path to the module's owns and run npm run generate:modules (docs/adr/0017-a-module-is-a-folder.md §4)",
      from: {
        path: "^(src|workers)/",
        pathNot: [
          "^src/modules/",
          "^src/config/[^/]+\\.generated\\.ts$",
          "^src/verticals/",
          ...[...OWNED, ...PENDING_M10].map(exactPath),
        ],
      },
      to: { path: "^src/modules/" },
    },
    upwardRule("no-upward-import-from-platform", PLATFORM, LAYERS),
    ...LAYERS.slice(0, -1).map((layer, i) =>
      upwardRule(`no-upward-import-from-${layer}`, `^src/${layer}/`, LAYERS.slice(i + 1)),
    ),
    {
      name: "no-deep-import",
      severity: "error",
      comment: `import a package only through its index, server or ui entry (${SEE})`,
      from: { path: `^src/(${PACKAGED})/([^/]+)/` },
      to: {
        path: `^src/(${PACKAGED})/[^/]+/`,
        pathNot: [`^src/$1/$2/`, `^src/(${PACKAGED})/[^/]+/${ENTRY}`, "^src/ds/preferences/actions\\.tsx?$"],
      },
    },
    {
      name: "no-deep-import-from-outside-packages",
      severity: "error",
      comment: `import a package only through its index, server or ui entry (${SEE})`,
      from: { path: "^src/", pathNot: `^src/(${PACKAGED})/[^/]+/` },
      to: {
        path: `^src/(${PACKAGED})/[^/]+/`,
        pathNot: [`^src/(${PACKAGED})/[^/]+/${ENTRY}`, "^src/ds/preferences/actions\\.tsx?$"],
      },
    },
    {
      name: "i18n-client-entry-for-tsx",
      severity: "error",
      comment:
        "components import i18n through @/core/i18n/client; the full barrel carries every locale's error messages and the zod schemas, which must not reach the browser (docs/adr/0007-i18n-typed-dictionaries.md)",
      from: { path: "^src/.*\\.tsx$", pathNot: "\\.test\\.tsx$" },
      to: { path: "^src/core/i18n/index\\.ts$" },
    },
    {
      name: "no-relative-escape",
      severity: "error",
      comment: `a relative import may not leave its package; use the @/ alias (${SEE})`,
      from: { path: `^src/(${UNIT})/` },
      to: { path: "^src/", pathNot: "^src/$1/", dependencyTypesNot: ["aliased"] },
    },
    {
      name: "no-engine-to-engine",
      severity: "error",
      comment: `one engine may not import another engine (${SEE})`,
      from: { path: "^src/engines/([^/]+)/" },
      to: { path: "^src/engines/", pathNot: "^src/engines/$1/" },
    },
    {
      name: "no-preset-to-preset",
      severity: "error",
      comment: `one preset may not import another preset (${SEE})`,
      from: { path: "^src/verticals/([^/]+)/" },
      to: { path: "^src/verticals/", pathNot: "^src/verticals/$1/" },
    },
    {
      name: "workers-reach-no-web-code",
      severity: "error",
      comment:
        "a Worker entry never reaches Next, React, lucide-react or the web layers: the Workers deploy without the web app (docs/adr/0016-mcp-server-as-its-own-product.md, AC1)",
      from: { path: "^workers/(mcp|demo-store)/src/index\\.ts$" },
      to: {
        reachable: true,
        path: [
          "^node_modules/(next|react|react-dom|lucide-react|@opennextjs/[^/]+)/",
          "^src/(app|ds|components|engines|data)/",
          "^src/config/(runtime|web-store\\.server)\\.ts$",
        ],
      },
    },
    {
      name: "src-never-imports-workers",
      severity: "error",
      comment:
        "the Workers compose src; src never depends on a Worker (docs/adr/0016-mcp-server-as-its-own-product.md)",
      from: { path: "^src/" },
      to: { path: "^workers/" },
    },
    {
      name: "ds-is-domain-free",
      severity: "error",
      comment: `ds never imports demo data (${SEE})`,
      from: { path: "^src/ds/" },
      to: { path: "^src/data/" },
    },
  ],
  options: {
    // node_modules appear only as the packages the Worker rule forbids, so the rule can see them reached.
    includeOnly: ["^src/", "^workers/", "^node_modules/(next|react|react-dom|lucide-react|@opennextjs/[^/]+)/"],
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
