# Google Play Publishing Guide for e-Talase

Last checked: 2026-06-29

This guide is tailored to this Android project:

- App name: `e-Talase`
- Package name: `com.etalase.mobile`
- Expo slug: `etalase-mobile`
- Version: `1.0.0`
- Production API URL: `https://api.e-talase.com`
- Production web app URL: `https://app.e-talase.com`
- Google Play artifact type: Android App Bundle (`.aab`), not APK

Official references:

- Google Play create app and store listing: https://support.google.com/googleplay/android-developer/answer/9859152
- Google Play dashboard setup: https://support.google.com/googleplay/android-developer/answer/9859454
- Google Play release rollout: https://support.google.com/googleplay/android-developer/answer/9859348
- Google Play publish app: https://support.google.com/googleplay/android-developer/answer/9859751
- Google Play Data safety form: https://support.google.com/googleplay/android-developer/answer/10787469
- Target API requirements: https://support.google.com/googleplay/android-developer/answer/11926878

## 0. Before You Start

Create or verify these assets and pages first:

- Google Play Developer account.
- Privacy policy URL. Required for Data safety and strongly recommended for this app.
- Support email, for example `support@e-talase.com`.
- Support website, for example `https://app.e-talase.com`.
- App icon. Current config uses `./UI:UX/assets/favicon.png`.
- Feature graphic: 1024 x 500 PNG or JPG.
- Phone screenshots. Existing screenshots are in `UI:UX/screenshots/`.
- Demo account or reviewer instructions, because the app requires login through the web dashboard QR/code flow.

Important project checks before upload:

- Google Play now requires new Android apps and updates to target Android 15 / API 35 or higher from August 31, 2025. Confirm the generated Expo build targets API 35+ before submission.
- `app.json` currently declares `android.permission.RECORD_AUDIO`, but the code search did not show a clear audio recording feature. Remove unused permissions before publishing, because Play review can flag permissions that are not needed.
- Google Play production releases should use `.aab`, not the existing `.apk` files in the repo.

## 1. Build the Production App Bundle

Install dependencies:

```bash
npm install
```

Check Expo project health:

```bash
npx expo-doctor
```

Build a production Android App Bundle:

```bash
npx eas build --platform android --profile production
```

Expected result:

- EAS creates a production `.aab`.
- The build uses the `production` profile from `eas.json`.
- `autoIncrement` is enabled, so EAS should increase the Android version code automatically.

Do not upload:

- `etalase-v1.0.0-20260625-1440.apk`
- `build-1782487730778.apk`

Those are APK files. Use the `.aab` from the production EAS build.

## 2. Create the App in Play Console

Go to Play Console > Home > Create app.

Fill the form like this:

| Field | What to fill |
| --- | --- |
| App name | `e-Talase` |
| Default language | `Indonesian (Indonesia)` if your primary market is Indonesia, otherwise `English (United States)` |
| App or game | `App` |
| Free or paid | `Free` |
| Declarations | Accept Developer Program Policies, US export laws, and Play App Signing terms |

After creation, remember that the package name `com.etalase.mobile` is permanent after the first upload. Do not change it unless you intentionally want a separate app.

## 3. Main Store Listing

Go to Grow users > Store presence > Main store listing.

### App Details

Use this as a starting point.

App name:

```text
e-Talase
```

Short description, Indonesian:

```text
Kelola toko, produk, pesanan, link order, dan pengiriman e-Talase dari ponsel.
```

Short description, English alternative:

```text
Manage e-Talase stores, products, orders, order links, and shipments from mobile.
```

Full description, Indonesian:

```text
e-Talase membantu pemilik dan admin toko mengelola operasional toko dari ponsel.

Dengan aplikasi ini, pengguna yang sudah memiliki akun e-Talase dapat memilih toko, melihat produk, memantau pesanan, mengelola link order, mengikuti status pengiriman, menerima notifikasi aktivitas toko, dan mengunggah foto bukti pengiriman.

Fitur utama:
- Login aman melalui kode atau QR dari dashboard web e-Talase
- Pilih dan kelola toko yang terhubung dengan akun Anda
- Lihat daftar produk dan detail produk
- Unggah gambar produk dari galeri
- Pantau pesanan dan detail item pesanan
- Unggah foto bukti pengiriman dari kamera atau galeri
- Lihat status pengiriman dan label pengiriman
- Terima notifikasi aktivitas toko

Aplikasi ini ditujukan untuk pengguna e-Talase yang sudah memiliki akses toko. Untuk menggunakan aplikasi, masuk melalui dashboard web di https://app.e-talase.com.
```

