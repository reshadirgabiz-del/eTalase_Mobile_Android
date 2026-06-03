# Legal Policy Summary

Routes: `/legal/terms` · `/legal/privacy`  
Effective: 30 May 2026  
Framework: Indonesian law (UU ITE, UU PDP) + GDPR (EU 2016/679)

---

## What the documents cover

### Terms of Use (`/legal/terms`)
Effective date updated to **1 Juni 2026**. Total sections: 15.

| # | Section | Status |
|---|---------|--------|
| 1 | Acceptance of terms | ✅ Written |
| 2 | Service description — platform as tool, not party to transactions | ✅ Written |
| 3 | Eligibility & account registration | ✅ Written |
| 4 | User rights & obligations (UU ITE, UU PDP, UU PPTPPU references) | ✅ Written |
| 5 | **Merchant obligations & prohibited products** — prohibited list, right to remove/block on any report | ✅ Written |
| 6 | **Fraud, scam & money laundering prevention** — AML, structuring, PPATK reporting rights | ✅ Written |
| 7 | Subscription & payment terms (trial, billing, cancellation, refund) | ✅ Written |
| 8 | Content ownership & IP | ✅ Written |
| 9 | **Third-party services** — Midtrans, bank transfer, Biteship/courier explicitly disclaimed | ✅ Written |
| 10 | **Limitation of liability** — merchant-customer disputes, fraud by merchants, 3rd party failures | ✅ Written |
| 11 | **Indemnification** — merchant-specific; covers merchant fraud toward customers | ✅ Written |
| 12 | **Termination & content moderation rights** — right to act on any report, no prior notice required | ✅ Written |
| 13 | Governing law (Indonesian courts, Jakarta Selatan) | ✅ Written |
| 14 | Changes to terms (14-day notice) | ✅ Written |
| 15 | Contact (incl. abuse reporting channel) | ✅ Written |

### Privacy Policy (`/legal/privacy`) — GDPR framework
| # | Section | GDPR Article | Status |
|---|---------|--------------|--------|
| 1 | Data controller & DPO identity | Art. 13(1)(a-b) | ✅ Written |
| 2 | Categories of data collected | Art. 13(1)(d) | ✅ Written |
| 3 | Legal basis for processing (table) | Art. 6, Art. 13(1)(c) | ✅ Written |
| 4 | Purposes of processing | Art. 13(1)(c) | ✅ Written |
| 5 | Third-party recipients & DPA requirement | Art. 13(1)(e) | ✅ Written |
| 6 | International data transfers (SCC) | Art. 46 | ✅ Written |
| 7 | Retention periods | Art. 13(2)(a) | ✅ Written |
| 8 | Data subject rights (access, rectification, erasure, restriction, portability, objection, withdrawal) | Art. 12–22 | ✅ Written |
| 9 | Cookie policy | ePrivacy Directive | ✅ Written |
| 10 | Security measures (TLS, encryption, RBAC) | Art. 32 | ✅ Written |
| 11 | Children's data | Art. 8 | ✅ Written |
| 12 | Policy changes (30-day notice) | Art. 13(2)(b) | ✅ Written |
| 13 | Contact & supervisory authority right | Art. 13(2)(d), Art. 77 | ✅ Written |

---

## What is still missing — implementation gaps

These points are **stated in the documents** but have no corresponding technical implementation yet. They represent compliance debt that must be resolved before the documents are legally defensible.

### High priority — ✅ IMPLEMENTED (2026-05-30)

| Item | Implemented in |
|------|----------------|
| **Cookie consent banner / CMP** | `src/components/common/CookieConsent.tsx` · wired via `providers.tsx` · consent stored in `localStorage` as `etlase_cookie_consent` (`'essential'` or `'all'`) |
| **Data subject rights portal (DSR)** | "Privasi & Hak atas Data" section on `/dashboard/account` · self-service export + email link to `privacy@e-talase.com` for other rights |
| **Account & data deletion** | `DELETE /users/me` (already existed) + UI in `/dashboard/account` danger zone · blocks if user still owns stores (must transfer first) |
| **Data portability export** | `GET /users/me/export` backend endpoint · `usersApi.exportMe()` frontend · "Ekspor Data" button on `/dashboard/account` downloads JSON |

### Medium priority (operational & organisational)

| Gap | Required by | What to build / do |
|-----|-------------|---------------------|
| **DPO appointment** | GDPR Art. 37 (if applicable) | Formally appoint a Data Protection Officer if processing is carried out on a large scale or involves systematic monitoring. Document the appointment. The DPO email (`dpo@e-talase.com`) is referenced but the role must be filled. |
| **Data Processing Agreements (DPAs) with sub-processors** | GDPR Art. 28 | Signed DPAs with Clerk, Supabase, and any payment gateway. Privacy policy states these exist — they must be in place before the policy is live. |
| **Legitimate Interest Assessment (LIA)** | GDPR Art. 6(1)(f) | For the two processing activities based on "legitimate interest" (fraud prevention, analytics), a documented LIA must be completed and kept on file. |
| **Records of Processing Activities (RoPA)** | GDPR Art. 30 | An internal register documenting all processing activities, purposes, legal bases, and sub-processors. Not user-facing but mandatory for organizations above 250 employees or for high-risk processing. |
| **Data Breach Notification procedure** | GDPR Art. 33–34 | An internal runbook: who to notify (DPA within 72 h, affected users without undue delay), what information to include, and which team member is responsible. The privacy policy commits to 72-hour notification — this process must exist. |

### Lower priority (completeness & best practice)

| Gap | Required by | Notes |
|-----|-------------|-------|
| **Data Protection Impact Assessment (DPIA)** | GDPR Art. 35 | Required before processing that is "likely to result in a high risk." Relevant if the platform processes payment or location data at scale. |
| **Consent tracking log** | GDPR Art. 7(1) | If any processing relies on consent (e.g., marketing emails), you must be able to demonstrate that consent was given — timestamp, version of policy, channel. |
| **Merchant-as-controller notice** | GDPR Art. 28 | Merchants who use this platform to process their customers' data are themselves Data Controllers. They need a standard Data Processing Agreement with e-talase (acting as Processor) and must agree to it during onboarding. |
| **Footer links to legal pages** | UX / legal visibility | Terms and Privacy links should appear in the app footer, sign-up flow, and checkout page so users can access them before agreeing to any terms. Currently no footer exists in the dashboard or storefront. |
| **Versioning & changelog for policies** | Best practice | Store previous versions of both documents (e.g., in `/public/legal/`) so there is a record if a dispute arises about what a user agreed to. |
| **Email unsubscribe mechanism** | CAN-SPAM / GDPR Art. 21(3) | All marketing emails must include a one-click unsubscribe that is honoured within 10 business days. |

---

## Recommended next steps (ordered)

1. Add footer links to `/legal/terms` and `/legal/privacy` in the dashboard and storefront layouts
2. Implement account deletion flow (Clerk + Supabase cascade delete)
3. Build data export endpoint for merchant data portability
4. Add cookie consent banner (can use a lightweight open-source CMP)
5. Sign DPAs with Clerk, Supabase, and payment providers
6. Complete and document a LIA for analytics and fraud-prevention processing
7. Draft the Merchant-as-Controller DPA to present during onboarding
8. Appoint and document DPO
9. Write internal data breach response runbook
