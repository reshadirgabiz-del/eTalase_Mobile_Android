# Domain Setup Guide — e-talase.com

You've purchased `e-talase.com`. This document covers every place you need to register the domain, a proposed subdomain architecture, and how to configure Resend for transactional email.

---

## Proposed Subdomain Map

| Subdomain | Purpose | Hosted on |
|---|---|---|
| `e-talase.com` | Root — redirect to `app.e-talase.com` or a landing page | Vercel |
| `app.e-talase.com` | Dashboard / main app (Next.js) | Vercel |
| `api.e-talase.com` | NestJS backend REST API | Railway |
| `mail.e-talase.com` | Resend transactional email sending domain (DNS-only) | — |
| `store.e-talase.com` *(optional)* | Single public storefront | Vercel (same deployment) |
| `*.e-talase.com` *(future)* | Per-store storefronts via wildcard | Vercel (same deployment) |

> **Storefront via subdomain:** The current storefront lives at `app.e-talase.com/[storeId]`. Moving it to a subdomain (e.g. `store.e-talase.com` or `[slug].e-talase.com`) is **possible** — Next.js Middleware can read the incoming `Host` header, resolve the store from it, and rewrite the request to the correct internal route. This requires a wildcard DNS record (`*.e-talase.com → Vercel`) and a wildcard domain added in the Vercel project. No separate deployment is needed, but it is a meaningful backend change (store slug field + middleware). Recommended as a later milestone once the store list is stable.

---

## 1 — Vercel (Frontend)

1. Go to **Vercel → your project → Settings → Domains**.
2. Add `e-talase.com` and `app.e-talase.com`.
3. Vercel will show DNS records to add at your registrar (usually an `A` record for the root and a `CNAME` for `app`).
4. At your domain registrar (Namecheap, Cloudflare, etc.), add those records.
5. Update environment variable in Vercel:
   - `NEXT_PUBLIC_API_URL` → `https://api.e-talase.com`
6. *(Optional)* Add a redirect rule so `e-talase.com` → `app.e-talase.com` using Vercel's built-in redirect or a `vercel.json`:

```json
{
  "redirects": [
    { "source": "/", "destination": "https://app.e-talase.com", "permanent": true }
  ]
}
```

---

## 2 — Railway (Backend API)

1. Go to **Railway → your backend service → Settings → Networking → Custom Domain**.
2. Add `api.e-talase.com`.
3. Railway gives you a `CNAME` target (e.g. `xxxx.railway.app`). Add that at your registrar.
4. Update backend environment variable:
   - `CORS_ORIGIN` → `https://app.e-talase.com` (comma-separate if you also need the root: `https://app.e-talase.com,https://e-talase.com`)

---

## 3 — Resend (Transactional Email)

Resend recommends verifying a **subdomain** (`mail.e-talase.com`) rather than the root domain. This isolates your transactional email reputation from any future marketing campaigns sent from the root domain, and keeps root-level DNS clean.

### 3a — Add the domain in Resend

1. Go to **Resend Dashboard → Domains → Add Domain**.
2. Enter `mail.e-talase.com`.
3. Resend will show you DNS records to add (SPF, DKIM, DMARC). Add them at your registrar under `mail.e-talase.com`.

> Because you are verifying `mail.e-talase.com`, Resend lets you send **from any address at that subdomain**, e.g. `info@mail.e-talase.com`. If you want to send from `info@e-talase.com` (root domain), verify `e-talase.com` instead. For a small platform, either works — using the subdomain is safer long-term.

### 3b — Receiving email at info@e-talase.com

Resend only handles **sending**. For a receiving inbox at `info@e-talase.com`, use one of:

| Option | How |
|---|---|
| **Cloudflare Email Routing** (free) | Add your domain to Cloudflare, enable Email Routing, forward `info@e-talase.com` to your personal inbox |
| **ImprovMX** (free tier) | Add MX records from ImprovMX; alias `info@` → your personal email |
| **Google Workspace** (~$6/user/mo) | Full inbox at `info@e-talase.com` |

Cloudflare Email Routing is the easiest free option if you're already on Cloudflare for DNS.

