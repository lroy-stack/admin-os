import ts from "typescript";
import { describe, expect, it } from "vitest";

import { VERTICALS } from "./vertical";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = join(__dirname, "..");
const GENERIC_LAYERS = ["core", "ds", "engines", "modules"];
/** Layers that exist today; `engines` joins this list when its first engine lands. */
const EXISTING_LAYERS = ["core", "ds", "modules"];

function sourceFilesOf(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { recursive: true, encoding: "utf8" })
    .filter((path) => /\.tsx?$/.test(path))
    .map((path) => join(directory, path));
}

function isTextNode(node: ts.Node): node is ts.Node & { text: string } {
  return (
    ts.isIdentifier(node) ||
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isTemplateHead(node) ||
    ts.isTemplateMiddle(node) ||
    ts.isTemplateTail(node) ||
    ts.isJsxText(node) ||
    ts.isPrivateIdentifier(node) ||
    ts.isRegularExpressionLiteral(node)
  );
}

/** Identifiers, string and template literals and JSX text; comments never reach the AST nodes we read. */
function textsOf(path: string): string[] {
  const file = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
  const texts: string[] = [];
  const visit = (node: ts.Node) => {
    if (isTextNode(node)) texts.push(node.text);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return texts;
}

/** Lower-case words of a text: camelCase, snake_case, kebab-case and ordinary prose all split. */
function wordsOf(text: string): string[] {
  return text
    .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}]+/u)
    .filter((word) => word !== "")
    .map((word) => word.toLowerCase());
}

/** A leak term matches as a whole word, singular or plural (`vehicle`, `vehicles`; `dish`, `dishes`). */
function matchesTerm(word: string, term: string): boolean {
  return new RegExp(`^${term.toLowerCase()}(s|es)?$`).test(word);
}

const genericFiles = GENERIC_LAYERS.flatMap((layer) => sourceFilesOf(join(SRC, layer)));
const genericWords = genericFiles.map((path) => ({
  file: relative(SRC, path),
  words: [...new Set(textsOf(path).flatMap(wordsOf))],
}));

describe("leak check", () => {
  it.each(EXISTING_LAYERS)("reads files in %s", (layer) => {
    expect(sourceFilesOf(join(SRC, layer)).length).toBeGreaterThan(0);
  });

  it("splits identifiers and prose into lower-case words", () => {
    expect(wordsOf("bookings.table_taken diningRoom HTMLDiner Esa mesa")).toEqual([
      "bookings",
      "table",
      "taken",
      "dining",
      "room",
      "html",
      "diner",
      "esa",
      "mesa",
    ]);
  });

  it.each([
    ["vehicles", "vehicle"],
    ["dishes", "dish"],
    ["mesas", "mesa"],
    ["comensales", "comensal"],
    ["stylists", "stylist"],
  ])("matches the plural %s of %s", (plural, term) => {
    expect(matchesTerm(plural, term)).toBe(true);
  });

  it.each([
    ["vehicular", "vehicle"],
    ["dishonest", "dish"],
    ["cartas", "carte"],
  ])("does not match %s against %s", (word, term) => {
    expect(matchesTerm(word, term)).toBe(false);
  });

  it.each(Object.values(VERTICALS).map((preset) => [preset.id, preset.leakTerms] as const))(
    "keeps the %s terms out of core, ds, engines and modules",
    (_id, terms) => {
      const leaks = genericWords.flatMap(({ file, words }) =>
        terms.filter((term) => words.some((word) => matchesTerm(word, term))).map((term) => `${file}: ${term}`),
      );
      expect(leaks).toEqual([]);
    },
  );
});
