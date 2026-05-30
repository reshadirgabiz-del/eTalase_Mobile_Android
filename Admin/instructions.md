# Jastip Platform — Admin CLI

A local command-line tool for managing the Jastip Platform database as a platform admin. Runs entirely on your machine. No deployment needed.

---

## Structure

```
Admin/
├── packages/db/       Supabase client + TypeScript types
└── apps/cli/          CLI source (commands)
```

---

## First-time Setup

**1. Prerequisites**

- Node.js 18 or later
- npm (included with Node.js)

**2. Install dependencies**

Open a terminal, navigate to this folder, and run:

```bash
cd path/to/Admin
npm install
```

**3. Create your `.env` file**

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Where to find these values:**
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project → **Project Settings** → **API**
- Copy **Project URL** → `SUPABASE_URL`
- Copy **service_role** key (under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`

> The service role key has full database access — keep it out of version control. The `.gitignore` already excludes `.env`.

**4. (Optional) Enable `migrate run`**

If you want to run SQL migration files directly from the CLI, also add `DATABASE_URL` to `.env`:

```
DATABASE_URL=postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres
```

Find this at: **Project Settings** → **Database** → **Connection string** → choose **URI** format.

---

## Running Commands

All commands follow this pattern (always run from the `Admin/` directory):

```bash
npm run admin -- <command> <subcommand> [options]
```

The `--` separator is required by npm to pass arguments to the script.

---

## Commands Reference

### Subscriptions

Manages platform billing subscriptions (per user, linked to store owners).

| Command | Description |
|---|---|
| `subscriptions list` | List all subscriptions |
| `subscriptions list --status active` | Filter by status |
| `subscriptions list --user <partialId>` | Filter by user ID |
| `subscriptions show <userId>` | Show all subscriptions for a user |
| `subscriptions activate <userId> --plan <plan>` | Activate a subscription |
| `subscriptions activate <userId> --plan growth --days 60` | Activate for 60 days |
| `subscriptions expire <id>` | Mark a subscription as expired |
| `subscriptions cancel <id>` | Cancel a subscription |

**Plan names:** `starter` · `growth` · `business` · `enterprise`

**Status values:** `pending` · `active` · `expired` · `cancelled`

**Examples:**

```bash
# List all active subscriptions
npm run admin -- subscriptions list --status active

# Activate a 30-day Growth plan for a user
npm run admin -- subscriptions activate user_2abc123 --plan growth

# Activate a 90-day Business plan
npm run admin -- subscriptions activate user_2abc123 --plan business --days 90

# Show all subscriptions for a specific user
npm run admin -- subscriptions show user_2abc123

# Expire a subscription by its ID
npm run admin -- subscriptions expire 550e8400-e29b-41d4-a716-446655440000

# Cancel a subscription
npm run admin -- subscriptions cancel 550e8400-e29b-41d4-a716-446655440000
```

---

### Vouchers

Manages plan vouchers — discount codes that users can apply when purchasing a subscription plan.

| Command | Description |
|---|---|
| `vouchers list` | List all plan vouchers |
| `vouchers create --code CODE --type TYPE --value N` | Create a voucher |
| `vouchers toggle <code>` | Enable or disable a voucher |
| `vouchers delete <code>` | Delete a voucher permanently |

**Discount types:**
- `percent` — percentage discount (e.g. `20` = 20% off)
- `absolute` — fixed amount in IDR (e.g. `50000` = Rp 50.000 off)

**Options for `create`:**
- `--code` — the voucher code (auto-uppercased)
- `--type` — `percent` or `absolute`
- `--value` — discount amount
- `--max-usages <n>` — limit total uses (omit for unlimited)
- `--expires <YYYY-MM-DD>` — expiry date (omit for no expiry)

**Examples:**

```bash
# List all vouchers
npm run admin -- vouchers list

# Create a 20% discount code, unlimited uses, no expiry
npm run admin -- vouchers create --code WELCOME20 --type percent --value 20

# Create a flat Rp 50.000 off code, max 100 uses, expires end of year
npm run admin -- vouchers create --code SAVE50K --type absolute --value 50000 --max-usages 100 --expires 2026-12-31

# Disable a voucher temporarily
npm run admin -- vouchers toggle WELCOME20

# Delete a voucher (will ask for --yes confirmation if it has been used)
npm run admin -- vouchers delete WELCOME20 --yes
```

---

### Stores

View stores and inspect their members and subscription history.

| Command | Description |
|---|---|
| `stores list` | List all stores with plan and expiry |
| `stores show <storeId>` | Show members + subscription history for a store |
| `stores promo-codes <storeId>` | List promo codes created by a store |

**Examples:**

```bash
# List all stores
npm run admin -- stores list

# Show full details for a store (use the store ID from the list)
npm run admin -- stores show 550e8400-e29b-41d4-a716-446655440000

# List promo codes for a store
npm run admin -- stores promo-codes 550e8400-e29b-41d4-a716-446655440000
```

---

### Migrate

View and execute SQL migration files located at `../supabase/migrations/`.

| Command | Description |
|---|---|
| `migrate list` | List all migration files in order |
| `migrate show <filename>` | Print the SQL of a migration file |
| `migrate run <filename>` | Execute a migration against the database |

> `migrate run` requires `DATABASE_URL` in `.env` (see setup step 4). You can omit the `.sql` extension in the filename.

**Examples:**

```bash
# See all migrations
npm run admin -- migrate list

# Preview a migration before running it
npm run admin -- migrate show 20260532_plan_vouchers

# Run a specific migration
npm run admin -- migrate run 20260532_plan_vouchers
```

---

## Quick Reference

```bash
# Show top-level help
npm run admin -- --help

# Show help for any command
npm run admin -- subscriptions --help
npm run admin -- vouchers --help
npm run admin -- stores --help
npm run admin -- migrate --help
```

---

## Notes

- **User IDs** are Clerk user IDs (format: `user_2abc...`). Find them in the [Clerk Dashboard](https://dashboard.clerk.com) → Users, or in the `store_members` table via `stores show`.
- **Store IDs** and **subscription IDs** are UUIDs. Copy them from the table output (they are truncated in the list view — use `stores show` or Supabase Studio for the full UUID).
- The CLI uses the **service role key**, which bypasses all Row Level Security. Handle your `.env` file carefully.
- All commands must be run from the `Admin/` directory so that relative paths resolve correctly.
