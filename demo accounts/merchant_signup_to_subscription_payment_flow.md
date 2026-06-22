# End-to-End Process: Merchant Sign-up → Subscription Order → Payment

Dokumen ini menjelaskan alur lengkap dari **Merchant** (pelaku usaha) membuat akun di platform **e-talase**, memilih paket langganan (subscription plan), hingga pembayaran berhasil diproses. Dokumen ini disiapkan untuk keperluan **registrasi merchant aggregator Midtrans** dan menjelaskan secara spesifik posisi Midtrans dalam alur.

> Catatan: Merchant di sini adalah **customer berbayar platform e-talase** (pemilik toko jastip yang berlangganan SaaS). Ini berbeda dari "End Customer" yang membeli produk di storefront milik Merchant.

---

## Actors

| Aktor | Peran |
|---|---|
| **Platform (e-talase)** | Penyedia SaaS multi-tenant untuk pelaku usaha jastip. Pihak yang mendaftar sebagai merchant Midtrans (aggregator). Domain: `e-talase.com`. |
| **Merchant** | Pelaku usaha jastip yang membuat akun dan berlangganan paket di Platform. Membayar biaya langganan bulanan/tahunan kepada Platform. |
| **Midtrans** | Payment gateway yang memproses pembayaran biaya langganan dari Merchant ke Platform. |

---

## Model Pembayaran (Penting)

Semua pembayaran berbayar di Platform melewati satu jalur tunggal: **Account Credits**.

- **Account Credits** adalah saldo internal milik Merchant di Platform e-talase.
- Pembayaran via **Midtrans** maupun via **Manual Bank Transfer** menghasilkan **top-up Account Credits** sebesar harga paket yang dipilih.
- Setelah Account Credits bertambah, saldo tersebut **langsung dipotong** untuk **mengaktifkan paket** yang Merchant pilih (Starter / Growth / Business). Aktivasi terjadi otomatis dalam satu rangkaian transaksi.
- Akibatnya, nilai top-up selalu **persis sama** dengan harga paket (sudah memperhitungkan voucher dan siklus bulanan/tahunan). Tidak ada sisa saldo setelah aktivasi paket.

### Channel Pembayaran via Midtrans

Saat ini direncanakan, akan diaktifkan setelah merchant aggregator Midtrans disetujui:

- Credit Card (Visa, Mastercard, JCB, Amex)
- Bank Transfer / Virtual Account (BCA, BNI, BRI, Mandiri, Permata)
- QRIS
- E-Wallet (GoPay, ShopeePay, Dana, OVO)

### Alternatif di Luar Midtrans

- **Manual Bank Transfer** (saat ini tersedia) — Merchant transfer ke rekening Platform, upload bukti, tim Platform memverifikasi dan menambahkan Account Credits secara manual.

Jalur Midtrans dijelaskan secara lengkap mulai langkah 6.

---

## 1. Merchant Membuka Halaman Pendaftaran

- Merchant mengunjungi `https://e-talase.com` atau langsung halaman `/sign-up`.
- Tidak ada interaksi Midtrans pada tahap ini.

## 2. Membuat Akun (Sign-up)

- Merchant mengisi:
  - Email
  - Password (atau klik tombol Google untuk OAuth)
  - Nama depan & belakang
- Verifikasi email via 6-digit code yang dikirim ke inbox Merchant.
- Setelah verifikasi sukses, Merchant diarahkan ke `/dashboard`. Tidak ada subscription dibuat di tahap ini — Merchant default-nya berada di tier **Free** secara virtual (lihat langkah 4).
- Tidak ada interaksi Midtrans pada tahap ini.

## 3. Onboarding (Profil Bisnis)

- Setelah login pertama kali, Merchant diminta mengisi form onboarding singkat:
  - Nama tampilan
  - Rentang usia
  - Sudah berjualan online? Jika ya: durasi berjualan, kategori produk utama
  - Estimasi pendapatan bulanan, harga produk umum
  - (Opsional) Profil seller di Shopee / Tokopedia
- Setelah onboarding selesai, Merchant berhak menerima **bonus Account Credits** sekali pakai (jika program promosi aktif). Tidak ada uang riil ditarik — saldo internal saja.
- Tidak ada interaksi Midtrans pada tahap ini.

