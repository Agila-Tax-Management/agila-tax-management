# Deployment Checklist

This checklist covers all setup steps required before deploying the Agila Tax Management System to production.

---

## ✅ Completed Setup

### 1. Testing Framework (Jest)
- ✅ Jest 30.3.0 installed with React Testing Library
- ✅ Configuration files created (`jest.config.js`, `jest.setup.js`)
- ✅ 3 sample test suites with 9 passing tests
- ✅ Test scripts added to `package.json`
- ✅ Coverage threshold: 50% (branches, functions, lines, statements)

**Documentation**: See [docs/JEST_SETUP.md](./JEST_SETUP.md)

### 2. Error Monitoring (Sentry)
- ✅ @sentry/nextjs installed (143 packages)
- ✅ Client, server, and edge config files created
- ✅ Instrumentation hook enabled
- ✅ Next.js config wrapped with `withSentryConfig`
- ✅ Sensitive data filtering configured
- ✅ Session replay enabled (10% sample rate)
- ✅ Vercel Cron monitoring enabled

**Documentation**: See [docs/SENTRY_SETUP.md](./SENTRY_SETUP.md)

### 3. Data Retention Policy
- ✅ Prisma schema updated with `archivedAt` field
- ✅ Cron job API route created (`/api/cron/data-retention`)
- ✅ Vercel cron scheduled (monthly, 1st day at 2 AM)
- ✅ 7-year ActivityLog archival (Philippine BIR compliance)
- ✅ 90/180-day notification cleanup
- ✅ Sentry integration for cron monitoring

**Documentation**: See [docs/DATA_RETENTION_POLICY.md](./DATA_RETENTION_POLICY.md)

---

## 🔲 Immediate Next Steps

### Step 1: Start PostgreSQL Database

The database is currently not running. Start it with Docker Compose:

```bash
# Start PostgreSQL in detached mode
docker-compose up -d
```

**Verify it's running:**
```bash
docker ps
```

You should see `postgres:15-alpine` running on port 5432.

---

### Step 2: Apply Prisma Migration

The `archivedAt` field has been added to the schema but not yet applied to the database:

```bash
# Apply the migration
npx prisma migrate dev --name add_archived_at_to_activity_log

# Verify the migration
npx prisma studio
```

In Prisma Studio, check that the `ActivityLog` table now has an `archivedAt` column.

---

### Step 3: Configure Sentry

1. **Create a Sentry account**: https://sentry.io/signup/
2. **Create a new project**:
   - Platform: **Next.js**
   - Project name: `agila-tax-management` (or your preferred name)
3. **Get your DSN**:
   - Copy the DSN from the setup page
   - Example: `https://abc123@o123456.ingest.sentry.io/7654321`
4. **Create an Auth Token**:
   - Go to Settings → Account → API → Auth Tokens
   - Click "Create New Token"
   - Name: `Vercel Deployment`
   - Scopes: `project:read`, `project:releases`, `org:read`
   - **Copy the token** (you won't see it again!)

5. **Add to `.env`**:
```bash
# Sentry Configuration (Error Monitoring)
NEXT_PUBLIC_SENTRY_DSN="https://your-actual-dsn@sentry.io/project-id"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="agila-tax-management"
SENTRY_AUTH_TOKEN="your-auth-token-here"
```

**Documentation**: See [docs/SENTRY_SETUP.md](./SENTRY_SETUP.md#-environment-variables-required)

---

### Step 4: Generate CRON_SECRET

Generate a secure random string for the data retention cron job:

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**macOS/Linux:**
```bash
openssl rand -base64 32
```

**Add to `.env`**:
```bash
# Vercel Cron Secret (for data retention job)
CRON_SECRET="your-generated-secret-here"
```

---

### Step 5: Test Locally

#### Test Sentry Integration
1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Trigger a test error in any component:
   ```typescript
   throw new Error('Test Sentry error');
   ```

3. Check your Sentry dashboard → Issues → you should see the error with full stack trace

#### Test Data Retention Cron Job
```bash
# Call the endpoint with your CRON_SECRET
curl -X GET "http://localhost:3000/api/cron/data-retention" \
  -H "Authorization: Bearer your-cron-secret-here"
```

Expected response:
```json
{
  "status": "success",
  "results": {
    "activityLogsArchived": 0,
    "notificationsDeletedRead": 0,
    "notificationsDeletedUnread": 0,
    "errors": []
  },
  "timestamp": "2026-04-15T14:30:00.000Z"
}
```

---

### Step 6: Run Tests

Verify all tests pass before deploying:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

Expected: All 9 tests should pass.

---

### Step 7: Deploy to Vercel

#### First-time Deployment

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add Sentry error monitoring and data retention policy"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com/
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**:
   In Vercel project settings, add all variables from `.env.example`:
   - `DATABASE_URL` (use Vercel Postgres or external PostgreSQL)
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL` (set to your production URL, e.g., `https://yourdomain.com`)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN`
   - `CRON_SECRET`

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your app

#### Vercel Cron Jobs

After deployment, verify cron jobs in Vercel dashboard:

- Go to your project → Cron Jobs
- You should see:
  - `/api/cron/billing` — Daily at midnight
  - `/api/cron/data-retention` — Monthly on 1st at 2 AM

**Sentry monitors these automatically** — check Sentry → Crons to see execution logs.

---

### Step 8: Post-Deployment Verification

1. **Test Sentry in production**:
   - Trigger an error on the production site
   - Check Sentry dashboard for the issue

2. **Verify Cron Jobs**:
   - Wait for the next scheduled run (or manually trigger via Vercel dashboard)
   - Check Sentry → Crons for execution logs

3. **Monitor Performance**:
   - Sentry → Performance → see transaction traces
   - Check for slow database queries

4. **Check Database Migration**:
   - Verify `ActivityLog` table has `archivedAt` column
   - Verify `InternalNotification` table exists

---

## 📋 Environment Variables Summary

Your `.env` file should have:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/tax-management?schema=public"

# BetterAuth
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000" # Use production URL in production

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Sentry
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="agila-tax-management"
SENTRY_AUTH_TOKEN="your-auth-token"

# Vercel Cron
CRON_SECRET="your-secure-random-string"

# Optional
NODE_ENV="development"
```

---

## 📚 Documentation

All documentation is in the `docs/` folder:

- [docs/JEST_SETUP.md](./JEST_SETUP.md) — Testing framework setup and usage
- [docs/TESTING_GUIDE.md](./TESTING_GUIDE.md) — How to write tests
- [docs/SENTRY_SETUP.md](./SENTRY_SETUP.md) — Error monitoring setup
- [docs/DATA_RETENTION_POLICY.md](./DATA_RETENTION_POLICY.md) — Data retention implementation
- [docs/codebase/](./codebase/) — Full codebase documentation

---

## ✅ Quick Start

```bash
# 1. Start database
docker-compose up -d

# 2. Apply migration
npx prisma migrate dev

# 3. Configure environment variables
# Copy .env.example to .env and fill in values

# 4. Run tests
npm test

# 5. Start dev server
npm run dev

# 6. Deploy to Vercel
git push origin main
```

---

**Status**: Ready for deployment  
**Date**: April 15, 2026  
**Platform**: Vercel + PostgreSQL  
**Monitoring**: Sentry + Vercel Cron
