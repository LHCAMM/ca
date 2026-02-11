import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { config } from './config';
import { routes } from './routes';
import { startWorker, scheduleRecurringJobs } from './workers/queues';

async function start() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(sensible);
  await routes(app);
  await scheduleRecurringJobs();
  startWorker();
  await app.listen({ host: '0.0.0.0', port: config.PORT });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
