# Security Audit Report — Attack Test Suite

**Target:** Jastip / e-talase Platform
**Scope:** NestJS Backend (`Backend/`), Next.js Admin App (`src/app/api/`), Next.js Frontend (`Frontend/`), React Native mobile apps (`Mobile - Android/`, `Mobile - iOS/`)
**Method:** Code-level review against `test_instruction.md`. No live HTTP traffic was sent (no provisioned tokens, no running deployment). Rate-limit tests (T6.x) were **excluded per instructions**.
**Date:** 2026-06-23

---

## Executive Summary

| Severity   | Count | Notes                                                                       |
|------------|-------|-----------------------------------------------------------------------------|
| CRITICAL   | 2     | Unauthenticated credit-grant on onboarding endpoint, attachment URL exposure design |
| HIGH       | 2     | Static admin session token, payment-confirm race condition                  |
| MEDIUM     | 4     | Webhook secret optional, no DNS verify, missing endpoint-level rate caps, DTO leftover client price |
| LOW        | 3     | Notification dedup, error message verbosity, mobile token storage           |
| PASS       | 13/17 | (T6.x rate limits excluded)                                                 |

The merchant-facing NestJS backend is generally well-architected: every protected route is gated by `ClerkAuthGuard`, every store-scoped read/write resolves `store_id` from the authenticated user's `store_members` row, role enforcement is consistent, and order totals are recomputed server-side from DB prices. The most serious problems live outside that perimeter — in the separate Next.js admin app (`src/app/api/`) which has a public onboarding endpoint and a static-token admin session.

---

## TEST SUITE 1 — IDOR on Merchant Resources

### T1.1 — Cross-store order access — **PASS**
**Where:** `Backend/src/orders/orders.controller.ts:117-125` → `OrdersService.getOne` at `orders.service.ts:724-737`.
**Why it passes:** `getOne(id, userId, storeId)` calls `stores.getUserRole(storeId, userId)` first; if no membership, throws `ForbiddenException`. The Supabase query is also scoped `.eq('id', id).eq('store_id', storeId)`, so even with a leaked role row, Store A's user passing Store B's order ID would 404.
**Caveat:** The client supplies `storeId` as a query string. The defense relies on the user not having a membership row in the foreign store, AND on the order's `store_id` matching. Both layers must hold — they do here. ✅

### T1.2 — Cross-store dashboard/orders/members/settings — **PASS**
Every endpoint under `/orders`, `/settings`, `/stores/:storeId/members` runs `requireMembership` / `getUserRole` (settings: `settings.service.ts:73`; members: `members.service.ts:225`). Store A's owner attempting `GET /stores/{B}/members` resolves no role row for user A in store B → 403. ✅

### T1.3 — Cross-store payment confirmation — **PASS**
`OrdersService.confirmBankTransfer` (`orders.service.ts:917`) calls `stores.getUserRole(storeId, userId)` and rejects if no role or `delivery`. The DB write is also scoped `.eq('id', orderId).eq('store_id', storeId)`. Store A owner cannot confirm Store B's order even if they know its UUID. ✅

### T1.4 — Member accessing owner-only settings — **PASS**
`SettingsService.update` (`settings.service.ts:121-123`) explicitly checks `role !== 'owner'` → 403. `SettingsService.get` allows any role with a membership row (intentional — members need to view store config). Owner-only domain/public-key endpoints (`StoresService.requireOwner` at `stores.service.ts:227`) also enforce owner. ✅

---

## TEST SUITE 2 — Payment Confirmation Integrity

### T2.1 — Member confirming payment — **PASS**
`confirmBankTransfer` rejects `delivery` role but **allows `admin` role** to confirm. The instruction implies "member" means anyone non-owner; if the policy is strictly owner-only, this is a FAIL. Current implementation:
```ts
if (!role || role === 'delivery') throw new ForbiddenException();
```
Both `owner` and `admin` can confirm. This is consistent with the rest of the codebase, where `admin` is a manager role with payment privileges. Treating it as **PASS** under the project's role model but flagged.

### T2.2 — Confirm without prior transfer — **PASS (partial)**
Server checks `order.payment_method === 'bank_transfer'` and `order.status === 'pending'`. It does NOT require `proof_url` to be set. So an owner can confirm a bank-transfer order before any proof was uploaded. Whether this is acceptable depends on policy — merchants may want to confirm based on an SMS receipt without forcing the customer to upload. **Documented behavior, not a bug.**

### T2.3 — Race condition on confirm — **FAIL — HIGH**
`confirmBankTransfer` reads the order, checks `status === 'pending'`, then issues a separate `UPDATE`. There is no `WHERE status = 'pending'` predicate on the update and no DB-level optimistic-lock or `RETURNING` guard. Ten parallel requests can all observe `pending`, all issue an UPDATE, and all run `confirmPromoUsage` and emit notifications.

