import { pool } from "./db.js";
import { broadcast } from "./realtime.js";

export async function createOrUpdateOrder(input: Record<string, unknown>) {
  const query = `
    insert into orders (
      order_id, created_time, customer_name, customer_email, items_json, total_amount, currency,
      payment_status, fulfillment_status, tags_json, source, payment_confirmed, order_marked_processed, last_updated
    ) values (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now()
    )
    on conflict(order_id) do update set
      customer_name=excluded.customer_name,
      customer_email=excluded.customer_email,
      items_json=excluded.items_json,
      total_amount=excluded.total_amount,
      currency=excluded.currency,
      payment_status=excluded.payment_status,
      fulfillment_status=excluded.fulfillment_status,
      tags_json=excluded.tags_json,
      source=excluded.source,
      last_updated=now()
    returning *`;
  const values = [
    input.order_id,
    input.created_time,
    input.customer_name,
    input.customer_email,
    JSON.stringify(input.items_json ?? []),
    input.total_amount,
    input.currency,
    input.payment_status,
    input.fulfillment_status,
    JSON.stringify(input.tags_json ?? []),
    input.source,
    input.payment_confirmed ?? false,
    input.order_marked_processed ?? false
  ];
  const result = await pool.query(query, values);
  broadcast("orders", result.rows[0]);
  return result.rows[0];
}

export async function getOverviewMetrics() {
  const processed = `payment_confirmed = true and order_marked_processed = true`;
  const sql = `
    select
      coalesce(sum(case when ${processed} and created_time::date = current_date then total_amount else 0 end),0) as today_revenue,
      coalesce(sum(case when ${processed} and created_time >= now() - interval '7 days' then total_amount else 0 end),0) as seven_day_revenue,
      coalesce(sum(case when ${processed} and date_trunc('month', created_time) = date_trunc('month', now()) then total_amount else 0 end),0) as month_revenue,
      count(*) filter (where ${processed}) as processed_orders,
      coalesce(avg(total_amount) filter (where ${processed}),0) as aov,
      count(*) filter (where payment_confirmed = false and created_time <= now() - interval '15 minutes') as unpaid_over_15
    from orders;`;
  return (await pool.query(sql)).rows[0];
}
