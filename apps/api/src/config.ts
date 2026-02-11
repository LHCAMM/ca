import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://redis:6379'),
  APP_ENCRYPTION_KEY: z.string().min(32),
  API_BASIC_AUTH_USER: z.string().default('admin'),
  API_BASIC_AUTH_PASSWORD: z.string().default('change-me'),
  WOO_BASE_URL: z.string().url(),
  WOO_CONSUMER_KEY: z.string(),
  WOO_CONSUMER_SECRET: z.string(),
  GMAIL_CLIENT_ID: z.string(),
  GMAIL_CLIENT_SECRET: z.string(),
  GMAIL_REDIRECT_URI: z.string().url(),
  GMAIL_POLL_QUERY: z.string().default('(PayPal OR Zelle OR Cash App OR CashApp) subject:(payment OR sent OR received) newer_than:2d')
});

export const config = schema.parse(process.env);