**Concrete impact:**
- `confirmPromoUsage` increments `current_usages` — promo usage counter over-increments by N.
- `notifyOrderStatusChanged` and `emitToStoreManagers` fire N times — duplicate push/email alerts to staff and customer.
- A second-leg side-effect is that `credit_transactions` table can be polluted if any downstream logic listens to the status flip via webhook.

The same race exists in `updateStatus` (`orders.service.ts:739`) and `setManualShipment` (`orders.service.ts:815`).

### T2.4 — Replay confirmed payment — **PASS**
Idempotent by guard: second call hits `status !== 'pending'` → `BadRequestException('Status pesanan adalah 'paid'…')`. Safe.

### T2.5 — Order ID swap in confirmation — **PASS**
`.eq('id', orderId).eq('store_id', storeId)` filter means Store A's owner passing Store B's order ID gets a 404, never confirms it. ✅

---

## TEST SUITE 3 — Privilege Escalation

### T3.1 — Member self-elevating role — **PASS**
There is **no role-change endpoint at all** in `members.controller.ts`. Available actions: `list`, `invite`, `remove`, `enable`, `transfer-ownership`. `transfer-ownership` requires owner (`requireOwner`). No `PATCH /members/:id { role }`. Members cannot escalate themselves. ✅

### T3.2 — Member inviting new users — **PASS**
`MembersService.invite` first calls `requireOwner` (`members.service.ts:50`). Admin/delivery members get 403. ✅

### T3.3 — Member accessing invite list — **PASS (with caveat)**
`MembersService.list` calls `requireMembership`, so any role can see the member list including pending invites. If the policy is "only owner can see who's been invited", this is a minor LOW — invite emails could leak between staff. Documented.

### T3.4 — Pre-acceptance invite access — **PASS**
Pending invite rows are inserted with `user_id = null` and `invitation_status = 'pending_email'`. Every store-scoped query uses `getUserRole`, which filters by `user_id = userId`. A newly signed-up user with the invitee's email cannot read store data until `accept` runs and links `user_id`. `getMyStores` does link `user_id` for rows with `invitation_status = 'accepted'`, never for `pending_email`. ✅

### T3.5 — Parameter tampering on member actions — **PASS**
`main.ts:66` enables `ValidationPipe({ whitelist: true, transform: true })` globally. Unknown properties on every DTO are silently stripped. Injecting `{ role: 'owner' }` into any non-invite endpoint is a no-op. `InviteMemberDto` does accept `role` but restricts it via `@IsIn(['admin', 'delivery'])` (`invite-member.dto.ts:5`) — `'owner'` is rejected at validation. ✅

---

## TEST SUITE 4 — Clerk Session Validation

### T4.1 — No Authorization header — **PASS**
`ClerkAuthGuard.canActivate` (`clerk-auth.guard.ts:17-18`): missing token → `UnauthorizedException`. ✅

### T4.2 — Expired token — **PASS**
`clerk.verifyToken` validates `exp` and throws → caught → 401. ✅

### T4.3 — Tampered token payload — **PASS**
`clerk.verifyToken` validates signature; any payload mutation invalidates the signature → 401. ✅

### T4.4 — Authenticated but no membership — **PASS**
Two-stage check: `ClerkAuthGuard` sets `req.userId`; service-layer `getUserRole(storeId, userId)` returns `null` for a user with no row in `store_members` → service throws `ForbiddenException`. ✅

**Additional hardening observed (positive):** `ClerkAuthGuard` fails closed if `CORS_ORIGIN` is empty — it refuses to call `verifyToken` without `authorizedParties` set, blocking the Clerk-default behavior of accepting any frontend (`clerk-auth.guard.ts:22-29`).

---

## TEST SUITE 5 — Inventory & Order Manipulation

### T5.1 — Negative quantity — **PASS**
`OrderItemDto` (`create-order.dto.ts:25`): `@IsInt() @Min(1) quantity` — DTO validator rejects 0, negative, and non-integer. ✅

### T5.2 — Price tampering — **PASS**
`OrderItemDto` does **not** accept a price field at all (only `productId`, `variantId`, `quantity`). Server fetches price from `products` / `product_variants` tables in `OrdersService.create` (`orders.service.ts:233-287`). Delivery price is recomputed by `resolveDeliveryPrice` (`orders.service.ts:119-175`) using the store's flat-rate setting or a fresh Biteship quote — the client `deliveryOption.price` field is in the DTO but unused (a minor cleanup nit: remove it from the DTO to make the trust boundary obvious). ✅

