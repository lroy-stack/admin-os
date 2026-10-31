/** A forced outcome for one capability: an error code, a delay, or both (ADR 0005). */
export interface Fault {
  readonly code?: string;
  readonly latencyMs?: number;
}

export type FaultMap = ReadonlyMap<string, Fault>;

const LATENCY = /^latency:(\d{1,5})$/;
const CODE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/**
 * Parses the `MOCK_FAULTS` grammar: comma-separated `<capability>=<code>` or `<capability>=latency:<ms>` entries,
 * for example `customers.list=not_found,bookings.list=latency:1500`. A capability may take both. A malformed entry
 * throws, so a typo in the environment fails loudly instead of silently testing nothing.
 */
export function parseFaults(spec: string | undefined): FaultMap {
  const faults = new Map<string, Fault>();
  const entries = (spec ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  for (const entry of entries) {
    const [capabilityId = "", value = ""] = entry.split("=");
    const latency = LATENCY.exec(value);
    if (!capabilityId.includes(".") || (!latency && !CODE.test(value))) {
      throw new Error(
        `MOCK_FAULTS entry "${entry}" is malformed; use <capability>=<module.code> or <capability>=latency:<ms>`,
      );
    }
    const current = faults.get(capabilityId) ?? {};
    faults.set(capabilityId, latency ? { ...current, latencyMs: Number(latency[1]) } : { ...current, code: value });
  }
  return faults;
}
