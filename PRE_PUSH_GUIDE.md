# Pre-Push Testing Guide — e-talase

Before merging anything into **main**, run the two-stage process below:  
**Stage 1** — automated checks (fast, ~1–2 min)  
**Stage 2** — manual smoke test (selective, based on what changed)

---

## One-time setup

### 1. Initialize git (if not done yet)

```bash
cd "/Users/anandasyafasativa/Desktop/Projects/Devs/Jastip Platform"
git init
git add .
git commit -m "initial commit"
git branch -M main
# Add your remote:
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Make the check script executable

```bash
chmod +x scripts/check-before-push.sh
```

### 3. (Optional) Install as a git pre-push hook

This runs the checks automatically every time you do `git push`.

```bash
cp scripts/check-before-push.sh .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

> To skip the hook for a one-off push (use sparingly):  
> `git push --no-verify`

---

## Stage 1 — Automated checks

Run this from the project root before every push:

```bash
./scripts/check-before-push.sh
```

What it checks:

| Check | Blocks push? | What fails it |
|---|---|---|
| Backend `nest build` | **Yes** | TypeScript compile errors, missing imports |
| Backend Jest unit tests | **Yes** | Any failing test |
| Backend ESLint | No (warning) | Lint issues |
| Frontend `tsc --noEmit` | **Yes** | TypeScript type errors |
| Frontend ESLint | No (warning) | Lint issues |

If a **blocking check fails**, fix it before pushing. The script exits with code 1.

Lint is non-blocking because there are ~70 pre-existing issues in the codebase. They won't break the app but should be cleaned up over time — run `npm run lint` in Backend or Frontend to see them.

---

## Stage 2 — Manual smoke test

You don't need to test everything every time. Use the table below to decide which sections of [TEST_PROCEDURE.md](TEST_PROCEDURE.md) to run based on what you changed.

| Changed area | Test sections to run |
|---|---|
| Auth / middleware | §1 Authentication, §1.5 middleware redirect |
| Onboarding flow | §2 Onboarding |
| Subscription / billing | §3 Subscription & Billing |
| Store settings | §4 Store Management |
| Products | §5 Products, §6.1–6.2 Storefront |
| Storefront / cart | §6 Storefront, §7 Checkout Flow |
| Checkout / payment | §7 Checkout Flow, §3.3 Midtrans sandbox |
| Orders | §8 Order Management |
| Order links | §9 Order Links |
| Promo codes | §10 Promo Codes |
| Team / invites | §11 Team Members |
| Order tracking | §12 Order Tracking |
| Shipping label | §13 Shipping Label |
| Account / profile | §14 Account Management |
| Mobile app | §15 Mobile App |
| Any backend change | §16 Edge Cases & Regression (pick relevant rows) |
| **Full release / main merge** | All sections §1–§16 |

### Quick smoke test (5 min) for small patches

1. Start both servers:
   ```bash
   # Terminal 1
   cd Backend && npm run start:dev

   # Terminal 2
   cd Frontend && npm run dev
   ```
2. Open `http://localhost:3000` — sign in, load dashboard, confirm no console errors.
3. Visit the storefront: `http://localhost:3000/<your-store-id>` — confirm products load.
4. Check the Backend terminal for any unhandled errors.

---

## Environment checklist

Before running any manual test, confirm these are set:

- `Backend/.env` — `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, `MIDTRANS_SERVER_KEY` all filled in (not placeholder values)
- `Frontend/.env` — `NEXT_PUBLIC_API_URL=http://localhost:3001`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` filled in
- All Supabase migrations have been applied (check `supabase/migrations/`)

---

## Typical push workflow

```bash
# 1. Stage your changes
git add <files>

# 2. Run automated checks
./scripts/check-before-push.sh

# 3. Run the relevant manual smoke test (Stage 2 table above)

# 4. Commit and push
git commit -m "your message"
git push origin main
```

If the pre-push hook is installed, step 2 runs automatically when you `git push`.
