import type { Locale } from "@/core/i18n";

/**
 * The MCP Worker's own pages (the consent page): plain server-rendered HTML, no React (the Worker bundle rule, ADR
 * 0016 AC1). System colours follow the visitor's light or dark scheme, so no colour is written here.
 */

/** Every string that came from a client (its name, domain, redirect host) or a visitor is escaped before rendering. */
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const STYLE = `
:root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: Canvas; color: CanvasText; }
main { box-sizing: border-box; width: min(100% - 2rem, 28rem); margin: 2rem 0; padding: 1.5rem;
  border: 1px solid color-mix(in srgb, CanvasText 15%, transparent); border-radius: 1rem;
  background: color-mix(in srgb, CanvasText 3%, Canvas); }
h1 { font-size: 1.25rem; line-height: 1.3; margin: 0 0 0.75rem; }
h2 { font-size: 1rem; margin: 1.25rem 0 0.25rem; }
p, li { font-size: 0.875rem; line-height: 1.5; margin: 0.25rem 0; }
.muted { opacity: 0.75; }
.warning { padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: color-mix(in srgb, Mark 35%, Canvas); }
.actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.5rem; }
button { font: inherit; font-size: 0.875rem; padding: 0.5rem 1rem; border-radius: 999px; cursor: pointer;
  border: 1px solid color-mix(in srgb, CanvasText 25%, transparent); background: Canvas; color: CanvasText; }
button.primary { background: CanvasText; color: Canvas; border-color: CanvasText; }
button:focus-visible { outline: 2px solid AccentColor; outline-offset: 2px; }
ul { padding-left: 1.25rem; }
`;

/** A whole page: `title` is already escaped, `body` is trusted markup built from escaped parts. */
export const htmlPage = (locale: Locale, title: string, body: string): string => `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>${STYLE}</style>
</head>
<body><main>${body}</main></body>
</html>`;

/** The headers every page of this Worker carries: no caching, no framing, no script, no outside resource. */
export const pageHeaders = (headers: Headers = new Headers()): Headers => {
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");
  headers.set("X-Frame-Options", "DENY");
  // same-origin, not no-referrer: under no-referrer a form post sends `Origin: null`, which the Origin check refuses.
  headers.set("Referrer-Policy", "same-origin");
  return headers;
};
