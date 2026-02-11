import type { FastifyInstance } from "fastify";

const channels = new Map<string, Set<(payload: unknown) => void>>();

export function registerRealtime(app: FastifyInstance) {
  app.get("/api/stream", async (req, reply) => {
    const channel = (req.query as { channel?: string }).channel ?? "orders";
    const listeners = channels.get(channel) ?? new Set();
    channels.set(channel, listeners);

    return reply.sse((async function* () {
      const queue: unknown[] = [];
      const handler = (payload: unknown) => queue.push(payload);
      listeners.add(handler);
      try {
        while (true) {
          if (queue.length > 0) {
            yield { event: channel, data: JSON.stringify(queue.shift()) };
          }
          await new Promise((r) => setTimeout(r, 500));
        }
      } finally {
        listeners.delete(handler);
      }
    })());
  });
}

export function broadcast(channel: string, payload: unknown) {
  channels.get(channel)?.forEach((send) => send(payload));
}
