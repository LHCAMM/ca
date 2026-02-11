import { prisma } from '../plugins/db';
import { audit } from './audit';
import { setOrderProcessing } from './woo';

function score(order: any, payment: any): number {
  let s = 40;
  const total = Number(order.total);
  const amt = Number(payment.amount);
  if (Math.abs(total - amt) < 0.01) s += 40;
  if (order.customerEmail && payment.payerEmail && order.customerEmail.toLowerCase() === payment.payerEmail.toLowerCase()) s += 15;
  if (order.customerFirstName && payment.payerName && payment.payerName.toLowerCase().includes(order.customerFirstName.toLowerCase())) s += 10;
  return Math.min(s, 100);
}

export async function processMatches() {
  const payments = await prisma.paymentEvent.findMany({ where: { decision: 'pending' }, orderBy: { createdAt: 'desc' }, take: 50 });

  for (const payment of payments) {
    const candidates = await prisma.order.findMany({ where: { status: 'pending' }, orderBy: { createdAtWoo: 'desc' }, take: 20 });
    if (!candidates.length) continue;

    let best = candidates[0];
    let bestScore = 0;
    for (const c of candidates) {
      const s = score(c, payment);
      if (s > bestScore) {
        best = c;
        bestScore = s;
      }
    }

    await prisma.paymentEvent.update({ where: { id: payment.id }, data: { matchedOrderId: best.id, confidence: bestScore } });
    await audit('system', 'match_decision', { paymentEventId: payment.id, orderId: best.id, confidence: bestScore });

    if (bestScore >= 85 && best.status === 'pending') {
      const note = `Payment detected via ${payment.provider}. Amount: $${payment.amount}. Confidence: ${bestScore}.`;
      await setOrderProcessing(best.id, note);
      await prisma.paymentEvent.update({ where: { id: payment.id }, data: { decision: 'approved' } });
    } else {
      await prisma.paymentEvent.update({ where: { id: payment.id }, data: { decision: 'manual_confirm' } });
    }
  }
}

export async function approvePayment(paymentId: string, actor: string) {
  const payment = await prisma.paymentEvent.findUniqueOrThrow({ where: { id: paymentId } });
  if (!payment.matchedOrderId) throw new Error('No matched order');
  await setOrderProcessing(payment.matchedOrderId, `Manual approval by ${actor}. Payment ${payment.provider} $${payment.amount}`);
  await prisma.paymentEvent.update({ where: { id: paymentId }, data: { decision: 'approved' } });
  await audit(actor, 'manual_approve', { paymentId });
}

export async function denyPayment(paymentId: string, actor: string) {
  await prisma.paymentEvent.update({ where: { id: paymentId }, data: { decision: 'denied' } });
  await audit(actor, 'manual_deny', { paymentId });
}