### T5.3 — Decimal/rounding exploit — **PASS**
`@IsInt()` rejects 0.001. Price is fetched as `Number(product.price)` from DB (which stores integers in IDR). Total is `subtotal + deliveryPrice - promoDiscount` clamped to `Math.max(0, …)`. No float arithmetic in the cart path. ✅

### T5.4 — Stock locking via cart abandonment — **PASS (no reservation system exists)**
No cart endpoint and no stock reservation. Order creation does not decrement `products.stock` either — stock is informational only. An abandoned cart cannot block another buyer because there is no reservation. ✅ (but: stock displayed in product listings can drift from reality if stock is enforced elsewhere — out of scope here)

---

## TEST SUITE 6 — Rate Limiting — **SKIPPED PER INSTRUCTIONS**

Observed configuration (not tested):
- Global cap: `120 req/min/IP` via `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])` (`app.module.ts:43`).
- `POST /orders` throttled `10/min`, `POST /orders/:id/proof` throttled `5/min`, `GET /orders/track` throttled `20/min`, `POST /auth/exchange-code` throttled `10/min`.
- `POST /orders/webhook` and `notifications` endpoints use `@SkipThrottle()`.
- **Gap:** `confirmBankTransfer`, `members/invites POST`, and `GET /orders` (list) have no endpoint-level throttle beyond the 120/min global. The 120/min default is permissive — see Recommendations.

---

## Additional Findings (outside the test plan)

