# Implementation Notes — Routing Midtrans (and Manual Transfer) Through Account Credits

Dokumen ini mencatat **gap antara desain alur** (`merchant_signup_to_subscription_payment_flow.md`) dan **implementasi di kode** (`Backend/src/subscriptions/subscriptions.service.ts`). Setiap pembayaran via Midtrans menambah Account Credits sebesar harga paket, lalu memotong saldo Account Credits dengan jumlah yang sama untuk mengaktifkan paket.

> Status: **Sudah diimplementasi.** Helper privat `topUpCreditsAndActivatePlan()` di `subscriptions.service.ts` menjadi jalur tunggal untuk aktivasi paket dari pembayaran eksternal (Midtrans webhook + admin confirm manual transfer). Lihat bagian "Perubahan yang Sudah Dilakukan" di bawah.

---

## Ringkasan Gap

| Aspek | Desain (dokumen alur) | Implementasi sekarang |
|---|---|---|
| Pembayaran via Midtrans sukses | Top-up Account Credits sebesar `gross_amount`, lalu potong saldo sejumlah harga paket, lalu aktivasi paket | Langsung set `subscriptions` ke `active` tanpa menyentuh tabel `account_credits` |
| Pembayaran via Manual Transfer dikonfirmasi admin | Top-up Account Credits sebesar harga paket, lalu potong saldo, lalu aktivasi paket | Langsung set `subscriptions` ke `active`, tidak ada baris di `credit_transactions` |
| Riwayat top-up | Tercatat di `credit_transactions` dengan `type='topup'` dan referensi `order_id` Midtrans | Tidak tercatat di `credit_transactions` |
| Riwayat pemotongan saldo untuk paket | Tercatat di `credit_transactions` dengan `type='deduction'` (sudah ada untuk metode `credits`, perlu untuk semua metode) | Tercatat hanya jika Merchant memilih `paymentMethod='credits'` (sudah ada di kode) |
| Pemilihan metode bayar di UI | Hanya **Midtrans** & **Manual Transfer** (Account Credits bukan pilihan terpisah, karena selalu dipakai di belakang layar) | Tersedia tiga pilihan eksplisit: `midtrans`, `manual_transfer`, `credits` |

---

## File-File yang Terkait

- `Backend/src/subscriptions/subscriptions.service.ts`
  - `checkout()` — menangani entry-point per metode bayar
  - `handleWebhook()` — menerima notifikasi Midtrans
  - `confirmManualTransfer()` — dipanggil admin untuk verifikasi manual transfer
- `Backend/src/credits/` — modul Account Credits (top-up dari admin sudah ada di sini)
- `Backend/src/subscriptions/dto/checkout-subscription.dto.ts` — DTO yang masih membolehkan `paymentMethod='credits'`
- Frontend halaman `/dashboard/billing` & modal checkout — saat ini menampilkan 3 opsi metode bayar

## Tabel Database yang Terkait

- `subscriptions(id, user_id, plan, status, expires_at, midtrans_order_id, midtrans_token, billing_cycle, amount_paid, payment_proof_url, ...)`
- `account_credits(user_id, balance_idr, updated_at)`
- `credit_transactions(user_id, amount_idr, type, description, reference_id, created_at)` — `type` saat ini: `topup`, `deduction`, `refund`
- `audit_logs(actor_user_id, action, target_type, target_id, metadata)`

---

## Apa yang Perlu Diubah

### 1. Tambahkan helper internal: `topUpCreditsAndActivatePlan()`

Buat satu fungsi private di `SubscriptionsService` yang:

1. Insert ke `credit_transactions` baris top-up:
   ```ts
   { user_id, amount_idr: +finalPrice, type: 'topup',
     description: `Top-up via Midtrans untuk paket ${planLabel}`,
     reference_id: orderId }
   ```
2. Upsert `account_credits.balance_idr += finalPrice`.
3. Insert ke `credit_transactions` baris deduction:
   ```ts
   { user_id, amount_idr: -finalPrice, type: 'deduction',
     description: `Langganan ${planLabel}`,
     reference_id: orderId }
   ```