## 4. Status Default: Free Tier

- Setiap akun baru otomatis memiliki akses **paket Free** tanpa perlu checkout.
- Free tier memberi: 1 toko, 5 produk per toko, 10 link pesanan sementara, 3 kode promo (dengan biaya admin Rp 1.000 per transaksi End Customer).
- Tidak ada interaksi Midtrans pada tahap ini.

## 5. Merchant Membuka Halaman Paket / Billing

- Merchant masuk ke `/dashboard/billing` atau `/pricing`.
- Platform menampilkan daftar paket berikut beserta harga, fitur, dan limit
- Tidak ada interaksi Midtrans pada tahap ini.

## 6. Memilih Paket & Konfirmasi Checkout

- Merchant menekan tombol "Pilih Paket" pada paket berbayar (mis. Growth).
- Modal checkout muncul menampilkan:
  - Nama paket & deskripsi
  - Toggle siklus pembelian: **Monthly (30 hari)** atau **Annual (365 hari)**
  - Field opsional **Kode Voucher** (mis. `LAUNCH50` untuk diskon 50%)
  - Pilihan metode pembayaran: **Midtrans** / **Manual Transfer**
  - Total final (auto-update saat voucher / siklus berubah). Nilai inilah yang menjadi **jumlah top-up Account Credits**.
- Tidak ada interaksi Midtrans hingga Merchant menekan tombol "Bayar dengan Midtrans".

## 7. Platform Membuat Transaksi di Midtrans Snap API

Saat Merchant menekan **"Bayar dengan Midtrans"**:

- Platform menghitung **harga final** (harga paket – voucher, dikalikan 10 jika tahunan). Nilai ini adalah jumlah yang akan ditop-up ke Account Credits dan dipotong langsung untuk paket.
- Platform memanggil **Midtrans Snap API** (`POST https://app.midtrans.com/snap/v1/transactions` untuk production, `POST https://app.sandbox.midtrans.com/snap/v1/transactions` untuk sandbox) dengan payload minimal:
  ```json
  {
    "transaction_details": {
      "order_id": "SUB-999999999999-abcdef12",
      "gross_amount": 150000
    },
    "item_details": [
      {
        "id": "growth",
        "name": "e-Talase - Growth (30 hari)",
        "price": 150000,
        "quantity": 1
      }
    ]
  }
  ```
  - Format `order_id`: `SUB-{timestamp}-{userIdSuffix}`. Awalan `SUB-` memudahkan filter di webhook agar Platform dapat membedakan dari order End Customer di flow lain.
  - Otentikasi Snap dilakukan dengan `MIDTRANS_SERVER_KEY` (Basic Auth, server-side).
- Midtrans merespons:
  ```json
  {
    "token": "<token>",
    "redirect_url": "https://app.midtrans.com/snap/v3/redirection/<token>"
  }
  ```
- Token diteruskan ke Merchant untuk membuka Snap UI.

## 8. Merchant Menyelesaikan Pembayaran via Midtrans Snap

- Snap popup terbuka di sisi Merchant via `window.snap.pay(token, callbacks)`. Skrip Snap.js dimuat dari `https://app.midtrans.com/snap/snap.js` (production) atau `https://app.sandbox.midtrans.com/snap/snap.js` (sandbox).
- Merchant memilih channel pembayaran final (mis. BCA VA, QRIS, GoPay).
- Midtrans menampilkan instruksi pembayaran (nomor VA, QR code, deep-link e-wallet).
- Merchant melakukan pembayaran melalui aplikasi bank / e-wallet / kartu.
- Setelah selesai, Snap memanggil callback `onSuccess` / `onPending` / `onError` / `onClose` di sisi Merchant untuk menampilkan toast & refresh halaman billing. **Status final tidak ditentukan dari callback ini** (callback client mudah dimanipulasi).

## 9. Midtrans Webhook → Konfirmasi Server-to-Server

Sumber kebenaran status pembayaran adalah **webhook server-to-server** dari Midtrans ke Platform:

