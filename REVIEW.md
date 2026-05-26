# Backend Logic Review — Jastip Platform

**Date:** 2026-05-20  
**Scope:** All files under `Backend/src/`  
**Excluded (acceptable per brief):** Missing Midtrans/Biteship API keys, payment flow not yet wired up.

---

## Fixed Issues

### 1. Orphaned order on Midtrans failure — `orders.service.ts`
**Severity: Critical**

`snap.createTransaction()` was called *after* the order and order_items rows were already inserted. If the Midtrans call threw (network error, bad keys, etc.), the order stayed in the database in `pending` state forever with no `midtrans_token`, and the order_items were left as dangling rows.

**Fix:** Wrapped `snap.createTransaction` in try/catch. On failure, the order row is deleted (cascades to order_items via FK). Also added an error check on the `order_items` insert itself, which previously swallowed any DB error silently.

---

### 2. Empty items array allowed in order creation — `orders/dto/create-order.dto.ts`
**Severity: High**

`@IsArray()` without `@ArrayMinSize(1)` allowed `items: []`, which would create an order with `subtotal = 0` and no order_items at all.

**Fix:** Added `@ArrayMinSize(1)` to the `items` field.

---

### 3. Signed URLs not returned for order attachments — `orders.service.ts`
**Severity: Critical (spec violation)**

`CLAUDE.md` explicitly states: *"The order-attachments bucket must be private. Return signed URLs (1-hour expiry) when sending attachment metadata to clients."* Both `getOne` and `addAttachment` were returning the raw `file_path` column, which is a private storage path — unusable by clients and a potential info leak.

**Fix:** Added a `signAttachments()` helper that calls `supabase.storage.from('order-attachments').createSignedUrl(path, 3600)` for every attachment. Both `getOne` and `addAttachment` now use it before returning.

---

### 4. Midtrans webhook signature bypass — `subscriptions.service.ts`
**Severity: Critical (security)**

The signature check was:
```typescript
if (payload.signature_key && payload.signature_key !== expectedSignature) {
  return { received: false };
}
```
If `signature_key` was absent from the payload, the condition short-circuited and verification was skipped entirely. An attacker could POST `{ order_id: "SUB-...", transaction_status: "settlement", ... }` with no `signature_key` to activate any pending subscription for free.

**Fix:** Inverted to require the key to be present and matching:
```typescript
if (!payload.signature_key || payload.signature_key !== expectedSignature) {
  return { received: false };
}
```

---

### 5. State machine: `delivered` order cannot be cancelled — `orders.service.ts`
**Severity: Medium**

`CLAUDE.md` states: *"any state can go to cancelled"*. The `VALID_TRANSITIONS` map had `delivered: []`, blocking cancellation of a delivered order.

**Fix:** Changed to `delivered: ['cancelled']`.

---

### 6. Store name/logo not synced to `stores` table — `settings.service.ts`
**Severity: High**

`PATCH /settings` updated `settings.store_name` and `settings.logo_url`, but `GET /stores/my` reads from `stores.name` and `stores.logo_url`. Changing your store name via settings had no effect on the store listing — a silent data inconsistency.

**Fix:** After updating `settings`, a second update now syncs `stores.name` and `stores.logo_url` whenever those fields are present in the request.

---

### 7. Non-atomic ownership transfer — `members.service.ts`
**Severity: High**

`transferOwnership` did two separate DB updates: promote target → demote current owner. A crash or DB error between the two left a store with two owners simultaneously.

**Fix:** Reversed the order (demote first, then promote) and added a compensating rollback — if the promotion fails, the demotion is reverted. This prevents the double-owner state; the worst outcome is now a store temporarily with no owner (recoverable) rather than two owners (unpredictable).

> Note: A fully atomic solution requires a Postgres RPC function (transaction). The current fix is best-effort without schema changes.

---

### 8. Null coordinates not checked before calling Biteship — `delivery.service.ts`
**Severity: High**

If a store had not yet configured `origin_lat`/`origin_lng` (NULL in DB), the Biteship API was called with `null` values, causing an opaque 500 from Axios. The store owner would receive no useful guidance.

**Fix:** Added an explicit check after fetching settings. If either coordinate is null, a `NotFoundException` is thrown with the message `"Alamat asal toko belum dikonfigurasi"`.

---

### 9. Account deletion leaves orphaned owned stores — `users.service.ts`
**Severity: High**

`deleteMe()` deleted `store_members` rows and the Clerk user, but left the `stores`, `products`, `orders`, and `settings` rows intact with no owner. Other members of those stores lost access silently.

**Fix:** Before deletion, the service now queries for stores the user owns. If any exist, a `BadRequestException` is returned: *"Transfer kepemilikan atau hapus semua toko milikmu sebelum menghapus akun"*.

---

### 10. Wrong exception type on member delete DB error — `members.service.ts`
**Severity: Medium**

`remove()` was catching any Supabase error from `delete()` and throwing `NotFoundException('Member not found')`. A real DB error (permissions, network, etc.) would be misreported. Additionally, Supabase `.delete()` returns no error when the row simply doesn't exist — the previous code would return `{ success: true }` for deleting a non-existent member ID.

**Fix:** Added `count: 'exact'` to the delete call. Now throws `Error(error.message)` for DB errors and `NotFoundException` only when `count === 0` (genuinely not found).

---

### 11. Silent no-op on order link delete — `order-links.service.ts`
**Severity: Low**

`remove()` returned `{ success: true }` even when the `id`+`store_id` combination didn't exist in the database.

**Fix:** Added `count: 'exact'` and throws `NotFoundException('Link tidak ditemukan')` when the delete affected 0 rows.

---

## Design Notes (not fixed in code)

### `POST /orders` — No authentication guard (intentional)
The public order creation endpoint has no `ClerkAuthGuard` by design — customers placing orders via a storefront link are not authenticated members. However, there is no rate limiting in place. Consider adding a rate-limit middleware (e.g. `nestjs-throttler`) before exposing this publicly.

### `StoresService.getStoreIdForUser()` — Unused method
This helper exists in `stores.service.ts` but is not called anywhere. If multi-store users are a target, returning a single arbitrary store is incorrect. The method should either be removed or callers should require an explicit `storeId`.

### `CreateProductDto.imageUrl` — Required but no `@IsNotEmpty()`
An empty string `""` passes validation. If the UI always sends a URL this is fine, but worth adding `@IsNotEmpty()` as a defensive measure.

### `UpdateOrderStatusDto.status` — No enum validation at DTO level
Any string passes the DTO; the service enforces the state machine. Adding `@IsIn([...])` at DTO level would catch invalid status values earlier and return a more descriptive 400 message.

---

## Files Changed

| File | Changes |
|---|---|
| `src/orders/dto/create-order.dto.ts` | Added `@ArrayMinSize(1)` on `items` |
| `src/orders/orders.service.ts` | Orphaned order cleanup, items error check, signed URLs, state machine fix |
| `src/subscriptions/subscriptions.service.ts` | Webhook signature bypass fix |
| `src/settings/settings.service.ts` | Sync `stores` table on name/logo update |
| `src/delivery/delivery.service.ts` | Null coordinate guard before Biteship call |
| `src/members/members.service.ts` | Delete error mapping, safer ownership transfer |
| `src/users/users.service.ts` | Block account deletion if user owns stores |
| `src/order-links/order-links.service.ts` | NotFoundException on non-existent link delete |
