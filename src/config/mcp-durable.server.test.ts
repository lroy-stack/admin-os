import { afterEach, describe, expect, it, vi } from "vitest";

import { demoActor } from "./actor";
import { durableAdapter } from "./durable-adapter.server";
import { createMcpServer } from "./mcp.server";
import { VERTICALS } from "./vertical";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
  headers: async () => new Headers(),
}));
vi.mock("./durable-adapter.server", () => ({ durableAdapter: vi.fn(() => ({ dispatch: vi.fn() })) }));

const actor = demoActor("owner", VERTICALS.hospitality);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(durableAdapter).mockClear();
});

describe("createMcpServer with DATA_STORE=durable", () => {
  it("serves a read-only server in process, without a Durable Object for its session", () => {
    vi.stubEnv("DATA_STORE", "durable");
    createMcpServer({ actor, vertical: "hospitality", sessionId: "mcp-abc", readOnly: true });
    expect(durableAdapter).not.toHaveBeenCalled();
  });

  it("gives a server that can write the Durable Object of its session", () => {
    vi.stubEnv("DATA_STORE", "durable");
    createMcpServer({ actor, vertical: "hospitality", sessionId: "mcp-abc", readOnly: false });
    expect(durableAdapter).toHaveBeenCalledWith(expect.objectContaining({ sessionId: "mcp-abc" }));
  });
});
