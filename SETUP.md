# 🛠️ Mission Control - Complete Setup Guide

This guide walks you through setting up the Mission Control system from scratch on macOS (Apple Silicon).

---

## Prerequisites

### Required Software
- **Docker Desktop** for Mac (Apple Silicon) - [Download](https://www.docker.com/products/docker-desktop)
- **Node.js 20+** (for local development) - [Download](https://nodejs.org/)
- **Git** - Pre-installed on macOS

### Required Accounts & Access
- **WooCommerce Store** with admin access
- **Google Cloud** account (free tier is fine)
- **Gmail account** for payment monitoring

---

## Part 1: Google Cloud Setup (Gmail OAuth)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project:
   - Click "Select a project" → "New Project"
   - Name: "Mission Control" (or your preference)
   - Click "Create"
3. Wait for project creation (takes ~30 seconds)

### Step 2: Enable Gmail API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on it and click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type → Click **Create**
3. Fill in the form:
   - **App name**: Mission Control
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**
5. **Scopes page**: Click **Save and Continue** (we'll add scopes later)
6. **Test users page**:
   - Click **Add Users**
   - Add your Gmail address
   - Click **Save and Continue**
7. Click **Back to Dashboard**

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: "Mission Control Web"
5. **Authorized redirect URIs**:
   - Click **Add URI**
   - For local development: `http://localhost:3001/auth/gmail/callback`
   - For production: `https://yourdomain.com/auth/gmail/callback`
6. Click **Create**
7. **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these for `.env`

---

## Part 2: WooCommerce Setup

### Step 1: Generate API Keys

1. Log in to your WooCommerce admin dashboard
2. Go to **WooCommerce** → **Settings** → **Advanced** → **REST API**
3. Click **Add key**
4. Configure:
   - **Description**: Mission Control
   - **User**: Select an admin user
   - **Permissions**: **Read/Write**
5. Click **Generate API key**
6. **IMPORTANT**: Copy the **Consumer Key** and **Consumer Secret** immediately (they won't be shown again)

### Step 2: Generate Webhook Secret

1. You'll need a strong random string for webhook signature verification
2. Generate one with this command:
   ```bash
   openssl rand -hex 32
   ```
3. Save this - you'll use it in both WooCommerce and your `.env` file

### Step 3: Create Webhook (After Server is Running)

**Note**: Complete this step AFTER you've started the Mission Control server (Part 3)

1. In WooCommerce admin: **WooCommerce** → **Settings** → **Advanced** → **Webhooks**
2. Click **Add webhook**
3. Configure:
   - **Name**: Mission Control - Order Created
   - **Status**: Active
   - **Topic**: Order created
   - **Delivery URL**: `https://your-tunnel-url/webhooks/woo` (see Part 4 for tunnel setup)
   - **Secret**: Paste the secret you generated in Step 2
   - **API Version**: WP REST API Integration v3
4. Click **Save webhook**
5. Repeat for these additional webhooks (recommended):
   - Order updated
   - Order deleted

---

## Part 3: Mission Control Installation

### Step 1: Clone Repository

```bash
cd ~
git clone <your-repo-url> mission-control
cd mission-control
```

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Open in your editor
nano .env
# or
code .env
```

### Step 3: Fill in Environment Variables

Edit `.env` with your credentials:

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Security (REQUIRED)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Generate with: openssl rand -hex 32
APP_ENCRYPTION_KEY=<paste-64-char-random-string>
API_BASIC_AUTH_USER=admin
API_BASIC_AUTH_PASSWORD=<your-strong-password>

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WooCommerce
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WOO_BASE_URL=https://yourstore.com
WOO_CONSUMER_KEY=<paste-consumer-key-from-woo>
WOO_CONSUMER_SECRET=<paste-consumer-secret-from-woo>
WOO_WEBHOOK_SECRET=<paste-webhook-secret>

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Gmail OAuth
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GMAIL_CLIENT_ID=<paste-google-client-id>
GMAIL_CLIENT_SECRET=<paste-google-client-secret>
GMAIL_REDIRECT_URI=http://localhost:3001/auth/gmail/callback

# Gmail search query (customize for your payment processors)
GMAIL_POLL_QUERY=(PayPal OR Zelle OR "Cash App" OR CashApp OR Venmo) subject:(payment OR sent OR received) newer_than:2d
```

### Step 4: Start Services

```bash
# Start all services with Docker Compose
docker compose up -d --build

# This will:
# - Build the API service
# - Build the Web UI
# - Start PostgreSQL
# - Start Redis
# - Run database migrations
# - Start background workers
```

### Step 5: Check Service Status

```bash
# View all services
docker compose ps

# Should show:
# - mission-control-db (postgres) - healthy
# - mission-control-redis - healthy
# - mission-control-api - healthy
# - mission-control-web - running

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f api
docker compose logs -f web
```

### Step 6: Verify Services are Running

Open your browser and check:

- **Dashboard**: http://localhost:3000
- **API Health**: http://localhost:3001/health

You should see the login page. Use the credentials from your `.env`:
- Username: Value of `API_BASIC_AUTH_USER`
- Password: Value of `API_BASIC_AUTH_PASSWORD`

---

## Part 4: Gmail Authorization

### Step 1: Get Authorization URL

```bash
# Get the Gmail OAuth URL
curl -u "$API_BASIC_AUTH_USER:$API_BASIC_AUTH_PASSWORD" \
  http://localhost:3001/auth/gmail/url

# This will return: {"url":"https://accounts.google.com/o/oauth2/v2/auth?..."}
```

### Step 2: Authorize in Browser

1. Copy the URL from the response
2. Open it in your browser
3. Sign in with your Gmail account
4. **Important**: If you see "This app isn't verified":
   - Click "Advanced"
   - Click "Go to Mission Control (unsafe)" - This is safe since it's your own app
5. Review the permissions:
   - Read your Gmail messages
   - Compose and manage drafts
6. Click "Allow"
7. You'll be redirected and see an authorization code in the URL

### Step 3: Exchange Code for Token

```bash
# Copy the 'code' parameter from the URL and run:
curl -u "$API_BASIC_AUTH_USER:$API_BASIC_AUTH_PASSWORD" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"code":"PASTE_YOUR_CODE_HERE"}' \
  http://localhost:3001/auth/gmail/callback

# Should return: {"ok":true}
```

### Step 4: Verify Gmail Connection

1. Go to http://localhost:3000
2. Check the Overview page
3. Look for "gmail_poller" status badge - should show "ok"

---

## Part 5: Local Webhook Testing

WooCommerce needs a public URL to send webhooks. Since you're running locally, use a tunnel.

### Option 1: Cloudflare Tunnel (Recommended)

```bash
# Install Cloudflare Tunnel
brew install cloudflare/cloudflare/cloudflared

# Start tunnel
cloudflared tunnel --url http://localhost:3001

# Output will show:
# Your quick Tunnel has been created! Visit it at:
# https://random-name.trycloudflare.com

# Use this URL + /webhooks/woo in WooCommerce
# Example: https://random-name.trycloudflare.com/webhooks/woo
```

### Option 2: ngrok

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 3001

# Copy the HTTPS forwarding URL
# Example: https://abc123.ngrok.io

# Use this URL + /webhooks/woo in WooCommerce
# Example: https://abc123.ngrok.io/webhooks/woo
```

### Configure WooCommerce Webhook

Now go back to **Part 2, Step 3** and create the webhook using your tunnel URL.

---

## Part 6: Verification & Testing

### Test 1: WooCommerce Connection

```bash
# Check if orders are being synced
docker compose logs -f api | grep "woo-poll"

# Should see successful polls every 60 seconds
```

Visit http://localhost:3000/orders - you should see your WooCommerce orders

### Test 2: Gmail Payment Detection

1. Send yourself a test email with payment keywords:
   - Subject: "Payment sent"
   - Body: "I sent you $50 via PayPal for order #123"
2. Wait 60 seconds (next Gmail poll cycle)
3. Check http://localhost:3000/payments
4. You should see the detected payment event

### Test 3: Webhook (Create Test Order)

1. Create a test order in WooCommerce
2. Check Mission Control logs:
   ```bash
   docker compose logs -f api | grep webhook
   ```
3. Should see: "Webhook received: order.created"
4. Order should appear in dashboard within seconds

### Test 4: Follow-ups

1. Create an order in WooCommerce with status "Pending payment"
2. Wait 15+ minutes
3. Check http://localhost:3000/follow-ups
4. Should see a scheduled follow-up with a draft email

---

## Part 7: Production Deployment (Optional)

For production deployment on a server:

### Update Environment Variables

```bash
# Change these for production:
NODE_ENV=production
API_BASIC_AUTH_PASSWORD=<strong-password>
GMAIL_REDIRECT_URI=https://yourdomain.com/auth/gmail/callback
```

### Update Google OAuth

1. Go back to Google Cloud Console
2. Add production redirect URI: `https://yourdomain.com/auth/gmail/callback`
3. Re-authorize Gmail with new URL

### SSL/TLS

- Use a reverse proxy (nginx) with Let's Encrypt
- Or deploy to a platform with built-in SSL (Railway, Render, DigitalOcean App Platform)

---

## Troubleshooting

### Services Won't Start

```bash
# Check Docker Desktop is running
docker ps

# View error logs
docker compose logs

# Restart services
docker compose down
docker compose up -d --build
```

### Gmail Auth Not Working

1. Verify redirect URI in Google Cloud Console matches `.env` exactly
2. Check Gmail API is enabled
3. Ensure you're using the correct Google account
4. Check logs: `docker compose logs -f api | grep gmail`

### Webhooks Not Received

1. Verify tunnel is running: `curl https://your-tunnel-url/health`
2. Check webhook secret matches in both WooCommerce and `.env`
3. Check WooCommerce webhook logs (in webhook settings)
4. Check API logs: `docker compose logs -f api | grep webhook`

### Database Issues

```bash
# Reset database (⚠️ destroys all data)
docker compose down -v
docker compose up -d --build

# Migrations will run automatically
```

### Permission Errors

```bash
# Fix Docker volume permissions
sudo chown -R $USER:$USER .
```

---

## Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View all logs
docker compose logs -f

# View specific service
docker compose logs -f api

# Restart a service
docker compose restart api

# Rebuild after code changes
docker compose up -d --build

# Check service health
docker compose ps

# Access database
docker compose exec db psql -U clawbot -d clawbot

# Run migrations manually
docker compose exec api npx prisma migrate deploy
```

---

## Next Steps

✅ System is now running!

1. **Explore the Dashboard**: http://localhost:3000
   - Overview → Revenue and system status
   - Orders → All WooCommerce orders
   - Payments → Detected payment events
   - Follow-ups → Scheduled emails
   - Logs → Audit trail

2. **Configure Settings** (coming soon):
   - Customize follow-up templates
   - Adjust confidence thresholds
   - Set up auto-send rules

3. **Monitor System Health**:
   - Check status badges on Overview page
   - Review logs for errors
   - Test follow-up generation

---

## Support

If you encounter issues:

1. Check the logs: `docker compose logs -f`
2. Verify all `.env` values are correct
3. Ensure all prerequisites are installed
4. Review this guide step-by-step

---

## Security Reminders

- ✅ Never commit `.env` to version control
- ✅ Use strong passwords for `API_BASIC_AUTH_PASSWORD`
- ✅ Keep `APP_ENCRYPTION_KEY` secret (64+ characters)
- ✅ Regenerate secrets if compromised
- ✅ Use HTTPS in production
- ✅ Regularly update Docker images

---

**🎉 You're all set! Your Mission Control is now operational.**

Visit http://localhost:3000 to start managing your operations.
