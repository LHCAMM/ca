import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { pool } from "../services/db.js";
import { createOrUpdateOrder, getOverviewMetrics } from "../services/orders.js";
import { verifyWooSignature } from "../utils/woo.js";

const webhookSchema = z.object({
  id: z.number(),
  date_created_gmt: z.string(),
  billing: z.object({ first_name: z.string().optional(), last_name: z.string().optional(), email: z.string().optional() }).optional(),
  line_items: z.array(z.unknown()).default([]),
  total: z.string(),
  currency: z.string(),
  status: z.string()
});

export async function orderRoutes(app: FastifyInstance) {
  app.post("/api/webhooks/woo", { config: { rawBody: true } }, async (req, reply) => {
    const signature = req.headers["x-wc-webhook-signature"] as string | undefined;
    const raw = (req as any).rawBody?.toString("utf8") ?? JSON.stringify(req.body);
    if (!verifyWooSignature(raw, signature)) return reply.code(401).send({ error: "Invalid webhook signature" });

    const payload = webhookSchema.parse(req.body);
    const customerName = `${payload.billing?.first_name ?? ""} ${payload.billing?.last_name ?? ""}`.trim();

    const order = await createOrUpdateOrder({
      order_id: String(payload.id),
      created_time: payload.date_created_gmt,
      customer_name: customerName,
      customer_email: payload.billing?.email ?? "",
      items_json: payload.line_items,
      total_amount: Number(payload.total),
      currency: payload.currency,
      payment_status: payload.status,
      fulfillment_status: payload.status,
      tags_json: [],
      source: "webhook"
    });

    return reply.send({ ok: true, order });
  });

  app.get("/api/orders", async () => (await pool.query("select * from orders order by created_time desc limit 200")).rows);
  app.get("/api/overview", async () => getOverviewMetrics());
}
