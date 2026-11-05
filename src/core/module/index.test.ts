import { describe, expect, it } from "vitest";
import { z } from "zod";

import { defineCapability } from "@/core/capability";
import { defineSetting } from "@/core/settings";

import { defineModule, type InstalledModule, isStringField, type ModuleManifest, moduleProblems } from "./index";

const plantedGet = defineCapability({
  id: "planted.item.get",
  summary: "Read one planted item.",
  input: z.object({ id: z.string() }),
  output: z.object({}),
  permission: "read:planted",
  effect: "read",
  riskTier: 0,
});
const plantedList = defineCapability({
  id: "planted.list",
  summary: "List planted items.",
  input: z.object({}),
  output: z.object({}),
  permission: "read:planted",
  effect: "read",
  riskTier: 0,
});
const otherList = defineCapability({
  id: "other.list",
  summary: "List other items.",
  input: z.object({}),
  output: z.object({}),
  permission: "read:other",
  effect: "read",
  riskTier: 0,
});
const capabilities = { "planted.item.get": plantedGet, "planted.list": plantedList } as const;

const plantedRow = z.object({
  id: z.string(),
  otherId: z.string().optional(),
  otherIds: z.array(z.string()),
  lines: z.array(z.object({ otherId: z.string(), quantity: z.number() })),
});

const planted = defineModule({
  id: "planted",
  capabilities,
  settings: [],
  mcp: {
    tools: {
      "planted.item.get": { expose: true, title: "Get an item", ids: { id: ["planted.list", "other.list"] } },
      "planted.list": { uiOnly: "Not for assistants" },
    },
  },
  seed: { planted: { schema: plantedRow, required: true, ext: { entity: "plantedItem", optional: false } } },
  references: [
    { collection: "planted", field: "otherId", module: "other", required: false },
    { collection: "planted", field: "lines[].otherId", module: "other", required: true },
  ],
  owns: ["src/app/planted", "e2e/planted.spec.ts"],
});

const other = defineModule({
  id: "other",
  capabilities: { "other.list": otherList },
  settings: [],
  mcp: { tools: { "other.list": { expose: true, title: "List other items" } } },
  seed: { others: { schema: z.object({ id: z.string() }), required: false } },
  references: [],
  owns: [],
});

const EXISTING = new Set(["src/app/planted", "src/app/planted/page.tsx", "src/app/plant", "e2e/planted.spec.ts"]);
const exists = (path: string) => EXISTING.has(path);

const installed = (...manifests: readonly ModuleManifest[]): InstalledModule[] =>
  manifests.map((manifest) => ({ folder: manifest.id, manifest }));

describe("defineModule (ADR 0017 §1)", () => {
  it("returns the manifest it is given", () => {
    const manifest = { ...planted };
    expect(defineModule(manifest)).toBe(manifest);
  });

  it("keeps a hint to another module's tool as a literal, for the composition root to check", () => {
    const hints: readonly ["planted.list", "other.list"] = planted.mcp.tools["planted.item.get"].ids.id;
    expect(hints).toEqual(["planted.list", "other.list"]);
  });

  it("does not compile when a capability is left unclassified", () => {
    const manifest = defineModule({
      ...planted,
      mcp: {
        // @ts-expect-error `planted.list` has no entry, so the manifest does not cover the module's catalogue.
        tools: { "planted.item.get": { expose: true, title: "Get an item" } },
      },
    });
    expect(Object.keys(manifest.mcp.tools)).not.toContain("planted.list");
  });

  it("does not compile when an entry names no capability of the module", () => {
    const manifest = defineModule({
      ...planted,
      mcp: {
        tools: {
          "planted.item.get": { expose: true, title: "Get an item" },
          "planted.list": { expose: true, title: "List items" },
          // @ts-expect-error `planted.find` is not a capability of the module.
          "planted.find": { expose: true, title: "Find items" },
        },
      },
    });
    expect(Object.keys(manifest.mcp.tools)).toContain("planted.find");
  });

  it("does not compile when an id hint names a field the capability has no input for", () => {
    const manifest = defineModule({
      ...planted,
      mcp: {
        tools: {
          // @ts-expect-error `itemId` is not an input field of `planted.item.get`.
          "planted.item.get": { expose: true, title: "Get an item", ids: { itemId: ["planted.list"] } },
          "planted.list": { expose: true, title: "List items" },
        },
      },
    });
    expect(manifest.mcp.tools["planted.item.get"]).toHaveProperty("ids");
  });

  it("does not compile when a capability is outside the module's prefix", () => {
    const manifest = defineModule({
      ...planted,
      id: "plants",
      // @ts-expect-error `planted.*` capabilities do not start with `plants.`.
      capabilities,
    });
    expect(manifest.id).toBe("plants");
  });
});

