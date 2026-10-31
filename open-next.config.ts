import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every dashboard page renders per request (cookies pick the locale, role and demo session), so the default
// in-memory caches are enough; add the R2 incremental cache here if a page starts using ISR.
export default defineCloudflareConfig();