4. Upsert `account_credits.balance_idr -= finalPrice` (net delta 0 untuk pembayaran eksternal).
5. Cancel record `subscriptions` aktif sebelumnya (kasus upgrade) lalu set baris pending saat ini menjadi `active` dengan `expires_at` sesuai `billing_cycle`.
6. Insert ke `audit_logs` dengan `action='billing.subscription_confirmed'`, metadata berisi `source` (`midtrans_webhook` atau `manual_transfer`), `grossAmount`, `plan`, `billingCycle`, `expiresAt`.
7. Kirim kuitansi email + push notification.

Operasi 1–4 harus atomic; bila tidak memungkinkan dalam satu transaksi Supabase, dokumentasikan urutan + idempotensi via `reference_id` unik (cek `reference_id` belum ada sebelum insert).

### 2. Refactor `handleWebhook()`

Lokasi: `subscriptions.service.ts` baris ±795–820.

Ganti blok yang sekarang:

```ts
await this.supabase.client
  .from('subscriptions')
  .update({ status: 'active', expires_at: ... })
  .eq('midtrans_order_id', order_id)
  .eq('status', 'pending');
// ... applyMemberDowngrade, applyLocationDowngrade, applyProductDowngrade
// ... audit_logs insert
// ... sendPaymentReceipt
```

dengan pemanggilan helper baru:

```ts
await this.topUpCreditsAndActivatePlan({
  userId: sub.user_id,
  plan: sub.plan,
  billingCycle: sub.billing_cycle,
  finalPrice: Number(gross_amount),
  orderId: order_id,
  source: 'midtrans_webhook',
});
```

Tetap pertahankan: filter `order_id.startsWith('SUB-')`, verifikasi signature `SHA512`, mapping status, dan handler `expire/cancel`.

### 3. Refactor `confirmManualTransfer()`

Lokasi: `subscriptions.service.ts` baris ±370–439.

Ganti blok yang langsung set `active` dengan pemanggilan helper yang sama:

```ts
await this.topUpCreditsAndActivatePlan({
  userId: sub.user_id,
  plan: sub.plan,
  billingCycle: sub.billing_cycle,
  finalPrice: planDisplay.priceIdr,   // sudah ada penyesuaian voucher saat pending dibuat
  orderId: sub.midtrans_order_id,
  source: 'manual_transfer',
});
```

Catatan: untuk manual transfer, harga final perlu disimpan di kolom `subscriptions.amount_paid` saat baris `pending` dibuat di `checkout()` agar tidak hilang sebelum admin konfirmasi.

### 4. Sederhanakan UI Checkout

Pada frontend halaman billing:
- Hapus opsi **"Bayar pakai Account Credits"** sebagai metode terpisah di modal checkout. Account Credits bukan jalur eksternal, melainkan saldo internal yang otomatis dipakai di belakang Midtrans/Manual Transfer.
- Tampilkan saldo Account Credits + riwayat top-up & deduction di halaman billing untuk transparansi.
- (Opsional) Beri pesan: "Pembayaran akan menambah saldo Account Credits sebesar harga paket, lalu otomatis digunakan untuk mengaktifkan paket."

### 5. Update DTO

`Backend/src/subscriptions/dto/checkout-subscription.dto.ts`:

- Pertahankan `paymentMethod: 'midtrans' | 'manual_transfer'`.
- Hapus `'credits'` dari union (atau pertahankan untuk skenario internal kelak, tapi sembunyikan dari UI).

### 6. Cabang Free / Voucher 100% Off

Jika `finalPrice === 0` (paket Free atau voucher penuh), **tidak perlu** menyentuh Account Credits. Tetap aktivasi paket langsung tanpa top-up/deduction (logika di `checkout()` baris ±577–628 sudah benar untuk skenario ini).

### 7. Reconciliation Note

Riwayat top-up baru (`credit_transactions.type='topup'` dengan `reference_id` berawalan `SUB-`) akan menjadi sumber rekonsiliasi terhadap settlement report Midtrans. Buat view/laporan yang menjumlahkan top-up per hari dan bandingkan dengan settlement report.

---

## Test Plan

1. **Midtrans sandbox flow**:
   - Saldo awal Account Credits Merchant: 0.
   - Checkout Growth monthly Rp 300.000 via Midtrans.
   - Bayar di sandbox.
   - Setelah webhook → cek `credit_transactions`: 1 baris `topup +300000`, 1 baris `deduction -300000`. Saldo `account_credits` tetap 0.
   - Cek `subscriptions`: ada baris `active` dengan `expires_at = now + 30 hari`.
