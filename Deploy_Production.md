# Jastip Platform — Production Deployment Guide (Web)

> **Scope:** Backend (NestJS on Railway) + Frontend (Next.js on Vercel). Mobile is Release 2.

---

## Pre-flight: What's Already Done

Both repos are already on GitHub and up to date:
- **Backend**: `github.com/reshadirgabiz-del/jastip-backend`
- **Frontend**: `github.com/RESHADIRGABIZ-DEL/jastip-live`

Phase 1 (push to GitHub) is complete. Start at Phase 2.

---

## Phase 2 — Database (Supabase)

Open **Supabase → SQL Editor** and run these files **in this exact order**:

| # | File |
|---|---|
| 1 | `supabase/schema.sql` |
| 2 | `supabase/migrations/20260519_add_invitation_fields.sql` |
| 3 | `supabase/migrations/20260520_add_subscriptions.sql` |
| 4 | `supabase/migrations/20260521_add_order_links.sql` |
| 5 | `supabase/migrations/20260522_order_links_message_permanent.sql` |
| 6 | `supabase/migrations/20260523_add_enabled_couriers.sql` |
| 7 | `supabase/migrations/20260524_add_r2_cleanup_queue.sql` |
| 8 | `supabase/migrations/20260525_add_push_tokens.sql` |
| 9 | `supabase/migrations/20260526_add_promo_codes.sql` |
| 10 | `supabase/migrations/20260527_add_promo_code_conditions.sql` |
| 11 | `supabase/migrations/20260528_atomic_promo_increment.sql` |
| 12 | `supabase/rls.sql` |

After running, confirm in **Supabase → Storage** that the `order-attachments` bucket exists and is **private**.

**Collect these credentials** (needed in Phase 3):
- Project URL (`https://xxxx.supabase.co`)
- `service_role` secret key
- `anon` public key

---

## Phase 3 — Cloudflare R2 (Order Attachments)

Order attachments are stored in Cloudflare R2, not Supabase Storage. Without this, any file upload in the dashboard will fail silently.

**3.1 Create an R2 bucket**

1. Go to Cloudflare Dashboard → R2 → Create bucket. Name it `jastip-attachments`.
2. Under the bucket → **Settings → Public Access**, enable the public development URL (or bind a custom domain).
3. Copy the public URL (e.g. `https://pub-xxxx.r2.dev`).

**3.2 Create R2 API credentials**

1. Cloudflare Dashboard → R2 → **Manage R2 API Tokens** → Create API Token.
2. Give it **Object Read & Write** permission scoped to your bucket.
3. Copy the **Access Key ID** and **Secret Access Key**.

**Collect these** (needed in Phase 4):
- `R2_ACCOUNT_ID` — your Cloudflare account ID (top-right of the dashboard)
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME` = `jastip-attachments`
- `R2_PUBLIC_URL` = `https://pub-xxxx.r2.dev`

---

## Phase 4 — Deploy Backend (Railway)

**4.1 Create a Railway project**

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select `jastip-backend`
3. Railway auto-detects Node.js

**4.2 Set environment variables in Railway**

Go to your service → **Variables** tab and add every key below:

```
PORT=3001
CORS_ORIGIN=https://your-vercel-url.vercel.app    ← placeholder, fill after Phase 5

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

CLERK_SECRET_KEY=sk_live_xxxx
CLERK_WEBHOOK_SECRET=whsec_xxxx

MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx

BITESHIP_API_KEY=<biteship_sandbox_key>
BITESHIP_API_URL=https://api.biteship.com/v1

R2_ACCOUNT_ID=<cloudflare_account_id>
R2_ACCESS_KEY_ID=<r2_access_key>
R2_SECRET_ACCESS_KEY=<r2_secret_key>
R2_BUCKET_NAME=jastip-attachments
R2_PUBLIC_URL=https://pub-xxxx.r2.dev

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASS=<gmail_app_password>
SMTP_FROM=no-reply@yourdomain.com

FRONTEND_URL=https://your-vercel-url.vercel.app   ← placeholder, fill after Phase 5
```

> **Do NOT set `MIDTRANS_MOCK_MODE`** — that is a dev-only bypass. Leave it unset in production.

**4.3 Verify build & start commands in Railway → Settings → Build**

```
Build command:  npm run build
Start command:  node dist/main
```

**4.4 Deploy and verify**

1. Trigger a deploy — watch logs until you see `Nest application successfully started`
2. Railway provides a URL like `https://jastip-backend-production.up.railway.app`
3. Test: `curl https://your-railway-url.up.railway.app/` — should return `200 OK`
4. **Copy this URL** — needed for Phase 5

---

## Phase 5 — Deploy Frontend (Vercel)

**5.1 Import to Vercel**

