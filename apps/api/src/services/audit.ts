import { prisma } from '../plugins/db';

export async function audit(actor: string, action: string, details: unknown) {
  await prisma.auditLog.create({ data: { actor, action, details: details as object } });
}
