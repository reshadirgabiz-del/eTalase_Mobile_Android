# Security Recommendations

Companion to `REPORT.md`. Fixes are ordered by severity. Code locations use `path:line` so they can be opened directly.

---

## P0 — Fix immediately

### R1 — Authenticate `/api/onboarding` and decouple `creditGranted` from the client
**Addresses:** F1 (CRITICAL).
**File:** `src/app/api/onboarding/route.ts`, `src/middleware.ts:4-13`.

- Remove `/api/onboarding` from the `PUBLIC` whitelist in `src/middleware.ts`. Make it require a Clerk JWT (verify in the route handler via `@clerk/nextjs` `auth()` or by porting the existing NestJS guard).
- Take `userId` from the verified Clerk session, **never** from the request body. The current shape lets any caller name an arbitrary userId.
- Move the credit-grant step out of the user-controllable path. Instead:
  1. Persist `onboarding_responses.completed_at` from the authenticated user.
  2. Have a separate server-side trigger (DB trigger, scheduled job, or NestJS-side post-completion hook) grant the 25k IDR credit. Keep the idempotency check on `credit_transactions` (`type='promo'`, `user_id`).
- Verify there is no path that lets the same user delete their `credit_transactions` row to re-trigger a grant.

Acceptance test: replicate F1's curl against staging — should return 401.

### R2 — Make order attachments private + return signed URLs
**Addresses:** F2 (CRITICAL).
**Files:** `Backend/src/orders/orders.service.ts:1577` (`signAttachments`), `Backend/src/upload/upload.service.ts`.

- Move `order-attachments` storage to a private R2 bucket (separate from product images). Update `UploadService.upload` to write to the private bucket when `folder === 'attachments'` or `kind === 'proof'`.
- Replace the stub in `signAttachments` with a real presign call (`@aws-sdk/s3-request-presigner.getSignedUrl`), expiry 1 hour, per the spec in `Backend/CLAUDE.md`.
- Migrate existing attachment objects to the private bucket; rewrite stored `file_path` columns to the new keys.
- Add a unit test that asserts the returned URL has an `X-Amz-Expires` query param.

---

## P1 — Fix this sprint

### R3 — Compare-and-swap on order state transitions
**Addresses:** T2.3 / F5 (HIGH).
**Files:** `Backend/src/orders/orders.service.ts:739`, `:815`, `:917`.

Rewrite each status update from:
```ts
const { data: order } = await db.from('orders').select('status').eq('id', id).single();
if (order.status !== 'pending') throw ...;
await db.from('orders').update({ status: 'paid' }).eq('id', id);
```
to:
```ts
const { data, error } = await db.from('orders')
  .update({ status: 'paid' })
  .eq('id', id)
  .eq('store_id', storeId)
  .eq('status', 'pending')        // ← guard
  .select('id')
  .single();
if (error || !data) throw new BadRequestException('Order tidak dalam status pending');
```
Then run downstream side-effects (`confirmPromoUsage`, notifications) only when the update returned exactly one row.

Also wrap `confirmPromoUsage` in a `WHERE current_usages < max_usages` predicate or use the existing `atomic_promo_increment` migration's RPC (the migration list shows `20260528_atomic_promo_increment.sql` — verify the RPC is actually called from the service).

Acceptance test: spawn 10 concurrent `POST /orders/:id/confirm-transfer` against a fresh order; assert only one returns 200 and exactly one notification was emitted.

### R4 — Rotate admin session model
**Addresses:** F3 (HIGH).
**File:** `src/lib/auth.ts`.

Replace the static `HMAC(secret, password)` token with one of:
- **Quick fix:** include a random per-session ID and an `iat`/`exp` claim, sign with the secret. Validate on every request; reject if expired or in a server-side revocation set.
- **Better:** store sessions in Supabase (`admin_sessions(id, created_at, expires_at, revoked_at)`); cookie carries only the session ID. Provide a `/api/auth/logout-all` to revoke.

Either path gives you proper expiry, revocation, and forward secrecy. Keep the existing rate-limit on `/api/auth/login`.

### R5 — Make `SUPABASE_WEBHOOK_SECRET` mandatory
**Addresses:** F4 (MEDIUM).
**Files:** all four `…/notify/route.ts` handlers.

Change:
```ts
if (webhookSecret) { ... }
```
to:
```ts
if (!webhookSecret) return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
if (signature !== webhookSecret) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
```
Add a boot-time assertion in a single shared utility so misconfiguration is caught at deploy time, not at first call.

