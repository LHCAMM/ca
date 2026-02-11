import { createHmac } from 'crypto';
import { prisma } from '../plugins/db';
import { config } from '../config';
import { audit } from './audit';

/**
 * Verify WooCommerce webhook signature
 * WooCommerce signs webhooks with HMAC-SHA256
 */
export function verifyWooSignature(payload: string, signature: string): boolean {
  if (!config.WOO_WEBHOOK_SECRET) {
    console.warn('WOO_WEBHOOK_SECRET not configured - webhook signature verification disabled');
    return true; // Allow in dev if secret not set
  }

  const hmac = createHmac('sha256', config.WOO_WEBHOOK_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64');

  return signature === expectedSignature;
}

/**
 * Process incoming WooCommerce webhook
 */
export async function processWooWebhook(event: string, orderData: any) {
  const orderId = orderData.id;
  const orderNumber = String(orderData.number ?? orderId);

  // Normalize order data
  const normalizedOrder = {
    wooOrderId: orderId,
    orderNumber,
    status: orderData.status,
    total: Number(orderData.total ?? 0),
    currency: orderData.currency ?? 'USD',
    customerFirstName: orderData.billing?.first_name,
    customerLastName: orderData.billing?.last_name,
    customerEmail: orderData.billing?.email,
    itemsJson: orderData.line_items || [],
    tagsJson: orderData.tags || [],
    wooRaw: orderData,
    source: 'webhook',
    createdAtWoo: new Date(orderData.date_created_gmt ?? orderData.date_created),
    paymentConfirmed: orderData.status === 'processing' || orderData.status === 'completed',
    orderMarkedProcessed: orderData.status === 'processing' || orderData.status === 'completed',
  };

  // Upsert order
  const order = await prisma.order.upsert({
    where: { wooOrderId: orderId },
    create: {
      ...normalizedOrder,
      lastSyncedAt: new Date(),
      paymentConfirmedAt: normalizedOrder.paymentConfirmed ? new Date() : undefined,
      processedAt: normalizedOrder.orderMarkedProcessed ? new Date() : undefined,
    },
    update: {
      ...normalizedOrder,
      lastSyncedAt: new Date(),
      paymentConfirmedAt: normalizedOrder.paymentConfirmed ? new Date() : undefined,
      processedAt: normalizedOrder.orderMarkedProcessed ? new Date() : undefined,
    },
  });

  // Audit log
  await audit('webhook', `order.${event}`, {
    orderId: order.id,
    wooOrderId: orderId,
    orderNumber,
    status: orderData.status,
    total: normalizedOrder.total,
    event,
  });

  console.log(`[Webhook] ${event} - Order ${orderNumber} (${orderData.status}) - $${normalizedOrder.total}`);

  return order;
}
