/**
 * The `<title>` and meta description of a page. Every route dictionary that owns a page carries one as `meta`, and
 * `pageMetadata` (src/config/metadata.server.ts) turns it into the page's `Metadata`.
 */
export interface PageMeta {
  readonly title: string;
  readonly description: string;
}