- Midtrans memanggil `POST https://api.e-talase.com/api/subscriptions/webhook` (Notification URL yang dikonfigurasi di Midtrans Dashboard).
- Payload berisi: `order_id`, `transaction_status`, `fraud_status`, `payment_type`, `gross_amount`, `status_code`, `signature_key`, dll.
- Platform melakukan:

  1. **Filter scope** — hanya proses `order_id` yang berawalan `SUB-`.
  2. **Verifikasi signature** anti-spoofing:
     ```
     expectedSignature = SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
     ```
     Jika `payload.signature_key !== expectedSignature` → request ditolak.
  3. **Mapping status**:
     | Midtrans status | Hasil di Platform |
     |---|---|
     | `settlement` | Sukses → top-up Account Credits + aktivasi paket |
     | `capture` + `fraud_status=accept` | Sukses → top-up Account Credits + aktivasi paket |
     | `pending` | Belum diproses (mis. menunggu transfer VA) |
     | `expire` / `cancel` / `deny` | Gagal → tidak ada top-up, tidak ada aktivasi |
     | `refund` / `partial_refund` | Saldo dikembalikan; paket dicabut bila masih aktif |
  4. **Idempotensi** — notifikasi duplikat tidak menggandakan top-up maupun aktivasi paket.

## 10. Top-Up Account Credits & Aktivasi Paket

Pada saat status sukses diterima dari Midtrans (`settlement` atau `capture+accept`):

1. **Top-up Account Credits** — saldo Merchant bertambah sebesar `gross_amount` yang dibayarkan via Midtrans. Catatan top-up disimpan sebagai riwayat transaksi credits dengan referensi `order_id` Midtrans.
2. **Pemotongan untuk paket** — saldo Account Credits langsung dikurangi sejumlah harga paket yang sama, sehingga saldo bersih kembali ke 0 (atau ke saldo sebelumnya jika ada bonus terpisah). Catatan pemotongan disimpan sebagai riwayat transaksi credits.
3. **Aktivasi paket** — paket berbayar Merchant menjadi aktif dengan masa berlaku 30 hari (monthly) atau 365 hari (annual).
4. **Notifikasi & kuitansi** — Merchant menerima email kuitansi (orderId, nama paket, jumlah dibayar, tanggal aktif, tanggal kedaluwarsa) dan push notification konfirmasi.

> Karena top-up + pemotongan terjadi dalam satu rangkaian, secara user-experience Merchant melihat saldo Account Credits-nya tidak berubah, tetapi paket berhasil aktif. Tujuan model ini adalah **menyatukan jalur akunting**: semua aktivasi paket bersumber dari Account Credits, terlepas dari channel pembayaran asalnya.

## 11. Merchant Melihat Status

- Merchant kembali ke `/dashboard/billing`.
- Halaman menampilkan badge "Aktif", tanggal kedaluwarsa paket, riwayat top-up & pemotongan Account Credits, serta tombol untuk perpanjang / upgrade / cancel.

## 12. Renewal

- **Auto-renew** — saat paket mendekati expiry, Platform akan memotong saldo Account Credits Merchant (jika cukup) untuk perpanjangan otomatis. Tidak ada interaksi Midtrans di skenario ini karena dana sudah tersedia sebagai credits.
- **Renewal manual via Midtrans** — bila saldo tidak cukup, Merchant kembali ke halaman billing dan checkout ulang (langkah 6–10). Pola yang sama berlaku: Midtrans → top-up credits → potong credits → paket aktif.

## 13. Edge Cases yang Melibatkan Midtrans

- **Pending VA / QRIS tidak dibayar** → tidak ada top-up Account Credits, paket tetap di tier saat ini. Bila Midtrans mengirim webhook `expire` / `cancel`, transaksi ditandai gagal di Platform.
- **Refund** → ditangani manual oleh tim Platform via Midtrans Dashboard. Bila refund disetujui, saldo Account Credits Merchant dikurangi sebesar refund (atau dibalik bila masih aktif) dan paket berbayar dicabut.
- **Upgrade mid-cycle** → Merchant checkout paket lebih tinggi. Midtrans menagih selisih/harga penuh sesuai konfigurasi, hasilnya tetap masuk sebagai top-up → langsung dipotong untuk paket baru.
- **Reconciliation** → settlement report Midtrans dapat dicocokkan dengan riwayat top-up Account Credits via `order_id` berawalan `SUB-` untuk audit keuangan.

