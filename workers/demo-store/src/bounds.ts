import type { DemoSession } from "@/core/mock";

/** Keyed writes remembered per session: a retry older than this many writes is applied again, not replayed. */
export const MAX_REPLAYS = 200;
/** Pending approvals kept per session; the oldest are dropped first. */
export const MAX_APPROVALS = 50;

/** Keeps a session's replay and approval records within their caps, dropping the oldest first. */
export function boundSession(session: Pick<DemoSession<unknown>, "replays" | "approvals">): void {
  for (const key of session.replays.keys()) {
    if (session.replays.size <= MAX_REPLAYS) break;
    session.replays.delete(key);
  }
  if (session.approvals.length > MAX_APPROVALS) session.approvals.splice(0, session.approvals.length - MAX_APPROVALS);
}
