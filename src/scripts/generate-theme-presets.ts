/**
 * Script: generate-theme-presets.ts
 *
 * This script scans the /ds/styles/presets directory for CSS files containing theme definitions.
 * It extracts `label:`, `value:`, and the brand colour (`--brand`) of the light and dark blocks.
 * The brand colours are the swatches that represent each theme in the theme picker.
 * All extracted metadata is injected into a marked section of the /ds/preferences/theme.ts file.
 *
 * Usage:
 * - During local development, run manually after adding any new theme preset:
 *     npm run generate:presets
 * - Ensure that each new CSS preset includes `label:` and `value:` comments.
 * - This generation step is currently automated using a Husky pre-push hook.
 * - You may optionally integrate it directly into a build step if preferred.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const presetDir = path.resolve(__dirname, "../ds/styles/presets");

if (!fs.existsSync(presetDir)) {
  console.error(`❌ Preset directory not found at: ${presetDir}`);
  process.exit(1);
}

const outputPath = path.resolve(__dirname, "../ds/preferences/theme.ts");

const files = fs.readdirSync(presetDir).filter((file) => file.endsWith(".css"));

if (files.length === 0) {
  console.error(`❌ No preset CSS files found in ${presetDir}; the theme picker needs at least one.`);
  process.exit(1);
}

const presets = files.map((file) => {
  const filePath = path.join(presetDir, file);
  const content = fs.readFileSync(filePath, "utf8");

  const labelMatch = content.match(/label:\s*(.+)/);
  const valueMatch = content.match(/value:\s*(.+)/);

  if (!labelMatch) {
    console.warn(`⚠️ No 'label:' found in ${file}, using filename as fallback.`);
  }
  if (!valueMatch) {
    console.warn(`⚠️ No 'value:' found in ${file}, using filename as fallback.`);
  }

  const label = labelMatch?.[1]?.trim() ?? file.replace(".css", "");
  const value = valueMatch?.[1]?.trim() ?? file.replace(".css", "");

  const lightBrandMatch = content.match(/^:root\[data-theme-preset="[^"]*"\]\s*\{[^}]*?--brand:\s*([^;]+);/m);
  const darkBrandMatch = content.match(/^\.dark:root\[data-theme-preset="[^"]*"\]\s*\{[^}]*?--brand:\s*([^;]+);/m);

  const brand = {
    light: lightBrandMatch?.[1]?.trim() ?? "",
    dark: darkBrandMatch?.[1]?.trim() ?? "",
  };

  if (!lightBrandMatch || !darkBrandMatch) {
    console.warn(`⚠️ Missing --brand for ${file} (light or dark). Check CSS syntax.`);
  }

  return { label, value, brand };
});

const generatedBlock = `// --- generated:themePresets:start ---

export const THEME_PRESET_OPTIONS = ${JSON.stringify(presets, null, 2)} as const;

export const THEME_PRESET_VALUES = THEME_PRESET_OPTIONS.map((p) => p.value);

export type ThemePreset = (typeof THEME_PRESET_OPTIONS)[number]["value"];

// --- generated:themePresets:end ---`;

const fileContent = fs.readFileSync(outputPath, "utf8");

const updated = fileContent.replace(
  /\/\/ --- generated:themePresets:start ---[\s\S]*?\/\/ --- generated:themePresets:end ---/,
  generatedBlock,
);

function main() {
  const biomeBin = require.resolve("@biomejs/biome/bin/biome");
  const formatted = execFileSync(process.execPath, [biomeBin, "format", "--stdin-file-path", outputPath], {
    input: updated,
    encoding: "utf8",
  });

  if (formatted === fileContent) {
    console.log("ℹ️  No changes in theme.ts");
    return;
  }

  fs.writeFileSync(outputPath, formatted);
  console.log("✅ theme.ts updated with new theme presets");
}

try {
  main();
} catch (err) {
  console.error("❌ Unexpected error while generating theme presets:", err);
  process.exit(1);
}
