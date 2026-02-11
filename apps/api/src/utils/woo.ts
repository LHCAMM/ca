import crypto from "crypto";
import { env } from "../config/env.js";

export function verifyWooSignature(payload: string, signature?: string) {
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", env.WOO_WEBHOOK_SECRET);
  hmac.update(payload, "utf8");
  const digest = hmac.digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
