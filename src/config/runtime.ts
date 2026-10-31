import "server-only";

import { cache } from "react";

import { cookies } from "next/headers";

import { z } from "zod";

import { ROLE_IDS } from "@/core/access";
import { createClient } from "@/core/client";
import { type FaultMap, parseFaults } from "@/core/mock";

import { demoActor } from "./actor";
import { CATALOG } from "./catalog";
import { DEMO_SESSION_COOKIE, getAdapter } from "./data.server";
import { getLocale } from "./locale.server";
import { getVertical } from "./vertical.server";

/** Demo switch (ADR 0006): which role preset the visitor acts as. */
export const DEMO_ROLE_COOKIE = "demo_role";
/** Demo switch (ADR 0005): faults for this visitor only, in the `MOCK_FAULTS` grammar. */
export const MOCK_FAULTS_COOKIE = "mock_faults";

const roleSchema = z.enum(ROLE_IDS).catch("owner");

/** The environment is trusted and fails loudly; a visitor's cookie is not, so a malformed one is ignored. */
const faultsFrom = (environment: string | undefined, cookie: string | undefined): FaultMap => {
  const fromEnvironment = parseFaults(environment);
  const fromCookie = (() => {
    try {
      return parseFaults(cookie);
    } catch {
      return new Map();
    }
  })();
  return new Map([...fromEnvironment, ...fromCookie]);
};

/**
 * Everything a Server Component or Server Action needs for this request (ADR 0005): the typed client bound to the
 * actor, the preset, the locale and a correlation id. Cached per request.
 */
export const getRuntime = cache(async () => {
  const [jar, locale] = await Promise.all([cookies(), getLocale()]);
  const vertical = getVertical();
  const roleId = roleSchema.parse(jar.get(DEMO_ROLE_COOKIE)?.value);
  const actor = demoActor(roleId, vertical);
  const correlationId = crypto.randomUUID();
  const adapter = getAdapter({
    vertical: vertical.id,
    sessionId: jar.get(DEMO_SESSION_COOKIE)?.value,
    faults: faultsFrom(process.env.MOCK_FAULTS, jar.get(MOCK_FAULTS_COOKIE)?.value),
  });
  return {
    client: createClient(CATALOG, adapter, { actor, correlationId }),
    actor,
    vertical,
    locale,
    correlationId,
  };
});
