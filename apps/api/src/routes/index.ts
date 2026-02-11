import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/db';
import { authGuard, requireRole } from '../plugins/auth';
import { approvePayment, denyPayment } from '../services/matching';
import { getGmailAuthUrl, exchangeCode } from '../services/gmail';

export async function routes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.get('/health', async () => ({ ok: true }));

  app.get('/overview', async () => {
    const [paidRevenue, pending15m, paymentsDetected, manualConfirm, statuses] = await Promise.all([
      prisma.order.aggregate({ where: { paymentConfirmed: true, orderMarkedProcessed: true }, _sum: { total: true } }),
      prisma.order.count({ where: { status: 'pending', createdAtWoo: { lte: new Date(Date.now() - 15 * 60 * 1000) } } }),
      prisma.paymentEvent.count(),
      prisma.paymentEvent.count({ where: { decision: 'manual_confirm' } }),
      prisma.systemStatus.findMany()
    ]);
    return {
      processedRevenue: Number(paidRevenue._sum.total ?? 0),
      pendingOver15m: pending15m,
      paymentsDetected,
      manualConfirm,
      statuses
    };
  });

  app.get('/orders', async (req) => {
    const q: any = req.query;
    return prisma.order.findMany({ where: { status: q.status || undefined }, orderBy: { createdAtWoo: 'desc' }, take: 200 });
  });

  app.get('/payments', async () => prisma.paymentEvent.findMany({ include: { matchedOrder: true }, orderBy: { createdAt: 'desc' }, take: 200 }));

  app.post('/payments/:id/approve', { preHandler: requireRole(['admin', 'shop_manager']) }, async (req: any) => {
    await approvePayment(req.params.id, req.userEmail ?? 'manager');
    return { ok: true };
  });

  app.post('/payments/:id/deny', { preHandler: requireRole(['admin', 'shop_manager']) }, async (req: any) => {
    await denyPayment(req.params.id, req.userEmail ?? 'manager');
    return { ok: true };
  });

  app.get('/followups', async () => prisma.followUpTask.findMany({ include: { order: true }, orderBy: { createdAt: 'desc' }, take: 200 }));
  app.get('/logs', { preHandler: requireRole(['admin', 'shop_manager']) }, async () => prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }));

  app.get('/auth/gmail/url', { preHandler: requireRole(['admin']) }, async () => ({ url: getGmailAuthUrl() }));
  app.post('/auth/gmail/callback', { preHandler: requireRole(['admin']) }, async (req: any) => {
    await exchangeCode(req.body.code);
    return { ok: true };
  });

  app.get('/events', async (request, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    const timer = setInterval(async () => {
      const statuses = await prisma.systemStatus.findMany();
      reply.raw.write(`data: ${JSON.stringify({ statuses, ts: Date.now() })}\n\n`);
    }, 5000);
    request.raw.on('close', () => clearInterval(timer));
  });
}
