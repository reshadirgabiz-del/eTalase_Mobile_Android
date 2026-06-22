# Critical Implementation Checklist Before Play Store

Last reviewed: 22 June 2026

This is the minimum technical shortlist before submitting e-Talase Mobile to Google Play. It is intentionally narrower than `../compliance-checklist.md`.

## Blockers

Comment: ✅ Pages are published for public. ✅ All TODOs in `Mobile - Android/play-store-docs/*.md` updated from publishedpages (e-talase.com, info@mail.e-talase.com, providers, deletion paths). ⏳ I will handle verification points separately.

| Priority | Item | Why it blocks Play Store / production | Implementation target |
| --- | --- | --- | --- |
| P0 | Publish live Privacy Policy URL | Google Play requires a public privacy URL for apps that collect user data. | Add/confirm `https://e-talase.com/privacy.html` or `https://e-talase.com/legal/privacy` is public and stable. |
| P0 | Publish live Support URL | Google Play listing needs a working support contact/path. | Add/confirm `https://e-talase.com/support.html` or equivalent public page. |
| P0 | Remove Play Store doc TODOs | Store submission and legal docs cannot contain placeholder support/provider/privacy statements. | Finalize `Mobile - Android/play-store-docs/PRIVACY_POLICY.md`, `SUPPORT.md`, and `DATA_SAFETY.md`. |
| P0 | Fix Android permissions | Current Android config includes `RECORD_AUDIO`; no reviewed mobile feature justifies audio recording. | Remove `android.permission.RECORD_AUDIO` unless a real feature needs it and privacy/data safety disclose it. |
| P0 | Finalize Google Play Data Safety answers | Data Safety must match actual collection/sharing/security/deletion behavior. | Complete Data Safety based on actual SDKs and backend behavior. |
| P0 | Verify mobile login access control | Mobile app must only expose authorized stores. | Test QR/code login, removed-member access, disabled-member access, and cross-store isolation. |
| P0 | Verify push token store authorization | Token registration should not accept arbitrary `storeId` for authenticated users. | Add/confirm backend membership check before registering/updating notification tokens/preferences. |

## High Priority Before Launch

Comment: (see column)

| Priority | Item | Why it matters | Implementation target | Comment |
| --- | --- | --- | --- | --- |
| P1 | Add Terms/Privacy acceptance gate | Proves users accepted legal terms before use. | Add first-use acceptance with document versions, timestamp, user ID, and metadata where appropriate. | ✅ Implemented: `LegalAcceptanceGate` modal on dashboard layout (Frontend/src/components/common/LegalAcceptanceGate.tsx) + backend `GET/POST /legal/acceptance` storing user_id/version/timestamp/IP/UA in `legal_acceptances` table |
| P1 | Add canonical Terms URL | Terms should be public and linked from app/store listing/support. | Publish `/terms.html` or stable `/legal/terms` URL and link it consistently. | ✅ All dashboard/storefront/cookie links updated to https://e-talase.com/{terms,privacy,support}.html |
| P1 | Add public deletion/support request path | Google Play may require account/data deletion information for login apps. | Publish deletion instructions or form on support/privacy page. | ✅ Created public `/account/delete` page (no auth) referenced by published privacy.html §9; Clerk-backed deletion via existing `DELETE /users/me` is sufficient for in-app path |
| P1 | Clean provider inventory | Privacy/Data Safety must match actual providers. | Confirm Clerk, Supabase, Midtrans, Biteship, Expo/Firebase push, Google Analytics if enabled, hosting/CDN, email, storage. | ✅ Resend (transactional email) added to PRIVACY_POLICY.md, TERMS_OF_SERVICE.md, DATA_SAFETY.md provider tables |
| P1 | Mobile permission fallbacks | Users must not be blocked when optional permissions are denied. | Confirm QR has manual code fallback, notifications can be skipped, photo permissions degrade gracefully. | ✅ Photo permission graceful degradation added to `Mobile - Android/app/(app)/products/[id].tsx` and `Mobile - iOS/app/(app)/products/[id].tsx` (orders/[id].tsx already had it) |
| P1 | Logout/token cleanup | Old device tokens can send notifications after logout/removal. | Ensure mobile logout unregisters push token; member removal/account deletion cleans push/mobile tokens. | ⏳ Will test this |
| P1 | Basic audit logging for sensitive actions | Helps support disputes and security incidents. | At minimum log mobile login exchange, token registration, member removal, account deletion, billing confirmation. | ✅ `audit_logs` table + `AuditService` (Backend/src/common/audit/) wired into: auth.mobile_link.generated, auth.mobile_login.exchanged, auth.mobile_login.exchange_failed, notifications.push_token.registered/unregistered, member.removed, member.ownership_transferred, user.data_exported, user.account_deleted, billing.subscription_confirmed (midtrans + manual), legal.acceptance, notifications.device.revoked |

## Recommended But Not Submission-Blocking

Comment: (see column)

| Priority | Item | Target | Comment |
| --- | --- | --- | --- |
| P2 | Persist mobile QR/code challenges | Replace in-memory code map with DB-backed, hashed, atomic, single-use challenges. | Skip, will use lifetime adjustment from Clerk |
| P2 | Device revocation UI | Let users/admins revoke trusted mobile devices. | ✅ `DevicesPanel` on `/dashboard/account` lists registered devices + revoke button; backend `GET/DELETE /notifications/devices(/:id)`; mobile apps now send `deviceLabel`+`platform` on register |
| P2 | Sitemap | Include legal, support, and pricing pages. | ✅ Added on landing page |
| P2 | Fraud/moderation case tooling | Add structured report intake and internal action log. | ⏳ Pending |
| P2 | Retention jobs | Automate 30-day deletion, 5-year financial, and 12-month security-log policies. | ⏳ Pending |

## Minimum Verification Run

- Install the Android build fresh.
- Scan QR login from the web dashboard.
- Login using manual code with camera denied.
- Confirm code expires after 10 minutes.
- Confirm code cannot be reused.
- Remove or disable the member from the web dashboard, then confirm mobile cannot access that store.
- Register push notifications, logout, and confirm token is removed or no longer targeted.
- Check Android permission prompt list against Play Store Data Safety.
- Open the Privacy URL, Terms URL, and Support URL on a device without login.
- Search Play Store docs for `TODO`, placeholder email, and stale provider names.
