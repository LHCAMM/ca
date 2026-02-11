import { google } from 'googleapis';
import { prisma } from '../plugins/db';
import { config } from '../config';
import { decrypt, encrypt } from '../utils/crypto';
import { audit } from './audit';

function oauthClient() {
  return new google.auth.OAuth2(config.GMAIL_CLIENT_ID, config.GMAIL_CLIENT_SECRET, config.GMAIL_REDIRECT_URI);
}

export async function saveRefreshToken(refreshToken: string) {
  await prisma.integrationSecret.upsert({
    where: { id: 'gmail_refresh_token' },
    create: { id: 'gmail_refresh_token', encrypted: encrypt(refreshToken) },
    update: { encrypted: encrypt(refreshToken) }
  });
}

async function getRefreshToken() {
  const secret = await prisma.integrationSecret.findUnique({ where: { id: 'gmail_refresh_token' } });
  if (!secret) return null;
  return decrypt(secret.encrypted);
}

export function getGmailAuthUrl() {
  const client = oauthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.compose']
  });
}

export async function exchangeCode(code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) throw new Error('No refresh token returned');
  await saveRefreshToken(tokens.refresh_token);
}

function detectProvider(text: string) {
  const t = text.toLowerCase();
  if (t.includes('paypal')) return 'paypal';
  if (t.includes('zelle')) return 'zelle';
  if (t.includes('cash app') || t.includes('cashapp')) return 'cashapp';
  return 'unknown';
}

function extractAmount(text: string) {
  const match = text.match(/\$\s?([0-9]+(?:\.[0-9]{2})?)/);
  return match ? Number(match[1]) : 0;
}

export async function pollGmailPayments() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return;

  const auth = oauthClient();
  auth.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: 'v1', auth });

  const list = await gmail.users.messages.list({ userId: 'me', q: config.GMAIL_POLL_QUERY, maxResults: 20 });
  const messages = list.data.messages ?? [];

  for (const m of messages) {
    const existing = await prisma.paymentEvent.findFirst({ where: { providerRef: m.id } });
    if (existing) continue;
    const msg = await gmail.users.messages.get({ userId: 'me', id: m.id!, format: 'snippet' });
    const snippet = msg.data.snippet ?? '';
    const provider = detectProvider(snippet);
    const amount = extractAmount(snippet);

    const event = await prisma.paymentEvent.create({
      data: {
        provider,
        providerRef: m.id!,
        amount,
        rawSnippet: snippet,
        payerEmail: undefined,
        payerName: undefined,
        detectedAt: new Date(),
        confidence: 0
      }
    });

    await audit('system', 'payment_detected', { paymentEventId: event.id, provider, amount });
  }
}

export async function createDraft(to: string, subject: string, body: string): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  const auth = oauthClient();
  auth.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: 'v1', auth });
  const raw = Buffer.from(`To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`).toString('base64url');
  const draft = await gmail.users.drafts.create({ userId: 'me', requestBody: { message: { raw } } });
  return draft.data.id ?? null;
}
