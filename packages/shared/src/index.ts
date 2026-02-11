import { z } from 'zod';

export const roleSchema = z.enum(['admin', 'shop_manager']);
export type Role = z.infer<typeof roleSchema>;

export const orderStatusSchema = z.enum(['pending', 'processing', 'completed', 'cancelled', 'on-hold']);

export const paymentEventSchema = z.object({
  provider: z.enum(['paypal', 'zelle', 'cashapp', 'unknown']),
  amount: z.number().nonnegative(),
  payerEmail: z.string().email().optional(),
  payerName: z.string().optional(),
  confidence: z.number().min(0).max(100)
});

export type PaymentEventInput = z.infer<typeof paymentEventSchema>;