describe("isStringField (ADR 0017 §3)", () => {
  it.each([
    ["otherId", true],
    ["otherIds[]", true],
    ["lines[].otherId", true],
    ["lines[].quantity", false],
    ["lines.otherId", false],
    ["otherIds", false],
    ["missing", false],
    ["otherId[]", false],
  ] as const)("%s → %s", (path, expected) => {
    expect(isStringField(plantedRow, path)).toBe(expected);
  });

  const formats = z.object({
    uuid: z.uuid(),
    email: z.email(),
    code: z.templateLiteral(["bk_", z.string()]),
    caught: z.string().catch("x"),
    nonOptional: z.string().optional().nonoptional(),
    prefaulted: z.string().prefault("x"),
    lazy: z.lazy(() => z.string()),
    count: z.number().catch(0),
  });

  it.each([
    ["uuid", true],
    ["email", true],
    ["code", true],
    ["caught", true],
    ["nonOptional", true],
    ["prefaulted", true],
    ["lazy", true],
    ["count", false],
  ] as const)("counts the string format or wrapper %s → %s", (path, expected) => {
    expect(isStringField(formats, path)).toBe(expected);
  });

  it("reads through optional, default and pipe wrappers", () => {
    const wrapped = z.object({ lines: z.array(z.object({ otherId: z.string().default("x") })).optional() }).readonly();
    expect(isStringField(wrapped.pipe(z.any()), "lines[].otherId")).toBe(true);
  });
});

