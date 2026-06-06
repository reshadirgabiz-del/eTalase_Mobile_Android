# e-talase Onboarding — Feature Prototype

Standalone Expo app to test the onboarding flow for new e-talase users, **completely separate from the main mobile app**.

## Jalankan secara lokal

```bash
cd "App Onboarding"
npm install
npx expo start
```

Scan QR di terminal pakai **Expo Go** (iOS/Android), atau tekan:
- `w` → buka di browser (web)
- `i` → simulator iOS
- `a` → emulator Android

## Alur onboarding (14 layar)

| # | Layar | Tujuan |
|---|-------|--------|
| 0 | Welcome | First impression + CTA |
| 1 | Fee Intro | Visualisasi potongan platform lain (Shopee 4.5%, Tokopedia 4%, TikTok 6%, Shopify 3%+flat) |
| 2 | Fee Calculator | Input produk: nama, unit terjual/bulan, harga rata-rata (1–3 produk) |
| 3 | Fee Result | Perbandingan biaya bulanan + potensi hemat vs. e-talase Rp 99rb/bln |
| 4 | Order Links | Feature showcase: chat → link → checkout |
| 5 | Stock Management | Feature showcase: stok terpantau + notifikasi |
| 6 | Nama | Nama panggilan |
| 7 | Domisili | Kota/kabupaten |
| 8 | Tipe produk | Dropdown: Fashion, Makanan, Elektronik, dll. |
| 9 | Pengalaman | Baru mulai / Pemula / Menengah / Veteran |
| 10 | Platform | Multi-select: Shopee, Tokopedia, TikTok, Instagram, dll. |
| 11 | Omzet | Range omzet bulan lalu (opsional) |
| 12 | Tujuan | Tujuan pakai e-talase |
| 13 | Done | Summary + debug panel |

## Testing data yang terkumpul

Di layar terakhir (Done), tap **"Tampilkan raw data (dev)"** untuk melihat JSON lengkap semua data yang dikumpulkan beserta hasil kalkulasi fee.

## Fee rates yang digunakan

```
Shopee:    4.5% per transaksi
Tokopedia: 4.0% per transaksi
TikTok:    6.0% per transaksi
Shopify:   3.0% per transaksi + Rp 620.000/bulan (Basic plan)
e-talase:  0% per transaksi + Rp 99.000/bulan flat
```

Ubah di `src/types.ts` → `PLATFORM_FEES` dan `ETALASE_FEE`.

## Integrasi ke app utama

Saat siap diintegrasikan ke `/Mobile`, pindahkan:
- `src/steps/` → `Mobile/app/onboarding/` (rubah menjadi expo-router screens)
- `src/types.ts` → merge ke `Mobile/lib/types.ts`
- `src/constants/theme.ts` → sudah identik dengan `Mobile/constants/theme.ts`

Data onboarding bisa dikirim ke backend via `POST /users/onboarding` saat user selesai step terakhir.