### 3c — Backend SMTP config for Resend

Update Railway backend environment variables:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_<your_resend_api_key>
SMTP_FROM=info@mail.e-talase.com
```

> If you verified the root domain instead, use `SMTP_FROM=info@e-talase.com`.

---

## 4 — Clerk (Auth)

Your frontend env vars use **relative paths** (`/`, `/sign-in`) so they work on any domain without changes. The only things to update are inside the Clerk Dashboard.

### 4a — Set the production domain (Home URL)

1. Go to **Clerk Dashboard → Configure → Domains**.
2. You'll see a "Home URL" field — change it from your old Railway/Vercel preview URL to `https://app.e-talase.com`.
3. This is the base Clerk uses when constructing absolute links in its own UI flows (OAuth callbacks, etc.).

### 4b — Allowed redirect URLs

Clerk validates that after sign-in/sign-up the user is only sent to URLs you've explicitly approved.

1. Still in **Configure → Domains**, look for **"Allowed redirect origins"** (or "Redirect URLs" depending on your Clerk version).
2. Add `https://app.e-talase.com`.
3. Remove any old preview URLs (e.g. `https://your-project.vercel.app`) once you've confirmed the new domain works.

> **Why this matters:** Clerk will block the post-auth redirect with an error if the origin isn't on this list. Your code uses relative paths (`/`) so it inherits whatever domain the app is running on — but Clerk still checks the origin domain against this list.

### 4c — Email templates (magic links / password reset)

Clerk's built-in email templates for magic links and password resets contain a button that links back to your app. By default Clerk uses your Home URL as the base.

1. Go to **Clerk Dashboard → Customization → Emails**.
2. Check each template (Magic Link, Password Reset, Invitation, etc.) for any hardcoded URLs — if they use `{{app_url}}` or similar variables, they will pick up the Home URL you set in 4a automatically.
3. If any template has a hardcoded old URL, replace it with `https://app.e-talase.com`.

### 4d — Vercel environment variables

No changes needed for the Clerk keys themselves. Just confirm these vars are set in **Vercel → your project → Settings → Environment Variables**:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxx   ← must be the PRODUCTION key, not test
CLERK_SECRET_KEY=sk_live_xxxx                     ← must be the PRODUCTION key, not test
```

Clerk has separate key pairs for development and production. Make sure you're using the **live** keys (prefixed `pk_live_` / `sk_live_`) in your Vercel production environment.

---

## 5 — Supabase

Supabase uses its own `xxxx.supabase.co` URL internally — you do **not** add a custom domain here unless you are on the Supabase Pro plan and want to use the custom domain feature.

If you upgrade later: **Supabase Dashboard → Project Settings → Custom Domains**.

For now, the backend connects via `SUPABASE_URL` (the `xxxx.supabase.co` URL). No change needed.

---

## 6 — Midtrans

Midtrans does not host a web UI under your domain. The only domain-related step is updating the **Finish / Unfinish / Error redirect URLs** in your Midtrans dashboard to point to your new domain:

1. Go to **Midtrans Dashboard → Settings → Snap Preferences** (or your payment settings).
2. Update redirect URLs to `https://app.e-talase.com/...` as appropriate.
3. Add `https://app.e-talase.com` to the allowed CORS / referer origins if Midtrans requires it.

---

## 7 — Biteship

Biteship is an API-only service with no domain-hosted UI. No DNS change needed. Just ensure your Railway `BITESHIP_API_KEY` is set correctly.

---

## Checklist Summary

- [X] Add `e-talase.com` and `app.e-talase.com` in Vercel → update `NEXT_PUBLIC_API_URL`
- [X] Add `api.e-talase.com` in Railway → update `CORS_ORIGIN`
- [X] Add `mail.e-talase.com` in Resend → add DNS records → update backend SMTP vars in Railway
- [X] Set up email receiving for `info@e-talase.com` (Cloudflare Routing recommended)
- [X] Update Clerk allowed domains and redirect URLs
- [ ] Update Midtrans redirect URLs
- [X] *(Optional)* Enable storefront subdomain routing (see note at top)
