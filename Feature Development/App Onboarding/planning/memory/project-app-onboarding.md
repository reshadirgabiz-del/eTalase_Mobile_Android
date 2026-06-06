---
name: project-app-onboarding
description: App Onboarding integration status — ported to Frontend dashboard, saves to Homepage backend via Supabase
metadata:
  type: project
---

App Onboarding (Feature Development/App Onboarding) has been integrated into the Frontend (product app).

**Why:** Show the onboarding flow when a user opens the dashboard for the first time to collect seller profile data and introduce features.

**How to apply:** Onboarding triggers on first dashboard load via `etlase_ob_done_${userId}` localStorage key. Data is saved to Supabase `onboarding_responses` table via the Homepage backend (`/api/onboarding`).

**Key implementation details:**
- `AppOnboardingProvider` in `Frontend/src/lib/onboarding-context.tsx` auto-triggers on first visit
- Overlay component: `Frontend/src/app/(dashboard)/_onboarding/OnboardingOverlay.tsx`
- Slide 15 (Paywall) shows Mantine notification for credit: "Rp25.000 credit telah ditambahkan ke akun kamu! 🎁"
- "Buka toko sekarang!" button closes overlay + saves; "Ada fitur apa lagi?" continues flow
- Homepage backend API: `src/app/api/onboarding/route.ts` (public endpoint, no auth required)
- Migration: `supabase/migrations/20260610_onboarding_responses.sql`
- Tailwind CSS added to Frontend (tailwind.config.ts + postcss.config.cjs updated)

[[project-state]]
