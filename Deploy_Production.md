# Production Deployment Guide

This guide covers everything needed to ship the current branch to production.

---

## What's changing

| Area | Change |
|---|---|
| **Subscriptions** | Plan limits/prices can now be overridden from the DB (admin API), cached on boot |
| **Settings** | Structured origin address (city, province, postal code); public settings endpoint; social links |
| **Delivery** | Switched from lat/lng to area-name origin lookup via Biteship; flat-rate delivery support |
| **Products** | New `subtitle` and `discounted_price` fields |
| **Admin API** | `GET/PATCH /admin/plans` — edit plan config from DB; `POST /admin/plans/cancel-stale` |
| **Admin CLI** | Local CLI tool in `Admin/` for DB management |

---

## Step 1 — Run database migrations

Run these in order on your Supabase project. You can use the Supabase Dashboard SQL editor or `psql`.

### Combined migration script

Copy and run this entire block — it is safe to re-run (all statements are idempotent):

```sql
-- ── 1. plan_configs ──────────────────────────────────────────────────────────
-- Stores per-plan overrides editable via the admin API.
-- If a plan has no row here, the backend uses its hardcoded defaults.
CREATE TABLE IF NOT EXISTS plan_configs (
  plan_key   TEXT        PRIMARY KEY,
  config     JSONB       NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. product subtitle & discounted price ───────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS subtitle         TEXT,
  ADD COLUMN IF NOT EXISTS discounted_price NUMERIC(12, 2) CHECK (discounted_price >= 0);

-- ── 3. subscriptions amount_paid ─────────────────────────────────────────────
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS amount_paid INTEGER;

-- ── 4. settings — structured origin address ──────────────────────────────────
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS origin_city        TEXT,
  ADD COLUMN IF NOT EXISTS origin_province    TEXT,
  ADD COLUMN IF NOT EXISTS origin_postal_code TEXT;
```

### Where to run it

**Option A — Supabase Dashboard (easiest)**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project
2. Open **SQL Editor** → **New query**
3. Paste the block above and click **Run**

**Option B — psql**
```bash
psql "$DATABASE_URL" -f - <<'SQL'
# (paste the block above)
SQL
```

---

## Step 2 — Set new environment variables (Netlify)

Go to **Netlify → your backend site → Site configuration → Environment variables** and add/verify:

| Variable | Description | Required |
|---|---|---|
| `ADMIN_KEY` | Secret key for `x-admin-key` header on `/admin/*` routes | Yes (new) |
| `BITESHIP_API_URL` | e.g. `https://api.biteship.com/v1` | Already set? Verify |
| `BITESHIP_API_KEY` | Your Biteship API key | Already set? Verify |

> **Note:** `ADMIN_KEY` is new. Without it every request to `/admin/plans` will return 403, which is the safe default.

---

## Step 3 — Deploy backend to Netlify

Netlify deploys automatically on push to `main`. After pushing:

1. Go to **Netlify → your backend site → Deploys**
2. Wait for the build to finish (watch for errors)
3. Test with a quick smoke check:

```bash
# Should return your plans array
curl https://<your-backend>.netlify.app/.netlify/functions/api/subscriptions/plans

# Should return store settings (public fields)
curl https://<your-backend>.netlify.app/.netlify/functions/api/settings/public/<your-store-id>
```

---

## Step 4 — Update store origin address

The delivery system now uses city/province text fields instead of lat/lng. After deploying:

1. Log in as store owner
2. Go to **Settings → Store**
3. Fill in **Origin City**, **Origin Province**, and **Origin Postal Code**
4. Save — delivery estimates will now resolve correctly via Biteship

---

## Step 5 — (Optional) Set plan overrides via admin API

If you want to override pricing/limits for a plan without redeploying:

```bash
# View current effective config for all plans
curl -H "x-admin-key: $ADMIN_KEY" \
  https://<your-backend>.netlify.app/.netlify/functions/api/admin/plans

# Override starter plan price
curl -X PATCH \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"priceIdr": 49000}' \
  https://<your-backend>.netlify.app/.netlify/functions/api/admin/plans/starter
```

Valid override fields: `priceIdr`, `maxProducts`, `maxOrders`, `maxOrderLinks`, `maxStaff`, `features`, `description`, `displayName`.

---

## Step 6 — Admin CLI (local only, no deployment)

The `Admin/` folder contains a local CLI for DB operations. It does not need to be deployed.

```bash
cd Admin
npm install
cp .env.example .env   # fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm start              # launches the CLI menu
```

---

## Rollback

All DB migrations use `ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS` — they add columns, never drop them. Rolling back the backend code is safe; the extra columns are harmless.

If you need to roll back the `plan_configs` table:
```sql
DROP TABLE IF EXISTS plan_configs;
```
