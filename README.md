# Mission Control (WooCommerce + Gmail Operations Center)

Production-focused operations platform for live order ingestion, payment matching, follow-up automation, manual operations queue, and processed-only revenue tracking.

## Repo Structure
- `apps/api`: Fastify API + realtime SSE
- `apps/worker`: background pollers/schedulers
- `apps/web`: Next.js dashboard
- `db/migrations`: schema
- `docs`: architecture and setup guidance

## Quick Start
```bash
cp .env.example .env
docker compose up -d
psql postgres://postgres:postgres@localhost:5432/mission_control -f db/migrations/001_init.sql
```

UI: http://localhost:3000  
API: http://localhost:3001

## Required Integrations
1. WooCommerce webhooks to `/api/webhooks/woo` with secret header verification.
2. WooCommerce REST credentials for redundancy poller.
3. Gmail OAuth (offline refresh token). Use least-privilege Gmail scopes.

## Security Controls
- Role model: `Admin`, `Shop Manager`
- Audit logs with state transitions
- Encrypted token storage design via `ENCRYPTION_KEY_BASE64`
- Secrets excluded from logs

## In-app Help
- **Overview:** processed-only KPIs + subsystem status
- **Orders:** live stream + filters + drilldown
- **Payments:** confidence-scored matches with confirm/reject
- **Follow Ups:** queue/schedule + drafts + auto-send safety toggle
- **Manual Queue:** operator handoff workflow
- **Settings:** thresholds, templates, role permissions
- **Logs:** full audit trail + CSV export endpoint (to implement)

## Tunnel for local webhook testing
```bash
cloudflared tunnel --url http://localhost:3001
# OR
ngrok http 3001
```
