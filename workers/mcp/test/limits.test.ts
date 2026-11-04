import { describe, expect, it } from "vitest";

import { clientIpOf } from "../src/limits";

const requestFrom = (address?: string) =>
  new Request("https://mcp.admin-os.lr0y.dev/", {
    headers: address === undefined ? {} : { "cf-connecting-ip": address },
  });

describe("clientIpOf", () => {
  it.each([
    ["an IPv4 address as it is", "203.0.113.7", "203.0.113.7"],
    ["a full IPv6 address by its /64", "2001:0db8:0000:0012:0000:0000:0000:abcd", "2001:db8:0:12::/64"],
    ["a compressed IPv6 address by its /64", "2001:db8:0:12::abcd", "2001:db8:0:12::/64"],
    ["an IPv6 address compressed inside its /64", "2001:db8::1", "2001:db8:0:0::/64"],
    ["the IPv6 loopback", "::1", "0:0:0:0::/64"],
    ["a request without the header in one shared bucket", undefined, "unknown"],
  ])("keys %s", (_case, address, bucket) => {
    expect(clientIpOf(requestFrom(address))).toBe(bucket);
  });
});
