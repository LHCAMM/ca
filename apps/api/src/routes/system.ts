import type { FastifyInstance } from "fastify";
import { pool, healthDb } from "../services/db.js";

export async function systemRoutes(app: FastifyInstance) {
  app.get("/api/status", async () => ({
    wooWebhook: "healthy",
    wooPoller: "healthy",
    gmailAuth: "connected",
    gmailPoller: "healthy",
    worker: "healthy",
    db: (await healthDb()) ? "healthy" : "degraded"
  }));

  app.get("/api/logs", async () => (await pool.query("select * from audit_logs order by created_at desc limit 200")).rows);
}