1. Go to [vercel.com](https://vercel.com) → New Project → Import Git Repository
2. Select `jastip-live`
3. Framework preset: **Next.js** (auto-detected)
4. **Do not deploy yet** — set env vars first

**5.2 Set environment variables in Vercel → Settings → Environment Variables**

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxx
CLERK_SECRET_KEY=sk_live_xxxx

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app

NEXT_PUBLIC_STORE_ID=                            ← leave blank for now

NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js

NEXT_PUBLIC_MERCHANT_NAME=Nama Toko Kamu
NEXT_PUBLIC_MERCHANT_TAGLINE=Tagline toko kamu
NEXT_PUBLIC_MERCHANT_LOGO_URL=https://...
NEXT_PUBLIC_MERCHANT_COLOR=#2563eb
NEXT_PUBLIC_MERCHANT_LAT=-6.2088
NEXT_PUBLIC_MERCHANT_LNG=106.8456
NEXT_PUBLIC_MERCHANT_ADDRESS=Jakarta, Indonesia
```

**5.3 Deploy**

Click **Deploy**. Watch the build log — it should complete with no TypeScript errors. Vercel provides a URL like `https://jastip-live.vercel.app`.

---

## Phase 6 — Wire Up the Two Services

Now that both URLs are known, update the cross-references.

**6.1 Update Backend env vars on Railway**

```
CORS_ORIGIN=https://jastip-live.vercel.app
FRONTEND_URL=https://jastip-live.vercel.app
```

Redeploy the backend (Railway → Deployments → Redeploy).

**6.2 Update Clerk allowed origins**

In **Clerk Dashboard → Domains → Allowed Origins**, add:
- `https://jastip-live.vercel.app`

In **Clerk Dashboard → Paths**, set:
- Sign-in URL: `https://jastip-live.vercel.app/sign-in`
- Sign-up URL: `https://jastip-live.vercel.app/sign-up`
- After sign-in: `https://jastip-live.vercel.app/`
- After sign-up: `https://jastip-live.vercel.app/`

---

## Phase 7 — First-Run Seed (Create Your Store)

**7.1 Sign up on your live frontend**

Go to `https://jastip-live.vercel.app/sign-up` and create your owner account.

**7.2 Get your Clerk User ID**

- Open **Clerk Dashboard → Users**
- Find your account → copy the **User ID** (starts with `user_`)

**7.3 Run the seed SQL**

Open `supabase/seed.sql`, replace the placeholders:
- `user_clerk_id_here` → your Clerk User ID
- `owner@example.com` → your email

Run it in **Supabase → SQL Editor**.

**7.4 Set STORE_ID in Vercel**

The seed creates a store with UUID `aaaaaaaa-0000-0000-0000-000000000001`. In Vercel:

```
NEXT_PUBLIC_STORE_ID=aaaaaaaa-0000-0000-0000-000000000001
```

Go to **Deployments → Redeploy** (with existing build is fine).

---

## Phase 8 — Configure Midtrans Webhook

In **Midtrans Dashboard → Settings → Payment Notification**, set:

```
https://your-railway-url.up.railway.app/subscriptions/webhook
```

This enables subscription payments to activate automatically.

---

## Phase 9 — Store Settings & Verification

**9.1 Configure your store**

Log in at `https://jastip-live.vercel.app` → **Dashboard → Settings**:
- Store name, logo, description
- Origin address (lat/lng — required for Biteship shipping rates)
- Your store's own Midtrans keys

**9.2 Run the verification checklist**

- [ ] Storefront loads: `https://jastip-live.vercel.app/<store-id>` shows products
- [ ] Customer can place an order and reach the Midtrans Sandbox payment screen
- [ ] Dashboard shows the paid order after payment
- [ ] Owner can update order status
- [ ] Member invite email is received and the acceptance link works
- [ ] Invited delivery member sees only the Orders tab after logging in
- [ ] Admin member can add/edit products and create order links
- [ ] Order link opens the storefront and pre-fills the cart
- [ ] Subscription flow: `/pricing` → select plan → Midtrans Sandbox payment completes
- [ ] Uploading an attachment on an order succeeds (tests R2)

---

## Phase 10 — Go Live (Switch to Production Keys)

Only do this after all sandbox tests in Phase 9 pass.

**Backend (Railway):**
```
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=Mid-server-xxxx          ← production key
BITESHIP_API_KEY=<production_biteship_key>
```

**Frontend (Vercel):**
```
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-xxxx   ← production key
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.midtrans.com/snap/snap.js
```

Also update per-store Midtrans keys in **Dashboard → Settings → Midtrans Configuration**.

Redeploy both services after changing keys.

---

## Quick Reference — What Lives Where

| Service | Platform | Notes |
|---|---|---|
| Backend (NestJS) | Railway | `node dist/main`, port from `PORT` env |
| Frontend (Next.js) | Vercel | Auto-deploys on git push to main |
| Database | Supabase | Schema + RLS applied in Phase 2 |
| Auth | Clerk | Update allowed origins after each domain change |
| Payments | Midtrans | Sandbox first → Production in Phase 10 |
| Shipping | Biteship | Sandbox first → Production in Phase 10 |
| File storage | Cloudflare R2 | `jastip-attachments` bucket, public URL via R2 dev domain |
