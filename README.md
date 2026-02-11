# ClawBot Mission Control (Mac-mini-first)

Minimal production-ready WooCommerce + Gmail operations assistant dashboard.

## Stack
- Backend: Node.js + TypeScript + Fastify
- DB: PostgreSQL + Prisma
- Jobs: BullMQ + Redis
- Frontend: Next.js + Tailwind
- Realtime: SSE
- Runtime: Docker Compose

## Features (v1)
- Woo order polling every 60s (baseline)
- Gmail payment polling every 60s (PayPal / Zelle / CashApp detection)
- Confidence matching engine + manual confirm queue
- Auto-mark order to `processing` when confidence >= 85 and order is `pending`
- Follow-up generation for pending orders older than 15 minutes
- Gmail draft creation for follow-ups (default: draft only)
- Dashboard: overview, orders, payments, follow-ups, logs
- 24/7 worker status badges + retry/backoff + daily 8am summary job placeholder

## Mac mini setup (Apple Silicon)

### 1) Install Docker Desktop
Install Docker Desktop for Mac (Apple Silicon) and ensure Docker is running.

### 2) Configure Google OAuth app for Gmail
1. Open Google Cloud Console → APIs & Services.
2. Enable **Gmail API**.
3. Create OAuth Client ID (Web application).
4. Add redirect URI:
   - `http://localhost:3001/auth/gmail/callback`
5. Copy client ID and client secret into `.env`.

### 3) Configure Woo API keys
In WooCommerce:
1. Settings → Advanced → REST API.
2. Create key with Read/Write permissions.
3. Copy key + secret into `.env`.

### 4) Start services
```zsh
cp .env.example .env
# edit .env with real values

docker compose up -d --build
```

### 5) Open app + connect Gmail
- UI: http://localhost:3000
- API: http://localhost:3001

Use API basic auth credentials from `.env`.

To get Gmail consent URL as Admin:
```zsh
curl -u "$API_BASIC_AUTH_USER:$API_BASIC_AUTH_PASSWORD" http://localhost:3001/auth/gmail/url
```
Open returned URL in browser, authorize, then exchange code:
```zsh
curl -u "$API_BASIC_AUTH_USER:$API_BASIC_AUTH_PASSWORD" -X POST http://localhost:3001/auth/gmail/callback -H 'content-type: application/json' -d '{"code":"PASTE_GOOGLE_CODE"}'
```

## Roles
- Admin: full access (including Gmail auth endpoints)
- Shop Manager: approve/deny matches, mark processed via approval actions, view logs

## Security notes
- Gmail refresh token is encrypted at rest via `APP_ENCRYPTION_KEY`.
- Secret values are never intentionally logged.
- All core events are audit logged: payment detected, match decision, status change, follow-up draft created.

## Revenue definition
Revenue counts only orders where:
- `paymentConfirmed = true`
- `orderMarkedProcessed = true`

## Handy commands
```zsh
docker compose logs -f api
docker compose logs -f web
docker compose ps
```
