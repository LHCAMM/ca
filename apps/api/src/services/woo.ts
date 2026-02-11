import { prisma } from '../plugins/db';
import { config } from '../config';
import { audit } from './audit';

function authHeader() {
  return 'Basic ' + Buffer.from(`${config.WOO_CONSUMER_KEY}:${config.WOO_CONSUMER_SECRET}`).toString('base64');
}

export async function pollWooOrders() {
  const res = await fetch(`${config.WOO_BASE_URL}/wp-json/wc/v3/orders?per_page=50&orderby=date&order=desc`, {
    headers: { Authorization: authHeader() }
  });
  if (!res.ok) throw new Error(`Woo poll failed: ${res.status}`);
  const orders = (await res.json()) as any[];
  for (const o of orders) {
    await prisma.order.upsert({
      where: { wooOrderId: o.id },
      create: {
        wooOrderId: o.id,
        orderNumber: String(o.number ?? o.id),
        status: o.status,
        total: Number(o.total ?? 0),
        currency: o.currency ?? 'USD',
        customerFirstName: o.billing?.first_name,
        customerLastName: o.billing?.last_name,
        customerEmail: o.billing?.email,
        createdAtWoo: new Date(o.date_created_gmt ?? o.date_created)
      },
      update: {
        status: o.status,
        total: Number(o.total ?? 0),
        currency: o.currency ?? 'USD',
        customerFirstName: o.billing?.first_name,
        customerLastName: o.billing?.last_name,
        customerEmail: o.billing?.email,
        lastSyncedAt: new Date(),
        orderMarkedProcessed: o.status === 'processing'
      }
    });
  }
}

export async function setOrderProcessing(orderId: string, paymentDetails: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const patch = await fetch(`${config.WOO_BASE_URL}/wp-json/wc/v3/orders/${order.wooOrderId}`, {
    method: 'PUT',
    headers: {
      Authorization: authHeader(),
      'content-type': 'application/json'
    },
    body: JSON.stringify({ status: 'processing' })
  });
  if (!patch.ok) throw new Error(`Woo status update failed: ${patch.status}`);

  await fetch(`${config.WOO_BASE_URL}/wp-json/wc/v3/orders/${order.wooOrderId}/notes`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'content-type': 'application/json'
    },
    body: JSON.stringify({ note: paymentDetails, customer_note: false })
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'processing', paymentConfirmed: true, orderMarkedProcessed: true }
  });

  await audit('system', 'order_marked_processing', { orderId, paymentDetails });
}
