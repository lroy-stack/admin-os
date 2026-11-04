"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

import type { InfrastructureEnvironment, ProjectId } from "./infrastructure-data";
import { emptyFacets, type FacetId, type Facets } from "./infrastructure-filter";

interface InfrastructureState {
  readonly query: string;
  readonly setQuery: (query: string) => void;
  readonly facets: Facets;
  readonly toggleFacet: (facet: FacetId, value: string) => void;
  readonly clearFacet: (facet: FacetId) => void;
  /** Environments created in this session, by project (demo-local). */
  readonly added: Readonly<Partial<Record<ProjectId, readonly InfrastructureEnvironment[]>>>;
  readonly addEnvironment: (project: ProjectId, environment: InfrastructureEnvironment) => void;
  /** True once the person has refreshed: the header then says the data is current. */
  readonly refreshed: boolean;
  readonly markRefreshed: () => void;
}

const StateContext = createContext<InfrastructureState | null>(null);

export function useInfrastructure(): InfrastructureState {
  const state = useContext(StateContext);
  if (!state) throw new Error("useInfrastructure needs an InfrastructureProvider above it");
  return state;
}

/** What the infrastructure screen filters and adds, shared by its header and its project tables. */
export function InfrastructureProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [facets, setFacets] = useState<Facets>(emptyFacets);
  const [added, setAdded] = useState<InfrastructureState["added"]>({});
  const [refreshed, setRefreshed] = useState(false);

  const value = useMemo<InfrastructureState>(
    () => ({
      query,
      setQuery,
      facets,
      toggleFacet: (facet, option) =>
        setFacets((current) => ({
          ...current,
          [facet]: current[facet].includes(option)
            ? current[facet].filter((chosen) => chosen !== option)
            : [...current[facet], option],
        })),
      clearFacet: (facet) => setFacets((current) => ({ ...current, [facet]: [] })),
      added,
      addEnvironment: (project, environment) =>
        setAdded((current) => ({ ...current, [project]: [...(current[project] ?? []), environment] })),
      refreshed,
      markRefreshed: () => setRefreshed(true),
    }),
    [query, facets, added, refreshed],
  );

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}
