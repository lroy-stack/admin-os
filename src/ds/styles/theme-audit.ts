/**
 * Contrast audit for the liquid-glass theme presets.
 *
 * Reads the token CSS (tokens.css plus every preset), resolves each theme and mode the way the cascade does, and
 * measures WCAG 2.2 contrast on the composited glass surface: the backdrop's lightest and darkest stop, then the
 * overlay, then the surface fill, then the text. Pure functions only; the caller reads the files.
 *
 * Model and its limits:
 * - Alpha compositing is source-over in gamma-encoded sRGB, as browsers paint.
 * - `brightness()` is applied in linear light, the conservative choice for both modes (it darkens or lightens the
 *   least). `saturate()` is ignored: it preserves luminance. Blur averages the backdrop, so the extremes bound it.
 * - Out-of-gamut OKLCH is clipped to sRGB.
 */

export type ThemeMode = "light" | "dark";

/** Gamma-encoded sRGB channels and alpha, each 0..1. */
export type Rgba = { r: number; g: number; b: number; a: number };

export type Rule = { selectors: string[]; declarations: Record<string, string> };

export type TokenMap = Record<string, string>;

export type AuditRow = {
  theme: string;
  mode: ThemeMode;
  pair: string;
  ratio: number;
  minimum: number;
  pass: boolean;
};

const TEXT = 4.5;
const UI = 3;

// --- CSS parsing -----------------------------------------------------------------------------------------------

/** Top-level style rules of a flat token file. At-rules (`@theme`, `@media`, `@custom-variant`) are skipped. */
export function parseRules(css: string): Rule[] {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: Rule[] = [];
  let index = 0;

  while (index < source.length) {
    const open = source.indexOf("{", index);
    const semicolon = source.indexOf(";", index);
    if (open === -1) break;

    const prelude = source.slice(index, open).trim();
    if (prelude.startsWith("@") && semicolon !== -1 && semicolon < open) {
      index = semicolon + 1;
      continue;
    }

    const close = matchingBrace(source, open);
    const body = source.slice(open + 1, close);
    if (!prelude.startsWith("@")) {
      rules.push({ selectors: splitTopLevel(prelude).map(normaliseSelector), declarations: parseDeclarations(body) });
    }
    index = close + 1;
  }

  return rules;
}

function matchingBrace(source: string, open: number): number {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") depth--;
    if (depth === 0) return i;
  }
  throw new Error(`Unbalanced braces in token CSS near offset ${open}`);
}

function parseDeclarations(body: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  for (const declaration of splitTopLevel(body, ";")) {
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;
    const name = declaration.slice(0, colon).trim();
    if (!name.startsWith("--")) continue;
    declarations[name] = declaration
      .slice(colon + 1)
      .replace(/\s+/g, " ")
      .trim();
  }
  return declarations;
}

