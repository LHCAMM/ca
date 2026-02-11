import { prisma } from '../plugins/db';
import { audit } from './audit';
import { createDraft } from './gmail';

export async function createFollowUps() {
  const threshold = new Date(Date.now() - 15 * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: {
      status: 'pending',
      createdAtWoo: { lte: threshold },
      followUps: { none: {} }
    }
  });

  for (const order of orders) {
    const first = order.customerFirstName ?? 'there';
    const msg = `Hi ${first}, just checking in on order #${order.orderNumber}. We can confirm your payment as soon as it's sent. Thanks!`;
    const draftId = order.customerEmail ? await createDraft(order.customerEmail, `Order #${order.orderNumber} payment follow-up`, msg) : null;

    const task = await prisma.followUpTask.create({
      data: {
        orderId: order.id,
        messageText: msg,
        gmailDraftId: draftId
      }
    });

    await audit('system', 'followup_draft_created', { taskId: task.id, orderId: order.id, draftId });
  }
}
