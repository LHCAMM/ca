import Fastify from "fastify";
import cors from "@fastify/cors";
import sse from "@fastify/sse-v2";
import { env } from "./config/env.js";
import { orderRoutes } from "./routes/orders.js";
import { paymentRoutes } from "./routes/payments.js";
import { manualQueueRoutes } from "./routes/manualQueue.js";
import { systemRoutes } from "./routes/system.js";
import { registerRealtime } from "./services/realtime.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(sse);
registerRealtime(app);
await orderRoutes(app);
await paymentRoutes(app);
await manualQueueRoutes(app);
await systemRoutes(app);

app.get("/health", async () => ({ ok: true }));

app.listen({ port: env.API_PORT, host: "0.0.0.0" }).then(() => {
  app.log.info(`Mission Control API listening on ${env.API_PORT}`);
});