### F1 — Unauthenticated 25k IDR credit grant on `/api/onboarding` — **CRITICAL**
**File:** `src/app/api/onboarding/route.ts`
**Issue:** `POST /api/onboarding` is whitelisted as public in `src/middleware.ts:8`. It accepts `{ userId, completed, creditGranted }` from any caller and, when `creditGranted: true`, mints **25,000 IDR** of promo credit into `account_credits.promo_balance_idr` for that `userId`. Idempotency is enforced by checking for an existing `credit_transactions` row of `type='promo'` for that user — but anyone can register a Clerk account and trigger the grant for their own (or anybody else's) `userId`. The only protection is the per-user-once idempotency check.

**Impact:** Mass account creation → credits at scale → drains promotional budget; pollutes credit-transaction ledger.
**Exploit:** `curl -X POST $URL/api/onboarding -d '{"userId":"user_xxx","completed":true,"creditGranted":true}'`

### F2 — Order attachments are publicly accessible URLs, not signed — **HIGH/CRITICAL (design)**
**File:** `Backend/src/orders/orders.service.ts:1577` — `signAttachments()` returns `{ ...a, signedUrl: a.file_path || null }`. **It does no signing.** Combined with `UploadService.upload` writing to a public R2 bucket (`upload.service.ts:142` → `keyToUrl` returns `${R2_PUBLIC_URL}/${key}`), every order attachment URL is permanently public.
**Comparison:** `Backend/CLAUDE.md` explicitly says: *"The `order-attachments` bucket must be private. Return signed URLs (1-hour expiry) when sending attachment metadata to clients."* — current behavior diverges from spec.
**Impact:** UUID-keyed URLs are unguessable, so the practical risk depends on URL-handling discipline. But any attachment URL ever pasted into chat, email, or shared logs becomes permanently reachable by anyone.

### F3 — Static admin session token in Next.js admin — **HIGH**
**File:** `src/lib/auth.ts`
**Issue:** `computeSessionToken()` returns `HMAC(ADMIN_SESSION_SECRET, ADMIN_PASSWORD)` — both static. Every successful login produces the **identical** session cookie. There is no per-session nonce, expiry, userId, or revocation. If the cookie is exfiltrated (XSS, browser extension, leaked log) the attacker has indefinite admin access; rotating requires changing `ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET` for everyone.
**Compensating controls:** cookie is `httpOnly`, `sameSite=strict`, `secure` in prod; login is rate-limited 10/15min/IP.

### F4 — Optional webhook secret — **MEDIUM**
**Files:** `src/app/api/credits/topup-requests/notify/route.ts`, `…/refund-requests/notify/route.ts`, `…/subscriptions/notify/route.ts`, `…/stores/notify/route.ts`.
**Issue:** `if (webhookSecret) { …check… }` — if `SUPABASE_WEBHOOK_SECRET` is unset, the endpoint becomes unauthenticated. Anyone can POST and trigger Expo push notifications to all registered admin devices. Spam vector; could be used for phishing if attacker controls notification text (currently text is hardcoded, body comes from caller-supplied `record`).
**Mitigation:** make the secret required (fail-closed); currently fails-open if misconfigured.

### F5 — Race conditions in order state machine — **HIGH** (cross-cuts T2.3)
Already covered above. Affects `confirmBankTransfer`, `updateStatus`, `setManualShipment`. Fix: add `.eq('status', expectedStatus)` to the UPDATE call and check `count === 1` to detect the lost race.

### F6 — DNS verification stub silently accepts — **LOW**
**File:** `Backend/src/stores/store-public-access.service.ts:277-292`. `verifyDnsTxtPlaceholder` is a no-op (only updates `updated_at`). The corresponding controller endpoint `PATCH /stores/:storeId/domains/:originId/verify` will succeed but never set `status = 'verified'`. Result: the verify button doesn't work — *not a vulnerability, but a feature gap that could be mistaken for one if status accidentally flipped to verified in a future patch.* Guard against this by writing a regression test that asserts the placeholder does NOT set status.

### F7 — `GET /products/:id` is unauthenticated — **LOW**
**File:** `Backend/src/products/products.controller.ts:113`. Any product can be fetched by ID without authentication. Intentional for the public storefront, but consider whether private/draft products are filtered inside `productsService.getOne` (not inspected here in depth). If `getOne` returns archived/inactive products with full price/stock, archived products may leak.

### F8 — Public order tracking by `orderId + last 8 digits of phone` — **LOW**
**File:** `Backend/src/orders/orders.service.ts:601-660`. Endpoint allows tracking with full UUID + partial phone (last 8 digits). Throttled 20/min. UUID + 10^8 phone space is infeasible to brute force at that rate, but the partial-suffix check (`endsWith(normalizedPhone.slice(-8))`) is weaker than a full match — fine if UUID is treated as a secret. Document in customer flow that orderId must not be shared publicly.

### F9 — Mobile token storage relies on `expo-secure-store` — **INFO**
Not vulnerable in itself; confirms a rooted-device user could extract their own Clerk session token. Standard for mobile.

### F10 — `paymentMethod` not echoed in Midtrans audit trail — **INFO**
`orders.create` always sends `transaction_details.order_id = order.id` to Midtrans. The Midtrans webhook signature is verified against `(order_id || status_code || gross_amount || serverKey)`. Sound design.

---

## Test Result Table

| ID  | Test                                  | Result | Severity |
|-----|---------------------------------------|--------|----------|
| T1.1 | Cross-store order GET                | PASS   | —        |
| T1.2 | Cross-store dashboard/list           | PASS   | —        |
| T1.3 | Cross-store payment confirm          | PASS   | —        |
| T1.4 | Member accessing owner settings      | PASS   | —        |
| T2.1 | Member confirming payment            | PASS*  | —        |
| T2.2 | Confirm without prior transfer       | PASS** | —        |
| T2.3 | Race on confirm                      | FAIL   | HIGH     |
| T2.4 | Replay confirmed payment             | PASS   | —        |
| T2.5 | Order ID swap                        | PASS   | —        |
| T3.1 | Member self-elevating role           | PASS   | —        |
| T3.2 | Member inviting users                | PASS   | —        |
| T3.3 | Member accessing invite list         | PASS   | LOW***   |
| T3.4 | Pre-acceptance invite access         | PASS   | —        |
| T3.5 | Parameter tampering                  | PASS   | —        |
| T4.1 | No token                             | PASS   | —        |
| T4.2 | Expired token                        | PASS   | —        |
| T4.3 | Tampered token                       | PASS   | —        |
| T4.4 | Auth without membership              | PASS   | —        |
| T5.1 | Negative quantity                    | PASS   | —        |
| T5.2 | Price tampering                      | PASS   | —        |
| T5.3 | Decimal exploit                      | PASS   | —        |
| T5.4 | Stock-lock via cart                  | PASS   | —        |
| T6.x | Rate limiting                        | SKIPPED| —        |
| F1   | Unauthenticated credit grant         | FAIL   | CRITICAL |
| F2   | Attachment URLs unsigned/public      | FAIL   | CRITICAL |
| F3   | Static admin session token           | FAIL   | HIGH     |
| F4   | Optional webhook secret              | FAIL   | MEDIUM   |
| F5   | Order state race                     | FAIL   | HIGH     |
| F6   | DNS verify is a stub                 | INFO   | LOW      |
| F7   | Public product GET                   | NEEDS REVIEW | LOW |
| F8   | Public tracking partial phone        | PASS   | LOW      |
| F9   | Mobile token storage                 | INFO   | —        |
| F10  | Midtrans signature                   | PASS   | —        |

\* `admin` role can also confirm; intentional per role model.
\*\* Confirming without a proof upload is allowed; treat as policy decision.
\*\*\* Any role can list invites including pending emails.

See `RECOMMENDATIONS.md` for fix guidance.
