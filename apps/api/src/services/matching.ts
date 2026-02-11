import { prisma } from '../plugins/db';
import { audit } from './audit';
import { setOrderProcessing } from './woo';

interface MatchResult {
  score: number;
  methods: string[];
}

/**
 * Enhanced confidence scoring for payment-to-order matching
 * Returns score (0-1.0) and methods used
 */
function calculateMatch(order: any, payment: any): MatchResult {
  let score = 0;
  const methods: string[] = [];

  const total = Number(order.total);
  const amt = Number(payment.amount);
  const tolerance = 0.01;

  // Amount match (40% weight)
  if (Math.abs(total - amt) < tolerance) {
    score += 0.40;
    methods.push('amount_exact');
  } else if (Math.abs(total - amt) < total * 0.05) {
    // Within 5%
    score += 0.25;
    methods.push('amount_close');
  }

  // Email match (30% weight)
  if (order.customerEmail && payment.payerEmail) {
    const orderEmail = order.customerEmail.toLowerCase().trim();
    const payerEmail = payment.payerEmail.toLowerCase().trim();

    if (orderEmail === payerEmail) {
      score += 0.30;
      methods.push('email_exact');
    } else if (orderEmail.split('@')[0] === payerEmail.split('@')[0]) {
      // Same local part
      score += 0.15;
      methods.push('email_partial');
    }
  }

  // Name match (20% weight)
  if (order.customerFirstName && payment.payerName) {
    const firstName = order.customerFirstName.toLowerCase().trim();
    const lastName = order.customerLastName?.toLowerCase().trim() || '';
    const payerName = payment.payerName.toLowerCase().trim();

    if (payerName.includes(firstName) && lastName && payerName.includes(lastName)) {
      score += 0.20;
      methods.push('name_full');
    } else if (payerName.includes(firstName)) {
      score += 0.10;
      methods.push('name_first');
    }
  }

  // Order number in snippet (10% weight)
  if (payment.rawSnippet && order.orderNumber) {
    const snippet = payment.rawSnippet.toLowerCase();
    const orderNum = order.orderNumber.toLowerCase();
    if (snippet.includes(orderNum)) {
      score += 0.10;
      methods.push('order_number');
    }
  }

  return { score: Math.min(score, 1.0), methods };
}

export async function processMatches() {
  const payments = await prisma.paymentEvent.findMany({
    where: { decision: 'pending' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  for (const payment of payments) {
    // Find candidate orders (pending or on-hold within last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const candidates = await prisma.order.findMany({
      where: {
        status: { in: ['pending', 'on-hold'] },
        createdAtWoo: { gte: sevenDaysAgo },
        paymentConfirmed: false,
      },
      orderBy: { createdAtWoo: 'desc' },
      take: 50,
    });

    if (!candidates.length) {
      console.log(`[Matching] No candidates for payment ${payment.id}`);
      continue;
    }

    // Calculate match scores for all candidates
    let bestOrder = candidates[0];
    let bestResult: MatchResult = { score: 0, methods: [] };

    for (const candidate of candidates) {
      const result = calculateMatch(candidate, payment);
      if (result.score > bestResult.score) {
        bestOrder = candidate;
        bestResult = result;
      }
    }

    // Update payment event with match
    await prisma.paymentEvent.update({
      where: { id: payment.id },
      data: {
        matchedOrderId: bestOrder.id,
        confidence: bestResult.score,
        matchMethod: bestResult.methods.join(','),
        matchedBy: 'auto',
      },
    });

    await audit('system', 'match_calculated', {
      paymentEventId: payment.id,
      orderId: bestOrder.id,
      confidence: bestResult.score,
      methods: bestResult.methods,
    });

    // Auto-approve if confidence >= 0.85 (85%)
    const CONFIDENCE_THRESHOLD = 0.85;

    if (bestResult.score >= CONFIDENCE_THRESHOLD) {
      const note = `✓ Payment auto-confirmed via ${payment.provider}. Amount: ${payment.currency} ${payment.amount}. Confidence: ${Math.round(bestResult.score * 100)}% (${bestResult.methods.join(', ')})`;

      try {
        await setOrderProcessing(bestOrder.id, note);
        await prisma.paymentEvent.update({
          where: { id: payment.id },
          data: { decision: 'approved' },
        });

        console.log(`[Matching] Auto-approved payment ${payment.id} → Order ${bestOrder.orderNumber} (${Math.round(bestResult.score * 100)}%)`);
      } catch (err: any) {
        console.error(`[Matching] Failed to auto-approve:`, err.message);
        await prisma.paymentEvent.update({
          where: { id: payment.id },
          data: { decision: 'manual_confirm' },
        });
      }
    } else {
      // Needs manual review
      await prisma.paymentEvent.update({
        where: { id: payment.id },
        data: { decision: 'manual_confirm' },
      });

      console.log(`[Matching] Manual review needed for payment ${payment.id} (${Math.round(bestResult.score * 100)}%)`);
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
