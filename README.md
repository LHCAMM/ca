# 🎯 Mission Control

**Production-grade 24/7 operations dashboard and automation engine for peptide e-commerce**

A comprehensive, real-time system that manages WooCommerce orders, Gmail payment confirmations, automated follow-ups, and revenue tracking - all in one unified control center.

---

## ✨ Key Features

### 🔄 Live Order Streaming
- **Dual-mode ingestion**: Real-time webhooks + 60-second polling backup
- **Webhook security**: HMAC-SHA256 signature verification
- **Smart normalization**: Consistent order data across all sources
- **Source tracking**: Know whether each order came from webhook or poll

### 💰 Accurate Revenue Tracking
- **Strict counting**: Only fully processed + confirmed orders count
- **Real-time updates**: Dashboard refreshes via Server-Sent Events (SSE)
- **Trend indicators**: Compare against previous periods
- **Multi-status support**: Handles pending, processing, completed, cancelled

### 📧 Intelligent Payment Detection
- **Gmail OAuth 2.0**: Secure offline access with refresh tokens
- **Smart polling**: 30-60 second intervals for payment emails
- **Multi-provider support**: PayPal, Zelle, Cash App, Venmo, and more
- **Advanced confidence scoring** (0.0-1.0 decimal):
  - Amount matching (40% weight)
  - Email matching (30% weight)
  - Name matching (20% weight)
  - Order number detection (10% weight)
- **Auto-approve at 85%+**: High-confidence matches process automatically
- **Manual review queue**: Low-confidence matches for human verification

### ⏰ Automated Follow-ups
- **Smart scheduling**: 15min, 1day, 3day, 7day cadence
- **Template system**: Professional, personalized email templates
- **Gmail draft creation**: Auto-generate drafts for review
- **Safety-first**: Auto-send OFF by default
- **Attempt tracking**: Max 4 follow-ups per order

### 🎛️ Manual Action Queue
- **Confidence review**: See match details and confidence scores
- **Side-by-side comparison**: Payment vs Order details
- **Email preview**: View snippets of payment confirmations
- **One-click actions**: Approve or reject with audit trail

### 📊 Live Dashboard
- **Glass morphism design**: Modern, clean, professional UI
- **Real-time metrics**: Revenue, pending orders, payments, queue status
- **System health monitoring**: All subsystem status at a glance
- **Quick actions**: Jump to common tasks immediately

---

## 🚀 Quick Start (macOS)

### Prerequisites
- Docker Desktop for Mac (Apple Silicon compatible)
- Node.js 20+
- WooCommerce store with REST API access
- Google Cloud account (for Gmail OAuth)

### Installation

```bash
# Clone and enter directory
cd ~/mission-control

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

### Access Services
- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### First-Time Setup
1. **Gmail Authorization**: Visit http://localhost:3001/auth/gmail
2. **Configure Webhooks**: See [SETUP.md](./SETUP.md)
3. **Verify System**: Check dashboard for green status

📖 **Full setup guide**: [SETUP.md](./SETUP.md)

---

## 💻 Tech Stack

### Backend
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL 16 + Prisma ORM
- **Queue**: BullMQ + Redis
- **Real-time**: Server-Sent Events (SSE)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with glass morphism
- **Type Safety**: TypeScript

### Infrastructure
- **Docker** + Docker Compose
- **PostgreSQL 16** (Alpine)
- **Redis 7** (Alpine)

---

## 📁 Project Structure

```
mission-control/
├── apps/
│   ├── api/              # Fastify API + workers
│   │   ├── prisma/       # Database schema + migrations
│   │   └── src/
│   │       ├── routes/   # API endpoints
│   │       ├── services/ # Business logic
│   │       └── workers/  # Background jobs
│   └── web/              # Next.js dashboard
│       ├── app/          # Pages
│       ├── components/   # React components
│       └── lib/          # Utilities
├── docker-compose.yml
├── .env.example
├── README.md            # This file
└── SETUP.md             # Complete setup guide
```

---

## 🔐 Security

- ✅ OAuth 2.0 with encrypted refresh tokens (AES-256)
- ✅ Webhook signature verification (HMAC-SHA256)
- ✅ Role-based access control
- ✅ Complete audit logging
- ✅ No plaintext credentials in logs
- ✅ Least-privilege OAuth scopes

---

## 🛠️ Development Commands

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f api
docker compose logs -f web

# Restart a service
docker compose restart api

# Rebuild
docker compose up -d --build

# Stop services
docker compose down

# Reset database (⚠️ destroys data)
docker compose down -v && docker compose up -d

# Run migrations
docker compose exec api npx prisma migrate deploy

# Access database
docker compose exec db psql -U clawbot -d clawbot
```

---

## 🌐 Local Webhook Testing

Use a tunnel for local webhook development:

### Cloudflare Tunnel (Recommended)
```bash
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel --url http://localhost:3001
```

### ngrok
```bash
brew install ngrok
ngrok http 3001
```

Add tunnel URL + `/webhooks/woo` to WooCommerce webhook settings.

---

## 📈 Monitoring

Built-in monitoring for:
- WooCommerce webhook + poller
- Gmail OAuth + poller
- Worker queue status
- Database + Redis health

All subsystems report to the dashboard with heartbeats and error tracking.

---

## 🐛 Troubleshooting

### Services won't start
```bash
docker ps
docker compose logs
docker compose down -v && docker compose up -d --build
```

### Webhooks not working
1. Check tunnel is running
2. Verify webhook secret matches
3. Check API logs: `docker compose logs -f api | grep webhook`

### Gmail auth failing
1. Verify OAuth credentials
2. Check redirect URI matches exactly
3. Ensure Gmail API is enabled

**Full guide**: [SETUP.md](./SETUP.md#troubleshooting)

---

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **API Docs** *(coming soon)*
- **Workflows** *(coming soon)*
- **Deployment** *(coming soon)*

---

## 🎯 Roadmap

### ✅ v1.0 (Current)
- WooCommerce integration (webhooks + polling)
- Gmail OAuth + payment detection
- Advanced payment matching
- Follow-up automation
- Manual action queue
- Glass morphism UI
- Settings panel
- Audit logging
- System health monitoring

### 🔜 v1.1
- Gmail Pub/Sub (real-time push)
- Multi-currency support
- Advanced analytics
- Email template editor
- User management UI
- API documentation
- Slack/Discord notifications

### 🔮 v2.0+
- Multi-store support
- Shopify integration
- Stripe payment detection
- AI-powered insights
- Mobile app

---

## 📄 License

Proprietary - Internal use only

---

## 🆘 Support

1. Check [troubleshooting](#-troubleshooting)
2. Review [SETUP.md](./SETUP.md)
3. Check logs: `docker compose logs -f`

---

**🎯 Mission Control - Your 24/7 Operations Command Center**

*"Automate the routine. Focus on what matters."*
