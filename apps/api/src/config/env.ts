import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  API_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  WOO_WEBHOOK_SECRET: z.string(),
  WOO_POLL_INTERVAL_SECONDS: z.coerce.number().default(60),
  GMAIL_POLL_INTERVAL_SECONDS: z.coerce.number().default(45),
  GMAIL_MATCH_THRESHOLD: z.coerce.number().default(0.75),
  AUTO_SEND_FOLLOWUPS: z.string().default("false"),
  FOLLOWUP_FIRST_MINUTES: z.coerce.number().default(15),
  FOLLOWUP_RETRY_HOURS: z.coerce.number().default(24),
  REPORT_TIMEZONE: z.string().default("America/New_York"),
  REPORT_HOUR_LOCAL: z.coerce.number().default(8)
});

export const env = schema.parse(process.env);