---

## Ringkasan Posisi Midtrans dalam Alur

| Langkah | Aksi | Aktor Utama | Midtrans? |
|---|---|---|---|
| 1 | Buka halaman sign-up | Merchant | Tidak |
| 2 | Buat akun | Merchant | Tidak |
| 3 | Isi onboarding | Merchant ↔ Platform | Tidak |
| 4 | Status default Free | Platform | Tidak |
| 5 | Browse paket | Merchant ↔ Platform | Tidak |
| 6 | Pilih paket + voucher + metode bayar | Merchant ↔ Platform | Tidak |
| **7** | **Platform → Midtrans Snap API (create transaction)** | **Platform ↔ Midtrans** | **Ya** |
| **8** | **Merchant bayar via Snap UI / channel pilihan** | **Merchant ↔ Midtrans** | **Ya** |
| **9** | **Midtrans → Webhook Platform (notification)** | **Midtrans → Platform** | **Ya** |
| 10 | Top-up Account Credits + potong saldo + aktivasi paket | Platform | Tidak |
| 11 | Merchant cek status | Merchant ↔ Platform | Tidak |
| 12 | Auto-renew (dari credits) atau renewal manual (via Midtrans) | Platform (± Midtrans) | Hanya jika renew manual |
| 13 | Refund / upgrade / reconciliation | Platform ± Midtrans | **Ya** (sebagian) |

---

## Diagram Alur (Tekstual)

```
Merchant                        Platform (e-talase)                    Midtrans
   |                                    |                                  |
   |---- sign-up + verify email ------->|                                  |
   |---- onboarding form -------------->|                                  |
   |                                    | (Free tier aktif otomatis)       |
   |                                    |                                  |
   |---- view /pricing ---------------->|                                  |
   |<--- daftar paket ------------------|                                  |
   |                                    |                                  |
   |---- checkout(growth, monthly,                                         |
   |              midtrans, voucher) -->|                                  |
   |                                    |--- Snap createTransaction ------>|
   |                                    |<-- token + redirect_url ---------|
   |<--- snap token --------------------|                                  |
   |                                                                       |
   |---- snap.pay (pilih channel & bayar) -------------------------------->|
   |                                                                       |
   |                                    |<-- webhook notify --------------|
   |                                    |    (verify signature)            |
   |                                    |    (top-up Account Credits)      |
   |                                    |    (potong credits = harga paket)|
   |                                    |    (paket aktif, kirim kuitansi) |
   |<--- email kuitansi + push notif ---|                                  |
   |---- GET /subscriptions/my -------->|                                  |
   |<--- {plan: growth, status: active, expiresAt: ...} -------------------|
```

---

## Catatan untuk Reviewer Midtrans

- Platform e-talase berperan sebagai **SaaS aggregator** — produk yang dijual adalah **paket langganan platform** (Free / Starter / Growth / Business / Enterprise). End Customer dari Merchant **tidak** memakai akun Midtrans ini untuk membeli barang fisik di storefront pada flow ini.
- Setiap pembayaran via Midtrans selalu menghasilkan **top-up Account Credits** sebesar `gross_amount`, lalu **langsung dipotong** dengan jumlah yang sama untuk aktivasi paket. Pola ini memastikan jalur akunting Platform terpusat di Account Credits, sementara Midtrans tetap sebagai satu-satunya payment gateway online untuk dana eksternal.
- Order ID `SUB-{timestamp}-{userIdSuffix}` dijamin unik dan dapat ditelusuri ke Merchant.
- Server-to-server webhook diverifikasi via `SHA512(order_id + status_code + gross_amount + server_key)`; payload yang gagal signature di-reject.
- Tidak ada penyimpanan data kartu di sisi Platform — seluruh tokenisasi & PCI scope ada di Midtrans Snap.
- Dana hasil pembayaran langganan ditujukan untuk **operasional Platform** (bukan dana titipan Merchant), sehingga tidak diperlukan disbursement / split payment di sisi Midtrans untuk flow ini.
