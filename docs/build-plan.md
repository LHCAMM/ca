# Mission Control Build Plan

## Chosen Stack
- **Backend**: Node.js + TypeScript + Fastify
- **DB**: PostgreSQL
- **Realtime**: Server-Sent Events (SSE)
- **Frontend**: Next.js + Tailwind CSS
- **Worker**: BullMQ + Redis
- **Infra**: Docker Compose (API 3001, UI 3000)

## Architecture
- WooCommerce events enter via signed webhook endpoint (`/api/webhooks/woo`).
- Woo poller (worker) acts as redundant fetch path every 60s.
- Gmail poller (worker) searches inbox every 30-60s, parses confirmations, writes `payment_events`, and updates orders.
- Follow-up scheduler creates drafts at +15m and daily cadence while unpaid.
- SSE endpoint broadcasts order/payment/manual queue updates to UI in realtime.
- Audit logger stores before/after state for all operator actions.

## Core Services
1. `IngestionService` (Woo webhook + Woo poll)
2. `PaymentMatchService` (confidence scoring)
3. `FollowUpService` (draft generation, optional autosend)
4. `ManualQueueService`
5. `RevenueService` (processed-only metrics)
6. `HeartbeatService` + alert escalation
7. `DailyReportService` at 8am America/New_York

## Credentials Required
- WooCommerce API key/secret
- Woo webhook signing secret
- Google OAuth client ID/secret + redirect URI
- Encryption key for token storage
- JWT secret for app auth
- DB + Redis URLs

## Local Dev Commands (Mac zsh)
```bash
cp .env.example .env

docker compose up -d

# run migrations
psql postgres://postgres:postgres@localhost:5432/mission_control -f db/migrations/001_init.sql

# tail logs
docker compose logs -f api worker web
```

## Webhook Local Tunneling
Use either:
```bash
cloudflared tunnel --url http://localhost:3001
# OR
ngrok http 3001
```
Then configure WooCommerce webhook URL to `https://<public-url>/api/webhooks/woo`.