2. **Voucher 50%**:
   - Checkout Growth monthly dengan voucher `LAUNCH50` (50% off) → `gross_amount = 150000`.
   - Top-up + deduction harus = 150000 (bukan 300000).
3. **Annual**:
   - Checkout Growth annual → `gross_amount = 3000000`. Top-up + deduction = 3000000, `expires_at = now + 365 hari`.
4. **Manual transfer**:
   - Checkout Growth monthly via Manual Transfer.
   - Admin konfirmasi → top-up + deduction harus muncul sama persis seperti flow Midtrans.
5. **Idempotensi**:
   - Kirim webhook Midtrans yang sama dua kali → tidak ada duplikasi `credit_transactions` ataupun `subscriptions`.
6. **Refund**:
   - Refund Midtrans (manual via dashboard) → tambahkan baris `credit_transactions.type='refund'` (atau deduction negatif terbalik), set `subscriptions` ke `cancelled`. (Implementasi terpisah; saat ini belum ada handler refund otomatis.)

---

## Status Saat Ini per File

- `subscriptions.service.ts` — helper `topUpCreditsAndActivatePlan()` ditambahkan; menjadi jalur tunggal aktivasi paket untuk pembayaran eksternal.
- `subscriptions.service.ts → handleWebhook()` — cabang sukses Midtrans memanggil helper dengan `gross_amount` sebagai `finalPrice` dan `source: 'midtrans_webhook'`.
- `subscriptions.service.ts → confirmManualTransfer()` — admin confirm memanggil helper dengan `finalPrice` dibaca dari `subscriptions.amount_paid` (snapshot harga saat checkout, sudah memperhitungkan voucher + cycle), fallback ke catalog price.
- `subscriptions.service.ts → checkout()` — cabang `midtrans` dan `manual_transfer` sekarang menyimpan `amount_paid: finalPrice` di baris `subscriptions` pending agar nilai post-voucher/annual tidak hilang sebelum admin konfirmasi atau webhook tiba.

## Perubahan yang Sudah Dilakukan

1. **Helper baru `topUpCreditsAndActivatePlan({ userId, plan, billingCycle, finalPrice, orderId, source })`**:
   - Idempotensi: cek `credit_transactions.reference_id = orderId AND type='topup'`; bila ada → return.
   - Insert `credit_transactions` (type `topup`, amount `+finalPrice`, ref `orderId`) + upsert `account_credits.balance_idr += finalPrice`.
   - Insert `credit_transactions` (type `deduction`, amount `-finalPrice`, ref `orderId`) + upsert `account_credits.balance_idr -= finalPrice`. Net delta 0.
   - Cancel `subscriptions` aktif sebelumnya milik user, lalu set baris `pending` dengan `midtrans_order_id = orderId` ke `active` + `expires_at` + `amount_paid`.
   - Jalankan `applyMemberDowngrade`, `applyLocationDowngrade`, `applyProductDowngrade` bila relevan.
   - Insert `audit_logs` `billing.subscription_confirmed` dengan `source` (`midtrans_webhook` / `manual_transfer`).
   - Kirim payment receipt email via Clerk lookup.
2. **`handleWebhook()`** kini hanya melakukan: filter `SUB-`, verifikasi signature, mapping status, lalu memanggil helper. Cabang `expire/cancel` tetap menghentikan langganan via `applyPlanExpiry`.
3. **`confirmManualTransfer()`** kini hanya mengambil baris pending lalu memanggil helper.
4. **`checkout()`** menyimpan `amount_paid: finalPrice` pada insert `subscriptions` untuk metode `midtrans` dan `manual_transfer`, sehingga helper punya angka kanonik bila dipanggil belakangan.

## Tidak Diubah (Sengaja)

- Frontend `Frontend/src/app/(dashboard)/dashboard/billing/page.tsx` masih hardcode `paymentMethod = 'credits'`. Cabang `credits` di `checkout()` (deduksi langsung tanpa top-up) tetap dipertahankan karena dipakai UI saat ini. DTO juga tidak diubah.
- Rekonsiliasi & laporan dashboard belum dibuat. Sumber data tersedia: `credit_transactions` baris `topup` dengan `reference_id LIKE 'SUB-%'`.

Implementasi di atas menyelaraskan kode dengan dokumen alur, sehingga jalur akunting Platform terpusat di Account Credits dan rekonsiliasi terhadap Midtrans dapat dilakukan dari satu sumber.
