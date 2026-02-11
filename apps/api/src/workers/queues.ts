import { Queue, Worker } from 'bullmq';
import { config } from '../config';
import { pollWooOrders } from '../services/woo';
import { pollGmailPayments } from '../services/gmail';
import { processMatches } from '../services/matching';
import { createFollowUps } from '../services/followups';
import { prisma } from '../plugins/db';

const connection = { url: config.REDIS_URL };
export const queue = new Queue('mission-control', { connection });

async function markStatus(id: string, healthy: boolean, lastError?: string) {
  await prisma.systemStatus.upsert({
    where: { id },
    create: { id, healthy, lastSuccessAt: healthy ? new Date() : undefined, lastError },
    update: { healthy, lastSuccessAt: healthy ? new Date() : undefined, lastError }
  });
}

export function startWorker() {
  const worker = new Worker('mission-control', async (job) => {
    try {
      if (job.name === 'woo-poll') {
        await pollWooOrders();
        await markStatus('woo_poller', true);
      }
      if (job.name === 'gmail-poll') {
        await pollGmailPayments();
        await processMatches();
        await markStatus('gmail_poller', true);
      }
      if (job.name === 'followups') {
        await createFollowUps();
        await markStatus('worker', true);
      }
      if (job.name === 'daily-summary') {
        await markStatus('daily_summary', true);
      }
    } catch (err: any) {
      const key = job.name === 'woo-poll' ? 'woo_poller' : job.name === 'gmail-poll' ? 'gmail_poller' : 'worker';
      await markStatus(key, false, err.message);
      throw err;
    }
  }, { connection });

  worker.on('failed', () => undefined);
  return worker;
}

export async function scheduleRecurringJobs() {
  await queue.upsertJobScheduler('woo-poll-schedule', { every: 60_000 }, { name: 'woo-poll', data: {}, opts: { attempts: 5, backoff: { type: 'exponential', delay: 2000 } } });
  await queue.upsertJobScheduler('gmail-poll-schedule', { every: 60_000 }, { name: 'gmail-poll', data: {}, opts: { attempts: 5, backoff: { type: 'exponential', delay: 2000 } } });
  await queue.upsertJobScheduler('followup-schedule', { every: 60_000 }, { name: 'followups', data: {}, opts: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } } });
  await queue.upsertJobScheduler('daily-summary-schedule', { pattern: '0 8 * * *' }, { name: 'daily-summary', data: {} });
}
