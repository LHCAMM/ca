import { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config';

declare module 'fastify' {
  interface FastifyRequest {
    userRole?: 'admin' | 'shop_manager';
    userEmail?: string;
  }
}

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Basic ')) return reply.code(401).send({ error: 'Unauthorized' });

  const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':');
  if (user !== config.API_BASIC_AUTH_USER || pass !== config.API_BASIC_AUTH_PASSWORD) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  request.userRole = user === 'admin' ? 'admin' : 'shop_manager';
  request.userEmail = user;
}

export function requireRole(roles: Array<'admin' | 'shop_manager'>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.userRole || !roles.includes(request.userRole)) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  };
}
