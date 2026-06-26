# APK Recovery Notes

Source APK:

- `etalase-v1.0.0-20260625-1440.apk`

Embedded Expo config identifies this as the customer mobile app, not the admin app:

- App name: `e-Talase`
- Slug: `jastip-mobile`
- Owner: `blackromantic`
- Android package: `com.etalase.mobile`
- EAS project ID: `5eef8e2e-c34c-40bb-a857-81591f4d3d75`
- Scheme: `jastip`
- SDK: `54.0.0`

Latest matching EAS Android build found:

- Build ID: `95561783-01be-46fa-9ce8-4658e3c2ea0c`
- Profile: `preview-apk`
- Created: `2026-06-19T09:40:22.997Z`
- Git commit: `c74e8b3fab673e8a7e6e11e8efce6b0d08d38cca`
- Commit message: `chore: update mobile branding and firebase config`

Important limitation:

The APK contains `assets/index.android.bundle` as Hermes bytecode. Hermes bytecode does not contain the original TypeScript/TSX source. It can be disassembled and mined for strings, route names, function names, constants, and API surface, but it cannot reliably reconstruct the original clean source files.

Recovered artifacts:

- `app.config.json`: embedded Expo config from the APK.
- `eas-fingerprint.json`: EAS fingerprint/source-input JSON found locally at `ef054d90-7cac-4425-bce9-bcfc46ec3df2`.
- `string-inventory.txt`: filtered Hermes string table with route/API/function names.
- Full local extraction remains in `/tmp/jastip_apk_recover_latest`.
- Full Hermes bytecode dump remains in `/tmp/jastip_apk_recover_latest/index.android.hbc.dump`.

Local fingerprint file:

- Path found: `ef054d90-7cac-4425-bce9-bcfc46ec3df2`
- Type: JSON fingerprint metadata, not a source archive.
- Hash: `60e7be07db25113cca528ef04925556615fa2c44`, matching the latest EAS build fingerprint.
- Non-`node_modules` inputs listed: `.gitignore`, `eas.json`, `assets/adaptive-icon.png`, `assets/splash.png`, `android`.
- It confirms config/dependency/native inputs, but it does not contain the original `app/`, `lib/`, `components/`, or TypeScript/TSX source files.

Recovered route inventory:

- `./index.tsx`
- `./auth.tsx`
- `./sign-in.tsx`
- `./store-select.tsx`
- `./how-to-login.tsx`
- `./+not-found.tsx`
- `./(app)/_layout.tsx`
- `./(app)/orders/_layout.tsx`
- `./(app)/orders/index.tsx`
- `./(app)/orders/[id].tsx`
- `./(app)/products/_layout.tsx`
- `./(app)/products/index.tsx`
- `./(app)/products/[id].tsx`
- `./(app)/shipments/_layout.tsx`
- `./(app)/shipments/index.tsx`
- `./(app)/order-links/_layout.tsx`
- `./(app)/order-links/index.tsx`
- `./(app)/notifications.tsx`
- `./(app)/profile/_layout.tsx`
- `./(app)/profile/index.tsx`

Recovered API/domain surface:

- `ordersApi`
- `productsApi`
- `storesApi`
- `settingsApi`
- `notificationsApi`
- `storeNotificationsApi`
- `orderLinksApi`
- `subscriptionsApi`
- `creditsApi`
- `onboardingApi`
- `registerPushTokenForStores`
- `registerPushTokenForUserStores`
- `unregisterPushTokenForUserStores`
- `uploadOrderPhoto`
- `uploadProductImage`
- `createShipment`
- `setManualShipment`
- `revealOrder`
- `getPaymentMethods`
- `getMembers`
- `getRoles`
- `getMemberships`
- `addMember`
- `updateMember`
- `removeMember`

Best next recovery path:

Find the Git repository or local clone that contains commit `c74e8b3fab673e8a7e6e11e8efce6b0d08d38cca`. That will restore the real source. If that source is unavailable, the app must be manually rebuilt from the route/API inventory and bytecode strings; that is a reconstruction, not a true reversal of the original source.