Bonus: use a constant-time comparison (`crypto.timingSafeEqual`) for the secret check, like `auth.ts` already does for the admin password.

---

## P2 — Hardening

### R6 — Trim the `DeliveryOptionDto.price` field
**Addresses:** code clarity around T5.2.
**File:** `Backend/src/orders/dto/create-order.dto.ts:44`.

Remove `@IsNumber() price: number` from the DTO. The server already ignores it (`resolveDeliveryPrice` re-quotes), but keeping it in the contract suggests it's trusted. Removing it makes the trust boundary self-documenting and prevents a future refactor from accidentally piping the client value through.

### R7 — Restrict invite list to owner/admin
**Addresses:** T3.3 caveat.
**File:** `Backend/src/members/members.service.ts:27`.

`list()` calls `requireMembership`. Change to `requireOwnerOrAdmin` so delivery-role staff can't see other staff invite emails. Keeps payroll/staffing concerns separated.

### R8 — Endpoint-level throttles for sensitive merchant actions
**Addresses:** T6.x gap (informational since the suite was excluded).
**File:** `Backend/src/orders/orders.controller.ts`.

Add `@Throttle({ default: { limit: 5, ttl: 60_000 } })` to:
- `POST /orders/:id/confirm-transfer`
- `POST /stores/:storeId/members` (invites)
- `Patch /orders/:id/status`

Global 120/min is too loose for write endpoints that emit notifications or alter financial state.

### R9 — Add CI test that asserts middleware whitelist is small
**Addresses:** future regressions of F1 / F4.
**File:** `src/middleware.ts`.

Write a unit test that imports `PUBLIC` and asserts:
- It contains only the expected routes (snapshot of an explicit set).
- Each route in `PUBLIC` has a matching `__public_route__: true` marker comment in its handler, OR is listed in an `EXPECTED_PUBLIC` constant in the test.

This makes "I added a new public route" a deliberate diff in two places.

### R10 — Document and harden the storefront `storeId` trust boundary
**Addresses:** general design clarity.
**File:** `Backend/src/stores/store-public-access.service.ts:134-155` (`resolvePublicStoreId`).

When `publicKey` is absent, the function returns the client's `storeId` unchanged. This is correct because CORS already restricts which origins can call without a key, but the behavior is non-obvious. Add a doc-comment explicitly stating: *"Without a publicKey, callers must come from a `CORS_ORIGIN`-allowed origin; the CORS layer is the enforcement boundary, not this function."* Otherwise a future refactor that moves this onto an internal channel will reintroduce IDOR.

### R11 — Confirm `GET /products/:id` does not leak archived/inactive products
**Addresses:** F7.
**File:** `Backend/src/products/products.service.ts:223`.

Add either:
- `.eq('is_archived', false)` in the query, or
- A scope-aware variant where authenticated merchants can see archived items and the public path cannot.

Document the policy in the controller method.

### R12 — Use Supabase RLS as defense-in-depth (long-term)
The service uses the `service_role` key for everything (per CLAUDE.md: *"bypasses Row Level Security"*). All multi-tenancy guarantees live in TypeScript. RLS policies that mirror the in-app checks (`store_members.user_id = auth.uid()`) would catch a single missed `.eq('store_id', …)` predicate. Worth scoping into a tracking ticket.

---

## Verification Checklist

After applying P0/P1 fixes, run:

- [ ] Re-run `T1.1`–`T1.4` (cross-store IDOR) → expect all PASS.
- [ ] `T2.3` race repro: 10 parallel confirm requests → exactly one 200, one notification.
- [ ] Curl `POST /api/onboarding -d '{"userId":"foo","creditGranted":true}'` → expect 401.
- [ ] Open an attachment URL after waiting 2 hours → expect 403/SignatureExpired.
- [ ] Steal admin cookie from one browser, paste into another logged-out browser after server restart with rotated session key → expect 401.
- [ ] `POST /api/credits/topup-requests/notify` with no `x-webhook-secret` after R5 → expect 500 if env unset, 401 if set but wrong.

---

## Out of scope (worth tracking separately)

- Mobile app token storage hardening (root/jailbreak detection, certificate pinning).
- Audit-log retention and tamper-evidence (currently audit entries are stored in the same Supabase project — a compromised service-role key would let an attacker rewrite history).
- Midtrans key rotation procedure — each store stores their own Midtrans server key in `settings.midtrans_server_key`; document rotation and verify cleared keys do not silently fall back to env defaults.
