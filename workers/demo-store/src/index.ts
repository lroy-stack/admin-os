export { DemoStore } from "./demo-store";

/** The store Worker has no public surface: callers reach `DemoStore` through a binding. */
export default {
  async fetch(): Promise<Response> {
    return new Response("demo-store: reach me through a Durable Object binding", { status: 404 });
  },
};
