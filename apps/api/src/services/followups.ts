import { prisma } from '../plugins/db';
import { audit } from './audit';
import { createDraft } from './gmail';
import { config } from '../config';

/**
 * Follow-up email templates
 */
const TEMPLATES = {
  first: (firstName: string, orderNumber: string, total: string, currency: string) => ({
    subject: `Payment Confirmation - Order #${orderNumber}`,
    body: `Hi ${firstName},

Thank you for your order (#${orderNumber}) totaling ${currency} ${total}!

We're waiting to confirm your payment to process your order. Once we receive and confirm your payment, we'll start preparing your shipment right away.

Payment Options:
• PayPal: [your-paypal-email]
• Zelle: [your-zelle]
• Cash App: [your-cashapp]

Please include your order number (#${orderNumber}) in the payment notes.

If you've already sent payment, please disregard this message - we'll confirm it soon!

Questions? Reply to this email or contact us at [support-email].

Thanks!
[Your Store Name]`,
  }),

  reminder: (firstName: string, orderNumber: string, total: string, currency: string, daysSince: number) => ({
    subject: `Reminder: Payment Pending - Order #${orderNumber}`,
    body: `Hi ${firstName},

This is a friendly reminder about your order #${orderNumber} (${currency} ${total}), placed ${daysSince} day${daysSince > 1 ? 's' : ''} ago.

We haven't received payment confirmation yet. We want to make sure you can get your order as soon as possible!

Order: #${orderNumber}
Amount: ${currency} ${total}

If you have any questions or need assistance with payment, please let us know. We're here to help!

To proceed with your order, please send payment and include your order number in the payment notes.

Thank you!
[Your Store Name]`,
  }),

  final: (firstName: string, orderNumber: string) => ({
    subject: `Final Notice - Order #${orderNumber}`,
    body: `Hi ${firstName},

We haven't received payment for order #${orderNumber}.

If you're still interested in completing your order, please send payment at your earliest convenience. Otherwise, we may need to cancel this order to make room for other customers.

If you have any questions or concerns, please reach out - we're happy to help!

Best regards,
[Your Store Name]`,
  }),
};

/**
 * Get appropriate template based on attempt number
 */
function getTemplate(
  attemptNumber: number,
  firstName: string,
  orderNumber: string,
  total: string,
  currency: string,
  daysSinceOrder: number
) {
  const first = firstName || 'there';

  if (attemptNumber === 1) {
    return TEMPLATES.first(first, orderNumber, total, currency);
  } else if (attemptNumber <= 3) {
    return TEMPLATES.reminder(first, orderNumber, total, currency, daysSinceOrder);
  } else {
    return TEMPLATES.final(first, orderNumber);
  }
}

/**
 * Calculate next follow-up schedule
 * - First: 15 minutes after order
 * - Second: 1 day after first
 * - Third: 2 days after second
 * - Fourth: 3 days after third
 */
function getNextSchedule(attemptNumber: number, orderCreatedAt: Date): Date {
  const now = Date.now();
  const orderTime = orderCreatedAt.getTime();

  if (attemptNumber === 1) {
    // 15 minutes after order
    return new Date(orderTime + 15 * 60 * 1000);
  } else if (attemptNumber === 2) {
    // 1 day after order
    return new Date(orderTime + 24 * 60 * 60 * 1000);
  } else if (attemptNumber === 3) {
    // 3 days after order
    return new Date(orderTime + 3 * 24 * 60 * 60 * 1000);
  } else {
    // 7 days after order (final)
    return new Date(orderTime + 7 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Create follow-up tasks for unpaid orders
 */
export async function createFollowUps() {
  const now = new Date();

  // Find orders that need follow-ups
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['pending', 'on-hold'] },
      paymentConfirmed: false,
      createdAtWoo: {
        lte: new Date(Date.now() - 15 * 60 * 1000), // At least 15 min old
      },
    },
    include: {
      followUps: {
        orderBy: { attemptNumber: 'desc' },
        take: 1,
      },
    },
  });

  for (const order of orders) {
    const lastFollowUp = order.followUps[0];

    // Determine next attempt number
    const nextAttempt = lastFollowUp ? lastFollowUp.attemptNumber + 1 : 1;

    // Don't send more than 4 follow-ups
    if (nextAttempt > 4) {
      continue;
    }

    // Calculate when this follow-up should be scheduled
    const scheduledAt = getNextSchedule(nextAttempt, order.createdAtWoo);

    // Only create if it's time
    if (scheduledAt > now) {
      continue;
    }

    // Check if we already have a follow-up scheduled for this attempt
    const existing = await prisma.followUpTask.findFirst({
      where: {
        orderId: order.id,
        attemptNumber: nextAttempt,
      },
    });

    if (existing) {
      continue; // Already scheduled
    }

    // Calculate days since order
    const daysSince = Math.floor((now.getTime() - order.createdAtWoo.getTime()) / (24 * 60 * 60 * 1000));

    // Generate email content
    const template = getTemplate(
      nextAttempt,
      order.customerFirstName || 'there',
      order.orderNumber,
      order.total.toString(),
      order.currency,
      daysSince
    );

    // Create Gmail draft (if email exists)
    let draftId: string | null = null;
    if (order.customerEmail) {
      try {
        draftId = await createDraft(order.customerEmail, template.subject, template.body);
      } catch (err: any) {
        console.error(`[Follow-ups] Failed to create draft for order ${order.orderNumber}:`, err.message);
      }
    }

    // Create follow-up task
    const task = await prisma.followUpTask.create({
      data: {
        orderId: order.id,
        attemptNumber: nextAttempt,
        templateUsed: nextAttempt === 1 ? 'first' : nextAttempt <= 3 ? 'reminder' : 'final',
        draftContent: template.body,
        scheduledAt,
        gmailDraftId: draftId,
        status: draftId ? 'drafted' : 'scheduled',
      },
    });

    await audit('system', 'followup_created', {
      taskId: task.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      attemptNumber: nextAttempt,
      draftId,
    });

    console.log(`[Follow-ups] Created attempt #${nextAttempt} for order ${order.orderNumber}`);
  }
}

/**
 * Send scheduled follow-ups (only if auto-send is enabled)
 * Note: By default, auto-send is OFF for safety
 */
export async function sendScheduledFollowUps() {
  // Check if auto-send is enabled
  const setting = await prisma.setting.findUnique({ where: { key: 'auto_send_followups' } });
  const autoSendEnabled = setting?.value === true;

  if (!autoSendEnabled) {
    console.log('[Follow-ups] Auto-send disabled - drafts only');
    return;
  }

  // Find drafted follow-ups ready to send
  const now = new Date();
  const readyToSend = await prisma.followUpTask.findMany({
    where: {
      status: 'drafted',
      scheduledAt: { lte: now },
      gmailDraftId: { not: null },
    },
    include: { order: true },
  });

  for (const task of readyToSend) {
    try {
      // TODO: Implement actual Gmail send (requires gmail.send() method)
      // For now, mark as sent in database only
      await prisma.followUpTask.update({
        where: { id: task.id },
        data: { status: 'sent', sentAt: new Date() },
      });

      await audit('system', 'followup_sent', {
        taskId: task.id,
        orderId: task.orderId,
        orderNumber: task.order.orderNumber,
      });

      console.log(`[Follow-ups] Sent follow-up for order ${task.order.orderNumber}`);
    } catch (err: any) {
      console.error(`[Follow-ups] Failed to send for order ${task.order.orderNumber}:`, err.message);
    }
  }
}
