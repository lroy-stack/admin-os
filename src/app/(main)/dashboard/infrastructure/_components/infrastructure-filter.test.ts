import { siRemix } from "simple-icons";
import { describe, expect, it } from "vitest";

import { type InfrastructureEnvironment, infrastructureGroups } from "./infrastructure-data";
import { emptyFacets, facetOptions, filterGroups, withAdded } from "./infrastructure-filter";

const name = (id: string) => id;
const added: InfrastructureEnvironment = {
  domain: "new.example.com",
  platform: { name: "Remix", icon: siRemix },
  environment: "staging",
  status: "online",
  latencyMs: 80,
  uptime: { days: 0, hours: 0 },
  server: null,
  countryCode: "DE",
  plan: "Local",
  resources: { cpu: 5, ram: 8, disk: 3 },
};
const rowsOf = (groups: ReturnType<typeof filterGroups>) =>
  groups.flatMap((group) => group.rows.map((row) => row.domain));

describe("filterGroups", () => {
  it("returns every group when nothing is filtered", () => {
    expect(filterGroups(infrastructureGroups, { query: "  ", facets: emptyFacets }, name)).toHaveLength(4);
  });

  it("finds an environment by part of its domain", () => {
    const result = filterGroups(infrastructureGroups, { query: "REPORTS", facets: emptyFacets }, name);
    expect(rowsOf(result)).toEqual(["next-shadcn-admin-dashboard.vercel.app/reports"]);
  });

  it("hides the groups left with no match", () => {
    const result = filterGroups(infrastructureGroups, { query: "reports", facets: emptyFacets }, name);
    expect(result.map((group) => group.id)).toEqual(["analytics"]);
  });

  it("keeps the environments of any chosen value within a facet", () => {
    const facets = { ...emptyFacets, stack: ["Remix", "Node.js"] };
    expect(rowsOf(filterGroups(infrastructureGroups, { query: "", facets }, name))).toHaveLength(2);
  });

  it("combines facets with and", () => {
    const facets = { ...emptyFacets, stack: ["Remix"], environment: ["production"] };
    expect(rowsOf(filterGroups(infrastructureGroups, { query: "", facets }, name))).toEqual([]);
  });

  it("keeps an empty project that the organization facet selects", () => {
    const facets = { ...emptyFacets, organization: ["Acme Corp"] };
    expect(filterGroups(infrastructureGroups, { query: "", facets }, name).map((group) => group.id)).toEqual(["inbox"]);
  });

  it("matches the project name it is given", () => {
    const result = filterGroups(infrastructureGroups, { query: "tablero", facets: emptyFacets }, (id) =>
      id === "kanban" ? "Tablero" : id,
    );
    expect(result.map((group) => group.id)).toEqual(["kanban"]);
  });
});

describe("facetOptions", () => {
  it("lists each cloud once, with the custom server last seen", () => {
    expect(facetOptions(infrastructureGroups, "cloudProvider")).toEqual(["Hetzner Cloud", "AWS", "Azure", "custom"]);
  });
});

describe("withAdded", () => {
  it("appends an environment to its own project", () => {
    const merged = withAdded(infrastructureGroups, { inbox: [added] });
    expect(merged.find((group) => group.id === "inbox")?.rows).toHaveLength(1);
  });
});