Full description, English alternative:

```text
e-Talase helps store owners and admins manage their store operations from their phone.

Existing e-Talase users can select a store, view products, monitor orders, manage order links, follow shipment status, receive store activity notifications, and upload proof-of-shipment photos.

Key features:
- Secure login using a code or QR from the e-Talase web dashboard
- Select and manage stores connected to your account
- View product lists and product details
- Upload product images from the photo library
- Track orders and order item details
- Upload shipment proof photos from camera or photo library
- View shipment status and shipping labels
- Receive store activity notifications

This app is intended for e-Talase users who already have store access. To use the app, sign in through the web dashboard at https://app.e-talase.com.
```

### Graphics

Upload:

| Asset | What to use |
| --- | --- |
| App icon | Use a clean 512 x 512 icon derived from `UI:UX/assets/favicon.png` |
| Feature graphic | Create a 1024 x 500 graphic with the e-Talase brand and app screens |
| Phone screenshots | Use screenshots from `UI:UX/screenshots/`; include login/help, store select, products, orders, order detail, shipments, profile |
| 7-inch tablet screenshots | Optional unless you want tablet optimization |
| 10-inch tablet screenshots | Optional unless you want tablet optimization |
| Promo video | Leave blank unless you have a real demo video |

Recommended screenshot order:

1. `UI:UX/screenshots/login-page.jpg`
2. `UI:UX/screenshots/select-store.jpg`
3. `UI:UX/screenshots/products-page.jpg`
4. `UI:UX/screenshots/orders-page.jpg`
5. `UI:UX/screenshots/order-item.jpg`
6. `UI:UX/screenshots/shippings-page.jpg`
7. `UI:UX/screenshots/profile-page.jpg`

## 4. Store Settings

Go to Grow users > Store presence > Store settings.

Fill the form like this:

| Field | What to fill |
| --- | --- |
| App category | `Business` or `Productivity`; choose `Business` if positioning this as a seller/admin tool |
| Tags | Use tags related to business management, ecommerce, order management, or productivity if available |
| Contact email | Your support email, for example `support@e-talase.com` |
| Website | `https://app.e-talase.com` or a public marketing/support page |
| Phone | Optional, but add a real business support number if available |
| External marketing | Choose based on your preference; not required for publishing |

## 5. App Access

Go to Policy and programs > App content > App access.

Because this app requires authentication, choose:

```text
All or some functionality is restricted.
```

Provide reviewer instructions. Use this template and replace the placeholders:

```text
This app is for e-Talase store owners/admins and requires an e-Talase account.

Reviewer steps:
1. Open https://app.e-talase.com/dashboard/account in a desktop or mobile browser.
2. Sign in using the reviewer account below.
3. Open the Mobile App section.
4. Generate a mobile login code or QR code.
5. Open the Android app.
6. Enter the login code or scan the QR code.
7. Select the demo store.
8. Review Products, Orders, Order Links, Shipments, Notifications, and Profile.

Reviewer account:
Email: TODO_REVIEWER_EMAIL
Password: TODO_REVIEWER_PASSWORD

Demo store:
Name: TODO_DEMO_STORE_NAME

Notes:
The QR/code expires after 10 minutes. If it expires, generate a new code from the dashboard.
```

Do not submit without a working reviewer account. If Google cannot access the app, review will fail.

## 6. Ads

Go to Policy and programs > App content > Ads.

Based on the current codebase, fill:

```text
Does your app contain ads? No.
```

Only choose `Yes` if you add an ads SDK or show advertising content later.

## 7. Privacy Policy

Go to Policy and programs > App content > Privacy policy.

Fill:

```text
TODO_PRIVACY_POLICY_URL
```

The privacy policy should describe at least:

- Account login and authentication through Clerk.
- Store, product, order, shipment, and notification data handled by e-Talase.
- Uploaded product images and proof-of-shipment photos.
- Push notification tokens.
- Support/contact channels.
- Data deletion request process.
- Third-party processors, including Clerk and Expo push notifications if used in production.

## 8. Data Safety

Go to Policy and programs > App content > Data safety.

This is the highest-risk form. Google states that you are responsible for complete and accurate declarations, including data handled by SDKs. Verify this against your backend, Clerk setup, Expo services, logging, analytics, and storage before submitting.

Recommended answers for the current app behavior:

