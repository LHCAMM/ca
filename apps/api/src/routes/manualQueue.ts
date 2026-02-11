import type { FastifyInstance } from "fastify";
import { pool } from "../services/db.js";

export async function manualQueueRoutes(app: FastifyInstance) {
  app.get("/api/manual-queue", async () =>
    (await pool.query("select * from manual_action_queue where status='open' order by priority desc, created_at asc")).rows
  );

  app.post("/api/orders/:id/mark-processed", async (req) => {
    const { id } = req.params as { id: string };
    const result = await pool.query("update orders set order_marked_processed=true,fulfillment_status='processed',last_updated=now() where id=$1 returning *", [id]);
    return result.rows[0];
  });
}
