import dotenv from "dotenv";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { Pool } from "pg";

dotenv.config();

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const followupQueue = new Queue("followups", { connection });

async function enqueueUnpaidFollowups() {
  await followupQueue.add("scan-unpaid", {}, { repeat: { every: 60 * 1000 } });
}

new Worker(
  "followups",
  async () => {
    const firstMinutes = Number(process.env.FOLLOWUP_FIRST_MINUTES ?? 15);
    const sql = `select id, order_id, customer_email from orders where payment_confirmed=false and created_time <= now() - ($1 || ' minutes')::interval`;
    const { rows } = await pool.query(sql, [firstMinutes]);
    for (const row of rows) {
      await pool.query(
        "insert into followups(order_ref_id,next_run_at,status,channel,template_key) values ($1, now(), 'drafted', 'gmail', 'default') on conflict do nothing",
        [row.id]
      );
    }
  },
  { connection }
);

enqueueUnpaidFollowups().then(() => console.log("worker up"));
