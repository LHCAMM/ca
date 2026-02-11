import type { FastifyInstance } from "fastify";
import { pool } from "../services/db.js";

export async function paymentRoutes(app: FastifyInstance) {
  app.get("/api/payments", async () => {
    const sql = `select pe.*, o.customer_email, o.total_amount from payment_events pe
      left join orders o on o.id = pe.order_ref_id
      order by pe.created_at desc limit 200`;
    return (await pool.query(sql)).rows;
  });

  app.post("/api/payments/:id/confirm", async (req) => {
    const { id } = req.params as { id: string };
    const update = await pool.query("update payment_events set status='confirmed' where id=$1 returning *", [id]);
    if (update.rowCount) {
      await pool.query("update orders set payment_confirmed=true,last_updated=now() where id=$1", [update.rows[0].order_ref_id]);
    }
    return update.rows[0] ?? { ok: false };
  });

  app.post("/api/payments/:id/reject", async (req) => {
    const { id } = req.params as { id: string };
    await pool.query("update payment_events set status='rejected' where id=$1", [id]);
    return { ok: true };
  });
}