describe("moduleProblems (ADR 0017 §1–§3, §7)", () => {
  const optional = { ...planted, references: planted.references.map((ref) => ({ ...ref, required: false })) };
  const kernelHint = {
    ...planted,
    mcp: {
      tools: { ...planted.mcp.tools, "planted.item.get": { expose: true, title: "Get", ids: { id: ["clock.get"] } } },
    },
  } as const;

  it("finds none in consistent manifests", () => {
    expect(moduleProblems(installed(planted, other), exists)).toEqual([]);
  });

  it("accepts optional references and hints to a module that is not installed", () => {
    expect(moduleProblems(installed(optional), exists)).toEqual([]);
  });

  it("accepts a hint to a kernel tool without a reference, since the kernel is always installed", () => {
    expect(moduleProblems(installed(kernelHint, other), exists)).toEqual([]);
  });

  it("does not take a sibling path for an overlap", () => {
    expect(moduleProblems(installed(planted, { ...other, owns: ["src/app/plant"] }), exists)).toEqual([]);
  });

  const strayPrefix = defineSetting({
    key: "plants.stay",
    schema: z.number(),
    defaultValue: 1,
    section: "planted",
    permission: "update:settings",
    labelKey: "planted.settings.stay.label",
    descriptionKey: "planted.settings.stay.description",
  });

  it.each([
    [
      "an id that differs from its folder",
      [{ folder: "plants", manifest: planted }, ...installed(other)],
      'src/modules/plants: the manifest\'s id is "planted"; set it to "plants"',
    ],
    [
      "a capability outside the module's prefix",
      installed({ ...planted, capabilities: { ...capabilities, "other.list": otherList } }, other),
      'planted: capabilities other.list must be keyed by their own id, under "planted."',
    ],
    [
      "a capability under a key that is not its id",
      installed({ ...planted, capabilities: { ...capabilities, "planted.extra": plantedList } }, other),
      'planted: capabilities planted.extra must be keyed by their own id, under "planted."',
    ],
    [
      "a setting outside the module's prefix",
      installed({ ...planted, settings: [strayPrefix] }, other),
      'planted: settings plants.stay must start with "planted."',
    ],
    [
      "an owned path that does not exist",
      installed({ ...planted, owns: [...planted.owns, "src/app/gone"] }, other),
      "planted owns src/app/gone, which does not exist; fix the path or remove it from owns",
    ],
    [
      "a path owned by two modules",
      installed(planted, { ...other, owns: ["src/app/planted"] }),
      "src/app/planted (planted) and src/app/planted (other) overlap; a path has one owner",
    ],
    [
      "a path inside another module's owned folder",
      installed(planted, { ...other, owns: ["src/app/planted/page.tsx"] }),
      "src/app/planted (planted) and src/app/planted/page.tsx (other) overlap; a path has one owner",
    ],
    [
      "an owned path with a trailing slash",
      installed(planted, { ...other, owns: ["src/app/planted/"] }),
      'other owns "src/app/planted/"; write it from the repository root, without ".", ".." or an edge "/"',
    ],
    [
      "an owned path that starts with ./",
      installed(planted, { ...other, owns: ["./src/app/plant"] }),
      'other owns "./src/app/plant"; write it from the repository root, without ".", ".." or an edge "/"',
    ],
    [
      "a seed collection declared twice",
      installed(planted, { ...other, seed: { planted: { schema: plantedRow, required: false } } }),
      "the seed collection planted is declared by planted and other; one module owns it",
    ],
    [
      "an ext entity declared twice",
      installed(planted, {
        ...other,
        seed: { others: { ...other.seed.others, ext: { entity: "plantedItem", optional: true } } },
      }),
      "the ext entity plantedItem is declared by planted (planted) and other (others)",
    ],
    [
      "a required reference to a module that is not installed",
      installed(planted),
      "planted's reference planted.lines[].otherId → other is required, and other is not installed; restore src/modules/other or remove planted",
    ],
    [
      "a reference in a collection no installed module seeds",
      installed(
        { ...planted, references: [{ collection: "plants", field: "otherId", module: "other", required: false }] },
        other,
      ),
      "planted's reference plants.otherId → other: no installed module seeds the collection plants",
    ],
    [
      "a reference to a field that is not a string",
      installed(
        {
          ...planted,
          references: [{ collection: "planted", field: "lines[].quantity", module: "other", required: false }],
        },
        other,
      ),
      "planted's reference planted.lines[].quantity → other: lines[].quantity is not a string field of planted's rows",
    ],
    [
      "a hint to an own tool the module does not declare",
      installed(
        {
          ...planted,
          mcp: {
            ...planted.mcp,
            tools: {
              ...planted.mcp.tools,
              "planted.item.get": { expose: true, title: "Get", ids: { id: ["planted.find"] } },
            },
          },
        },
        other,
      ),
      "planted.item.get hints planted.find, which planted does not declare",
    ],
    [
      "a hint to a module the manifest does not reference",
      installed({ ...planted, references: [] }, other),
      "planted.item.get hints other.list, but planted declares no reference to other; add the reference",
    ],
    [
      "a hint to an installed module's tool it does not declare",
      installed(planted, { ...other, capabilities: {}, mcp: { tools: {} } }),
      "planted.item.get hints other.list, which other does not declare",
    ],
  ] as const)("reports %s, and only that", (_case, modules, problem) => {
    expect(moduleProblems(modules, exists)).toEqual([problem]);
  });
});