| Question | Recommended answer |
| --- | --- |
| Does your app collect or share any required user data types? | `Yes` |
| Is all user data collected by your app encrypted in transit? | `Yes`, if all production endpoints use HTTPS |
| Do you provide a way for users to request that their data is deleted? | `Yes`, if your privacy policy or support process allows deletion requests |
| Has your app been independently validated against a global security standard? | `No`, unless you have completed MASA or equivalent validation |

Likely collected data types:

| Data type | Collected? | Shared? | Required or optional | Purpose |
| --- | --- | --- | --- | --- |
| Personal info > Email address | Yes, through account login | No, unless sent to third parties outside service providers | Required | Account management, app functionality, security |
| Personal info > User IDs | Yes, Clerk/user/store IDs | No, unless sent to third parties outside service providers | Required | Account management, app functionality, security |
| Photos and videos > Photos | Yes, product images and shipment proof photos when uploaded | No, unless sent to third parties outside service providers | Optional | App functionality |
| App activity > App interactions | Likely yes if backend logs requests or SDKs record usage | Verify | Required or optional depending on implementation | App functionality, analytics, security |
| App info and performance > Crash logs | Verify; declare Yes if Expo, native crash reporting, Play SDK, or another SDK collects this | Verify | Usually optional/automatic | Analytics, diagnostics |
| App info and performance > Diagnostics | Verify | Verify | Usually optional/automatic | Analytics, diagnostics |
| Device or other IDs | Yes if push notification tokens or SDK instance IDs are collected | No, unless sent to third parties outside service providers | Optional for push notifications, otherwise required if automatic | App functionality, developer communications |
| Financial info > Purchase history | Possibly yes if order history is considered purchases/transactions visible in-app | Verify backend semantics | Required | App functionality |
| Personal info > Name, phone number, address | Only declare if the mobile app/backend exposes or transmits customer/order recipient details tied to users | Verify | Required if present | App functionality |

For each collected data type, answer:

- Data is collected: `Yes`.
- Data is shared: usually `No` if Clerk, hosting, storage, and push providers are service providers processing on your behalf. Choose `Yes` if data is transferred to another company for its own purposes, advertising, analytics, or independent processing.
- Data is processed ephemerally: usually `No` for account/order/photo/push-token data because it is stored.
- Users can request deletion: `Yes` only if you provide a real deletion request mechanism.
- Collection required: account/store/order data is `Required`; photo uploads and push notification token collection can be `Optional` if users can use core functionality without uploading photos or enabling push.

Security practices:

| Field | What to fill |
| --- | --- |
| Data encrypted in transit | `Yes`, assuming HTTPS is enforced for `https://api.e-talase.com`, Clerk, and Expo services |
| Users can request data deletion | `Yes`, if privacy policy includes deletion instructions |
| Independent security review | `No`, unless completed |
| Committed to Families policy | `No`, because this app is not targeted to children |

## 9. Content Rating

Go to Policy and programs > App content > Content rating.

Use these suggested answers:

| Question area | What to answer |
| --- | --- |
| App category | Utility/productivity/business app, depending on available questionnaire options |
| Violence, fear, sexual content, controlled substances, gambling | `No` |
| User-generated content | Usually `No` for public UGC; uploaded product/shipment photos are business content and not publicly social content. If Play asks broadly whether users can upload content, answer truthfully and mention product/shipment images are account-restricted. |
| Online interaction | `No` for public user-to-user interaction, unless messaging/chat is added later |
| Shares location | `No`, based on current permissions and code |
| Digital purchases | `No`, unless the app sells digital goods inside the app |

Expected rating should be suitable for general audiences, but the final rating depends on the questionnaire.

## 10. Target Audience and Content

Go to Policy and programs > App content > Target audience and content.

Suggested answers:

| Field | What to fill |
| --- | --- |
| Target age groups | `18 and over` |
| Could your store listing unintentionally appeal to children? | `No` |
| Families policy | Do not opt in |

Reasoning: this is a business/admin app for store owners and staff, not a consumer app for children.

## 11. News App

Go to Policy and programs > App content > News apps.

Fill:

```text
Is your app a news app? No.
```

## 12. COVID-19 / Health Declarations

If Play Console asks about health, medical, or COVID-19 functionality, answer:

```text
No.
```

The current app is an ecommerce/store operations tool, not a health or medical app.

## 13. Financial Features Declaration

If Play Console asks about financial features, answer based on the current production behavior:

- If the mobile app only displays order/payment status and does not process payments, loans, investments, banking, insurance, crypto, or money transfer: choose `No financial features`.
- If you add in-app payment processing later: update the declaration and policy documents.

## 14. Government Apps Declaration

If Play Console asks whether this is a government app, answer:

```text
No.
```

## 15. Permissions Declaration

