import { Pool } from "pg";
import { env } from "../config/env.js";

export const pool = new Pool({ connectionString: env.DATABASE_URL });

export async function healthDb() {
  const result = await pool.query("select 1");
  return result.rowCount === 1;
}
