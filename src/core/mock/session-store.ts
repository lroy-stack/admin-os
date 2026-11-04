import type { CallResult } from "@/core/result";

/** A write that waits for a human (ADR 0005, approval rule). */
export interface PendingApproval {
  readonly approvalId: string;
  readonly capabilityId: string;
  readonly actorId: string;
  readonly input: unknown;
}

/** One visitor's copy of the demo: their data, their replayable writes and their pending approvals. */
export interface DemoSession<T> {
  readonly data: T;
  /**
   * Results of keyed writes, so a retried submission with the same idempotency key is not applied twice. The
   * fingerprint is that of the input the key first arrived with: the same key with another input is a conflict.
   */
  readonly replays: Map<string, { readonly fingerprint: string; readonly result: CallResult<unknown> }>;
  readonly approvals: PendingApproval[];
}

export interface SessionStore<T> {
  /** What a read sees: the session's copy when it exists, otherwise the immutable seed. */
  read(sessionId: string | undefined): T;
  /** The writes held for a person in this session; none without a session. */
  approvals(sessionId: string | undefined): readonly PendingApproval[];
  /** The session a write acts on, created from the seed on first use. */
  session(sessionId: string): DemoSession<T>;
  /** "Reset demo data": drops the copy, so the next read sees the seed again. */
  reset(sessionId: string): void;
  readonly size: number;
}

interface StoreOptions {
  readonly maxSessions?: number;
  readonly ttlMs?: number;
  readonly now?: () => number;
}

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};

/**
 * Per-visitor copies of the seed in an LRU (100 sessions, 2-hour idle TTL by default), so one visitor never sees
 * another's edits and the public demo cannot be defaced. State lives in this process only: on a new isolate a
 * session starts from the seed again, which is why screens keep the values a write returns (ADR 0005).
 */
export function createSessionStore<T>(seed: T, options: StoreOptions = {}): SessionStore<T> {
  const { maxSessions = 100, ttlMs = 2 * 60 * 60 * 1000, now = Date.now } = options;
  const base = deepFreeze(structuredClone(seed));
  const sessions = new Map<string, { session: DemoSession<T>; touchedAt: number }>();

  const live = (sessionId: string | undefined) => {
    if (sessionId === undefined) return undefined;
    const entry = sessions.get(sessionId);
    if (entry === undefined) return undefined;
    if (now() - entry.touchedAt > ttlMs) {
      sessions.delete(sessionId);
      return undefined;
    }
    // Re-insert so Map order tracks recency: the first key is always the least recently used.
    sessions.delete(sessionId);
    sessions.set(sessionId, { ...entry, touchedAt: now() });
    return entry.session;
  };

  return {
    read: (sessionId) => live(sessionId)?.data ?? base,
    approvals: (sessionId) => live(sessionId)?.approvals ?? [],
    session: (sessionId) => {
      const existing = live(sessionId);
      if (existing) return existing;
      const created: DemoSession<T> = { data: structuredClone(base), replays: new Map(), approvals: [] };
      sessions.set(sessionId, { session: created, touchedAt: now() });
      while (sessions.size > maxSessions) {
        const oldest = sessions.keys().next().value;
        if (oldest === undefined) break;
        sessions.delete(oldest);
      }
      return created;
    },
    reset: (sessionId) => {
      sessions.delete(sessionId);
    },
    get size() {
      return sessions.size;
    },
  };
}