The current app uses:

- Camera: QR login scanning and shipment proof photo capture.
- Photos/media library: selecting product images and shipment proof photos.
- Notifications: store activity notifications.
- Secure storage: auth/session token storage.

Use these explanations if Play asks:

| Permission | Explanation |
| --- | --- |
| Camera | Used to scan the mobile login QR code and capture proof-of-shipment photos when the user chooses the camera option. |
| Photos/media | Used to let users select product images and proof-of-shipment photos from their device library. |
| Notifications | Used to send store activity updates to authenticated store admins who enable notifications. |
| Record audio | Remove before publishing unless you add an audio feature. Do not claim this permission if unused. |

## 16. Data Deletion

If Play Console asks for account deletion or data deletion links, provide a real page or privacy policy section.

Suggested public text:

```text
Users can request account or store data deletion by contacting support at support@e-talase.com from the email address associated with their e-Talase account. Deletion requests are reviewed and processed according to legal, tax, fraud-prevention, and operational retention requirements.
```

If you support self-service deletion in the web dashboard, link directly to that page instead.

## 17. Pricing and Countries

Go to Monetize > Products > App pricing or the production setup flow.

Suggested answers:

| Field | What to fill |
| --- | --- |
| App price | `Free` |
| Countries / regions | Start with `Indonesia` if that is your primary market. Add more countries only if support, legal terms, and backend operations are ready. |
| Managed Google Play | Leave disabled unless distributing privately to organizations |

## 18. Testing Track

Before production, create an internal test.

Go to Test and release > Testing > Internal testing.

Steps:

1. Create a testers email list or Google Group.
2. Create a new release.
3. Upload the production `.aab`.
4. Add release notes.
5. Review and roll out to internal testing.
6. Install from the tester link and verify login, store select, products, orders, uploads, notifications, and logout.

Release notes for internal testing:

```text
Initial Android test release for e-Talase mobile.

Includes QR/code login, store selection, product management, order monitoring, shipment views, proof photo uploads, notifications, and profile tools.
```

If your Play Developer account is a personal account created after November 13, 2023, Google may require closed testing with testers before production access. Follow the dashboard requirement shown in your account.

## 19. Production Release

Go to Test and release > Production > Create new release.

Fill:

| Field | What to fill |
| --- | --- |
| App bundle | Upload the production `.aab` from EAS |
| Release name | Use the generated version, for example `1.0.0` |
| Release notes language | Match store listing language |
| Release notes | Use the text below |

Release notes, Indonesian:

```text
Rilis awal e-Talase untuk Android.

Fitur:
- Login menggunakan kode atau QR dari dashboard web
- Pilih toko yang terhubung dengan akun
- Lihat produk, pesanan, link order, dan pengiriman
- Unggah gambar produk dan foto bukti pengiriman
- Terima notifikasi aktivitas toko
```

Release notes, English:

```text
Initial e-Talase release for Android.

Features:
- Sign in using a code or QR from the web dashboard
- Select stores connected to your account
- View products, orders, order links, and shipments
- Upload product images and proof-of-shipment photos
- Receive store activity notifications
```

Rollout recommendation:

- First release: use a small staged rollout if available, for example 10% to 20%.
- Monitor Android vitals, crashes, login issues, upload failures, and backend errors.
- Increase rollout only after the first production users can complete the main workflows.

## 20. Final Pre-Submission Checklist

Before clicking Submit for review:

- Production `.aab` built and uploaded.
- Package name is `com.etalase.mobile`.
- Target SDK is API 35 or higher.
- Unused `RECORD_AUDIO` permission removed or justified by a real feature.
- Store listing has app name, short description, full description, icon, feature graphic, and screenshots.
- Support email works.
- Privacy policy URL is public and accurate.
- App access includes working reviewer credentials and QR/code login instructions.
- Data safety answers match backend, Clerk, Expo, push notifications, logs, and storage.
- Content rating completed.
- Target audience set to adults/business users.
- Ads declaration set to `No`.
- Countries and pricing selected.
- Internal test passed on at least one real Android device.
- Upload product image flow tested.
- Upload shipment proof photo from camera and gallery tested.
- Push notification opt-in/registration tested, or disabled until ready.
- Logout tested.

## 21. After Approval

After Google approves the release:

1. Publish or resume rollout if managed publishing is enabled.
2. Check Play Console > Android vitals daily during the first week.
3. Watch backend logs for authentication, upload, and notification failures.
4. Keep the reviewer/demo account active for future updates.
5. For every update, increment version/build number through EAS and update release notes.

