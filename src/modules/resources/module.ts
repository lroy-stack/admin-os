import { defineModule } from "@/core/module";

import { resourcesCapabilities } from "./capabilities";
import { areaSchema, resourceSchema } from "./schema";

/** The resources module's manifest (ADR 0017 §1). */
export const resourcesModule = defineModule({
  id: "resources",
  capabilities: resourcesCapabilities,
  settings: [],
  mcp: {
    noun: "resources (tables, chairs or bays)",
    idSources: [["resource ids", ["resources.list"]]],
    tools: {
      "resources.list": { expose: true, title: "List resources" },
    },
  },
  seed: {
    areas: { schema: areaSchema, required: true, ext: { entity: "area", optional: false } },
    resources: { schema: resourceSchema, required: true, ext: { entity: "resource", optional: false } },
  },
  references: [],
  owns: ["src/config/mcp.server.resources.test.ts"],
});
