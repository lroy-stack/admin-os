/**
 * The Workers rate-limit bindings in front of this Worker's doors (ADR 0016 D8): a refusal shaped for the door that
 * asked, `429` with `Retry-After` past the limit and `503` when the limiter itself fails.
 */

/** How a door answers a refused request: JSON-RPC for `/mcp`, an OAuth error for the authorization server. */
export type Refusal = (status: 429 | 503, message: string, headers: Record<string, string>) => Response;

/** An OAuth error body (RFC 6749 §5.2) for the authorization endpoints. */
export const oauthRefusal: Refusal = (status, message, headers) =>
  Response.json({ error: "temporarily_unavailable", error_description: message }, { status, headers });

/** The refusal for `key` once `limiter` has spent its window, or undefined when the request may go on. */
export async function overLimit(
  limiter: RateLimit,
  key: string,
  periodS: number,
  refuse: Refusal,
): Promise<Response | undefined> {
  try {
    const { success } = await limiter.limit({ key });
    if (success) return undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ event: "mcp.limiter.error", message }));
    return refuse(503, "The rate limiter is unavailable; retry the request shortly.", { "Retry-After": "1" });
  }
  return refuse(429, `Too many requests; retry after ${periodS} seconds.`, { "Retry-After": String(periodS) });
}

/** The first four groups of an IPv6 address, its /64, with `::` expanded and leading zeros dropped. */
const ipv6Prefix64 = (address: string): string => {
  const [head = "", tail] = address.toLowerCase().split("::");
  const left = head === "" ? [] : head.split(":");
  const right = tail === undefined || tail === "" ? [] : tail.split(":");
  const groups =
    tail === undefined
      ? left
      : [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right];
  return `${groups
    .slice(0, 4)
    .map((group) => group.replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
};

/**
 * The bucket of a client's address as Cloudflare reports it (`CF-Connecting-IP`, on every request at the edge): the
 * address itself for IPv4, its /64 for IPv6, since one subscriber holds a whole /64 and could otherwise take a fresh
 * window per address. A request without the header (only local tooling sends one) falls into one shared `unknown`
 * bucket, so a missing header fails closed rather than escaping the limit.
 */
export const clientIpOf = (request: Request): string => {
  const address = request.headers.get("cf-connecting-ip")?.trim();
  if (address === undefined || address === "") return "unknown";
  return address.includes(":") ? ipv6Prefix64(address) : address;
};
