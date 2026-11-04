import type { InfrastructureEnvironment, InfrastructureGroup, ProjectId } from "./infrastructure-data";

export const facetIds = ["organization", "stack", "cloudProvider", "environment"] as const;
export type FacetId = (typeof facetIds)[number];

export type Facets = Readonly<Record<FacetId, readonly string[]>>;

export const emptyFacets: Facets = { organization: [], stack: [], cloudProvider: [], environment: [] };

/** The cloud facet's value for a bare-metal or custom server, which has no brand. */
export const CUSTOM_SERVER = "custom";

export interface InfrastructureFilter {
  readonly query: string;
  readonly facets: Facets;
}

export function facetValue(group: InfrastructureGroup, row: InfrastructureEnvironment, facet: FacetId): string {
  switch (facet) {
    case "organization":
      return group.organization;
    case "stack":
      return row.platform.name;
    case "cloudProvider":
      return row.server ?? CUSTOM_SERVER;
    case "environment":
      return row.environment;
  }
}

/** Every value a facet takes across the groups, in order of first appearance. */
export function facetOptions(groups: readonly InfrastructureGroup[], facet: FacetId): string[] {
  const values = groups.flatMap((group) =>
    facet === "organization" ? [group.organization] : group.rows.map((row) => facetValue(group, row, facet)),
  );
  return [...new Set(values)];
}

export function isFiltering({ query, facets }: InfrastructureFilter): boolean {
  return query.trim() !== "" || facetIds.some((facet) => facets[facet].length > 0);
}

function matchesQuery(
  group: InfrastructureGroup,
  row: InfrastructureEnvironment,
  query: string,
  projectName: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  return [projectName, group.organization, row.domain, row.platform.name, row.server ?? "", row.plan].some((text) =>
    text.toLowerCase().includes(needle),
  );
}

function matchesFacets(group: InfrastructureGroup, row: InfrastructureEnvironment, facets: Facets): boolean {
  return facetIds.every((facet) => {
    const chosen = facets[facet];
    return chosen.length === 0 || chosen.includes(facetValue(group, row, facet));
  });
}

/** Adds the environments created in this session to the groups they belong to. */
export function withAdded(
  groups: readonly InfrastructureGroup[],
  added: Readonly<Partial<Record<ProjectId, readonly InfrastructureEnvironment[]>>>,
): InfrastructureGroup[] {
  return groups.map((group) => ({ ...group, rows: [...group.rows, ...(added[group.id] ?? [])] }));
}

/**
 * The groups with only the environments that match the search and every facet (a value within a facet is an "or",
 * the facets together an "and"). A group left with no environment is hidden while a filter is on, except an empty
 * project that the facets and the search do not rule out.
 */
export function filterGroups(
  groups: readonly InfrastructureGroup[],
  filter: InfrastructureFilter,
  projectName: (id: ProjectId) => string,
): InfrastructureGroup[] {
  if (!isFiltering(filter)) return [...groups];
  const rowFilters = facetIds
    .filter((facet) => facet !== "organization")
    .some((facet) => filter.facets[facet].length > 0);
  return groups
    .map((group) => ({
      ...group,
      rows: group.rows.filter(
        (row) =>
          matchesQuery(group, row, filter.query, projectName(group.id)) && matchesFacets(group, row, filter.facets),
      ),
    }))
    .filter((group) => {
      if (group.rows.length > 0) return true;
      const wasEmpty = groups.find((original) => original.id === group.id)?.rows.length === 0;
      const organizations = filter.facets.organization;
      const nameMatches =
        filter.query.trim() === "" ||
        [projectName(group.id), group.organization].some((text) =>
          text.toLowerCase().includes(filter.query.trim().toLowerCase()),
        );
      return (
        wasEmpty &&
        !rowFilters &&
        nameMatches &&
        (organizations.length === 0 || organizations.includes(group.organization))
      );
    });
}
