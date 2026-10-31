"use client";

import { createContext, type ReactNode, use } from "react";

import type { Permission } from "@/core/capability";

import { type Access, can } from "./can";

const AccessContext = createContext<Access | null>(null);

/** Mounted by the dashboard layout with the permissions the server read for this request (ADR 0006). */
export function AccessProvider({ permissions, children }: { permissions: readonly string[]; children: ReactNode }) {
  return <AccessContext.Provider value={{ permissions }}>{children}</AccessContext.Provider>;
}

/** `(permission) => boolean` for client code. UI hiding is UX only; the adapter checks every call. */
export function useCan(): (permission: Permission) => boolean {
  const access = use(AccessContext);
  if (!access) {
    throw new Error("Missing AccessProvider");
  }
  return (permission) => can(access, permission);
}
