import type { DemoSession } from "@/core/mock";
import { evictSettled, MAX_APPROVALS } from "@/core/mock";

/** Keyed writes remembered per session: a retry older than this many writes is applied again, not replayed. */
export const MAX_REPLAYS = 200;
export { MAX_APPROVALS };

/**
 * Keeps a session's replay and approval records within their caps. Replays drop the oldest first. Approvals drop
 * the expired and decided ones first and never a pending one: the kernel refuses a new hold (`approvals.queue_full`)
 * when the cap is reached with all pending, so `approvals.get` never loses a record that still waits.
 */
export function boundSession(
  session: Pick<DemoSession<unknown>, "replays" | "approvals">,
  nowMs: number = Date.now(),
): void {
  for (const key of session.replays.keys()) {
    if (session.replays.size <= MAX_REPLAYS) break;
    session.replays.delete(key);
  }
  evictSettled(session.approvals, nowMs, MAX_APPROVALS);
}