function normaliseSelector(selector: string): string {
  return selector.replace(/\s+/g, " ").replace(/'/g, '"').trim();
}

/** Splits on a separator that is not nested inside parentheses. */
export function splitTopLevel(value: string, separator = ","): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === separator && depth === 0) {
      parts.push(value.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(value.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

// --- Cascade ---------------------------------------------------------------------------------------------------

const presetSelector = (theme: string) => `:root[data-theme-preset="${theme}"]`;

/** Preset ids declared by `:root[data-theme-preset="…"]` rules, in source order. */
export function presetIds(rules: Rule[]): string[] {
  const ids = new Set<string>();
  for (const rule of rules) {
    for (const selector of rule.selectors) {
      const match = selector.match(/^:root\[data-theme-preset="([^"]+)"\]$/);
      if (match?.[1]) ids.add(match[1]);
    }
  }
  return [...ids];
}

/**
 * Custom properties on <html> for one theme and mode, in cascade order: the shared `:root` layer, then `.dark`, then
 * the preset's light block (it matches in both modes), then its dark block.
 */
export function themeTokens(rules: Rule[], theme: string, mode: ThemeMode): TokenMap {
  const layers = [":root", ".dark", presetSelector(theme), `.dark${presetSelector(theme)}`].filter(
    (selector) => mode === "dark" || !selector.startsWith(".dark"),
  );
  const tokens: TokenMap = {};
  for (const layer of layers) {
    for (const rule of rules) {
      if (rule.selectors.includes(layer)) Object.assign(tokens, rule.declarations);
    }
  }
  return tokens;
}

/** Declarations of one exact selector, merged across rules. */
export function declarationsOf(rules: Rule[], selector: string): Record<string, string> {
  return Object.assign({}, ...rules.filter((rule) => rule.selectors.includes(selector)).map((r) => r.declarations));
}

/** Substitutes `var(--x)` and `var(--x, fallback)` until none is left. */
export function resolve(tokens: TokenMap, value: string, depth = 0): string {
  if (depth > 32) throw new Error(`var() cycle while resolving "${value}"`);
  const start = value.indexOf("var(");
  if (start === -1) return value;

  let depthCount = 0;
  let end = start + 3;
  for (; end < value.length; end++) {
    if (value[end] === "(") depthCount++;
    if (value[end] === ")") depthCount--;
    if (depthCount === 0) break;
  }

  const [name = "", ...fallback] = splitTopLevel(value.slice(start + 4, end));
  const replacement = tokens[name] ?? (fallback.length ? fallback.join(",") : undefined);
  if (replacement === undefined) throw new Error(`Undefined custom property ${name}`);
  return resolve(tokens, value.slice(0, start) + replacement + value.slice(end + 1), depth + 1);
}

export function tokenColor(tokens: TokenMap, name: string): Rgba {
  const value = tokens[name];
  if (value === undefined) throw new Error(`Undefined custom property ${name}`);
  return parseColor(resolve(tokens, value));
}

// --- Colour ----------------------------------------------------------------------------------------------------

type Lab = { l: number; a: number; b: number; alpha: number };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function parseNumber(token: string, percentScale: number): number {
  if (token === "none") return 0;
  if (token.endsWith("%")) return (Number.parseFloat(token) / 100) * percentScale;
  const number = Number.parseFloat(token);
  if (Number.isNaN(number)) throw new Error(`Not a number: "${token}"`);
  return number;
}

function labToRgba({ l, a, b, alpha }: Lab): Rgba {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const [lc, mc, sc] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const red = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const green = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const blue = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;
  return { r: toGamma(clamp01(red)), g: toGamma(clamp01(green)), b: toGamma(clamp01(blue)), a: alpha };
}

function rgbaToLab({ r, g, b, a }: Rgba): Lab {
  const [red, green, blue] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * red + 0.5363137081 * green + 0.0514654996 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    alpha: a,
  };
}

function parseOklch(args: string): Rgba {
  const [channels = "", alphaToken] = args.split("/").map((part) => part.trim());
  const [lToken = "", cToken = "", hToken = ""] = channels.split(/\s+/);
  const l = parseNumber(lToken, 1);
  const c = parseNumber(cToken, 0.4);
  const h = (parseNumber(hToken, 1) * Math.PI) / 180;
  const alpha = alphaToken === undefined ? 1 : parseNumber(alphaToken, 1);
  return labToRgba({ l, a: c * Math.cos(h), b: c * Math.sin(h), alpha });
}

/** `color-mix(in oklab, A p%, B q%)`, premultiplied as CSS Color 5 specifies. */
function parseColorMix(args: string): Rgba {
  const [space = "", first = "", second = ""] = splitTopLevel(args);
  if (space.trim() !== "in oklab") throw new Error(`Only color-mix(in oklab, …) is supported, got "${space}"`);

  const split = (part: string) => {
    const match = part.match(/^(.*?)(?:\s+(\d+(?:\.\d+)?)%)?$/);
    return { color: parseColor(match?.[1] ?? part), weight: match?.[2] ? Number(match[2]) / 100 : undefined };
  };
  const a = split(first);
  const b = split(second);
  const wa = a.weight ?? (b.weight === undefined ? 0.5 : 1 - b.weight);
  const wb = b.weight ?? 1 - wa;
  const total = wa + wb;
  const [la, lb] = [rgbaToLab(a.color), rgbaToLab(b.color)];
  const alpha = (la.alpha * wa + lb.alpha * wb) / total;
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (key: "l" | "a" | "b") => (la[key] * la.alpha * wa + lb[key] * lb.alpha * wb) / total / alpha;
  return labToRgba({ l: mix("l"), a: mix("a"), b: mix("b"), alpha: alpha * Math.min(1, total) });
}

/** Parses the colour syntaxes the token files use: `oklch()`, `color-mix(in oklab, …)`, `transparent`. */
export function parseColor(value: string): Rgba {
  const trimmed = value.trim();
  if (trimmed === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  const match = trimmed.match(/^([a-z-]+)\(([\s\S]*)\)$/);
  if (match?.[1] === "oklch") return parseOklch(match[2] ?? "");
  if (match?.[1] === "color-mix") return parseColorMix(match[2] ?? "");
  throw new Error(`Unsupported colour "${value}"`);
}

/** Source-over: `top` painted on an opaque `bottom`. */
export function over(top: Rgba, bottom: Rgba): Rgba {
  const mix = (t: number, b: number) => t * top.a + b * (1 - top.a);
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

/** `brightness(factor)` in linear light. */
export function brightness(color: Rgba, factor: number): Rgba {
  const scale = (c: number) => toGamma(clamp01(toLinear(c) * factor));
  return { r: scale(color.r), g: scale(color.g), b: scale(color.b), a: color.a };
}

export function relativeLuminance({ r, g, b }: Rgba): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(a: Rgba, b: Rgba): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** OKLCH lightness and chroma of a colour, for checks on a lightness ladder or a chroma budget. */
export function toOklch(color: Rgba): { l: number; c: number; h: number } {
  const { l, a, b } = rgbaToLab(color);
  return { l, c: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
}

/**
 * A pattern texture painted with `ink` on white multiplies the fill under it. three.js samples the canvas texture
 * without colour decoding, so the encoded ink value scales the fill in linear light.
 */
export function multiplyTexture(fill: Rgba, ink: Rgba): Rgba {
  const scale = (f: number, i: number) => toGamma(toLinear(f) * i);
  return { r: scale(fill.r, ink.r), g: scale(fill.g, ink.g), b: scale(fill.b, ink.b), a: 1 };
}

/** Euclidean distance in OKLab, used to keep the table states apart from each other. */
export function oklabDistance(a: Rgba, b: Rgba): number {
  const [x, y] = [rgbaToLab(a), rgbaToLab(b)];
  return Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b);
}

// --- Backdrop --------------------------------------------------------------------------------------------------

const colorPattern = /oklch\([^)]*\)/g;

/**
 * Lightest and darkest points of the backdrop under its overlay. Candidates are the base linear-gradient stops and
 * every radial bloom at full strength over each of them; blooms overlapping at full strength are not modelled.
 */
export function backdropExtremes(tokens: TokenMap): { lightest: Rgba; darkest: Rgba } {
  const layers = splitTopLevel(resolve(tokens, "var(--app-backdrop)"));
  const base = layers.at(-1) ?? "";
  if (!base.startsWith("linear-gradient(")) throw new Error("The backdrop's last layer must be a linear-gradient");

  const baseStops = (base.match(colorPattern) ?? []).map(parseColor);
  const blooms = layers
    .slice(0, -1)
    .map((layer) => layer.match(colorPattern)?.[0])
    .filter((color): color is string => color !== undefined)
    .map(parseColor);

  const overlay = tokenColor(tokens, "--app-backdrop-overlay");
  const candidates = baseStops
    .flatMap((stop) => [stop, ...blooms.map((bloom) => over(bloom, stop))])
    .map((point) => over(overlay, point));

  const byLuminance = [...candidates].sort((a, b) => relativeLuminance(a) - relativeLuminance(b));
  const darkest = byLuminance[0];
  const lightest = byLuminance.at(-1);
  if (!darkest || !lightest) throw new Error("The backdrop has no colour stops");
  return { lightest, darkest };
}

// --- Audit -----------------------------------------------------------------------------------------------------

type Surface = { name: string; color: Rgba };

/** Room surfaces a control can float over: the 3D scene paints these, so a capsule can sit on any of them. */
const ROOM_SURFACES = [
  "--room-paper",
  "--room-floor",
  "--room-floor-outdoor",
  "--room-wall",
  "--room-landmark",
  "--room-chair",
  "--table-free",
  "--table-arriving",
  "--table-seated",
  "--table-leaving",
  "--table-late",
  "--table-blocked",
];

/** Unselected labels in a segmented control and the room's own icon buttons use this share of the foreground. */
const CONTROL_LABEL_ALPHA = 0.7;
/** Landmark labels drawn straight on the room use this share of the room ink. */
const ROOM_LABEL_ALPHA = 0.7;

const withAlpha = (color: Rgba, alpha: number): Rgba => ({ ...color, a: color.a * alpha });

/**
 * Every measured pair for one theme and mode: text and UI colours on cards, capsules and popovers over the backdrop's
 * extremes, the opaque fills, the controls floating over the room, and the room itself (states, plates, labels).
 */
export function auditTheme(rules: Rule[], theme: string, mode: ThemeMode): AuditRow[] {
  const tokens = themeTokens(rules, theme, mode);
  const color = (name: string) => tokenColor(tokens, name);
  const number = (name: string) => Number.parseFloat(resolve(tokens, `var(${name})`));
  const rows: AuditRow[] = [];
  const check = (pair: string, foreground: Rgba, background: Rgba, minimum: number) => {
    const ratio = contrastRatio(over(foreground, background), background);
    rows.push({ theme, mode, pair, ratio: Math.round(ratio * 100) / 100, minimum, pass: ratio >= minimum });
  };

  const { lightest, darkest } = backdropExtremes(tokens);
  const floor = color("--room-floor");
  const byLuminance = ROOM_SURFACES.map(color).sort((a, b) => relativeLuminance(a) - relativeLuminance(b));
  const roomDarkest = byLuminance[0] ?? floor;
  const roomLightest = byLuminance.at(-1) ?? floor;
  const behind = [
    { name: "backdrop light", color: lightest },
    { name: "backdrop dark", color: darkest },
  ];
  const room = [
    { name: "room, lightest", color: roomLightest },
    { name: "room, darkest", color: roomDarkest },
  ];
  const sheen = color("--glass-sheen");
  const capsule = (b: { name: string; color: Rgba }): Surface => ({
    name: `capsule / ${b.name}`,
    color: over(sheen, over(color("--glass-fill-solid"), brightness(b.color, number("--glass-brightness")))),
  });

  const cards: Surface[] = behind.map((b) => ({ name: `card / ${b.name}`, color: over(color("--card"), b.color) }));
  const popovers: Surface[] = [...behind, ...room].map((b) => ({
    name: `popover / ${b.name}`,
    color: over(color("--popover"), b.color),
  }));
  const solid: Surface = { name: "reduced transparency", color: color("--surface-solid") };

  for (const surface of [...cards, solid]) {
    check(`foreground on ${surface.name}`, color("--card-foreground"), surface.color, TEXT);
    check(`muted-foreground on ${surface.name}`, color("--muted-foreground"), surface.color, TEXT);
    check(`salmon text on ${surface.name}`, color("--salmon"), surface.color, TEXT);
    check(`destructive text on ${surface.name}`, color("--destructive"), surface.color, TEXT);
    check(`brand (UI) on ${surface.name}`, color("--brand"), surface.color, UI);
    check(`azure (UI) on ${surface.name}`, color("--azure"), surface.color, UI);
    check(`chart axis label (muted-foreground) on ${surface.name}`, color("--muted-foreground"), surface.color, TEXT);
    for (const series of ["--chart-1", "--chart-2", "--chart-3"]) {
      check(`${series.slice(2)} series (UI) on ${surface.name}`, color(series), surface.color, UI);
    }
  }
  for (const surface of [...behind.map(capsule), ...room.map(capsule)]) {
    check(`foreground on ${surface.name}`, color("--foreground"), surface.color, TEXT);
    check(`muted-foreground on ${surface.name}`, color("--muted-foreground"), surface.color, TEXT);
  }
  // Over the dark room the controls read their foreground from the room ink (off-white), see base.css.
  const controlText = mode === "dark" ? color("--room-ink") : color("--foreground");
  for (const surface of room.map(capsule)) {
    check(`control text on ${surface.name}`, controlText, surface.color, TEXT);
    check(
      `control label and glyph (70%) on ${surface.name}`,
      withAlpha(controlText, CONTROL_LABEL_ALPHA),
      surface.color,
      TEXT,
    );
  }
  for (const surface of popovers) {
    check(`foreground on ${surface.name}`, color("--popover-foreground"), surface.color, TEXT);
    check(`muted-foreground on ${surface.name}`, color("--muted-foreground"), surface.color, TEXT);
  }

  check("primary-foreground on primary", color("--primary-foreground"), color("--primary"), TEXT);
  check("brand-foreground on brand", color("--brand-foreground"), color("--brand"), TEXT);
  for (const fill of ["--brand", "--salmon", "--azure"]) {
    check(`background text on ${fill.slice(2)} fill`, color("--background"), color(fill), TEXT);
  }

  for (const state of ["arriving", "seated", "leaving", "late"]) {
    check(`table-${state} on room floor (UI)`, color(`--table-${state}`), floor, UI);
  }
  check("table-free on room floor (UI)", color("--table-free"), floor, UI);
  check("table-blocked on room floor (UI)", color("--table-blocked"), floor, UI);
  if (mode === "dark") {
    const hatch = color("--table-hatch");
    const blocked = color("--table-blocked");
    const late = color("--table-late");
    check("hatch dots on table-blocked (UI)", multiplyTexture(blocked, hatch), blocked, UI);
    check("hatch stripes on table-late (UI)", multiplyTexture(late, hatch), late, UI);
  }
  const plate = color("--room-plate");
  check("plate on room floor (UI)", plate, floor, UI);
  check("plate text on plate", color("--room-plate-foreground"), plate, TEXT);
  check("plate rim on plate (UI)", color("--room-plate-rim"), plate, UI);
  const chip = over(color("--room-chip"), floor);
  check("detail chip text (room-ink) on chip", color("--room-ink"), chip, TEXT);
  for (const surface of ["--room-floor", "--room-paper"]) {
    const background = color(surface);
    check(`room-ink text on ${surface.slice(2)}`, color("--room-ink"), background, TEXT);
    check(
      `room label (ink 70%) on ${surface.slice(2)}`,
      withAlpha(color("--room-ink"), ROOM_LABEL_ALPHA),
      background,
      TEXT,
    );
  }

  return rows;
}

/** Smallest OKLab distance between the four coloured table states of one mode's room. */
export function tableStateSeparation(rules: Rule[], theme: string, mode: ThemeMode): number {
  const tokens = themeTokens(rules, theme, mode);
  const states = ["arriving", "seated", "leaving", "late"].map((state) => tokenColor(tokens, `--table-${state}`));
  let minimum = Number.POSITIVE_INFINITY;
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const [a, b] = [states[i], states[j]];
      if (a && b) minimum = Math.min(minimum, oklabDistance(a, b));
    }
  }
  return minimum;
}

export type RoomTone = { token: string; l: number; c: number; h: number };

/** OKLCH of every room token in one mode, for the lightness ladder and chroma budget of the dark room. */
export function roomTones(rules: Rule[], theme: string, mode: ThemeMode): Record<string, RoomTone> {
  const tokens = themeTokens(rules, theme, mode);
  const names = Object.keys(tokens).filter(
    (name) => (name.startsWith("--room-") || name.startsWith("--table-")) && name !== "--room-chair-tint",
  );
  return Object.fromEntries(names.map((name) => [name, { token: name, ...toOklch(tokenColor(tokens, name)) }]));
}

/** A plain number token such as `--room-chair-tint`. */
export function tokenNumber(rules: Rule[], theme: string, mode: ThemeMode, name: string): number {
  const tokens = themeTokens(rules, theme, mode);
  return Number.parseFloat(resolve(tokens, `var(${name})`));
}
